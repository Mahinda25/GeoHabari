import { reconcilePaystackPayment, verifyPaystackWebhookSignature } from './paystack.js';
import { getOrderByReference } from './ticketing-store.js';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, private',
};

function response(payload, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
}

export function createPaystackWebhookHandler({
  reconcile = reconcilePaystackPayment,
  verifySignature = verifyPaystackWebhookSignature,
  loadOrder = getOrderByReference,
} = {}) {
  return async function handlePaystackWebhook(request) {
    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    try {
      if (!verifySignature(rawBody, signature)) {
        return response({ error: 'Invalid Paystack webhook signature.' }, 401);
      }

      let event;
      try {
        event = JSON.parse(rawBody);
      } catch {
        return response({ error: 'Paystack webhook body must contain valid JSON.' }, 400);
      }

      if (event.event !== 'charge.success') {
        return response({ received: true, ignored: true });
      }

      const reference = String(
        event.data?.reference || event.data?.metadata?.order_reference || ''
      ).trim();
      if (!reference) {
        return response({ error: 'Paystack webhook is missing the transaction reference.' }, 400);
      }

      const order = await loadOrder(reference);
      if (!order || order.payment_provider !== 'paystack') {
        return response({ error: 'Paystack transaction could not be matched to an order.' }, 404);
      }
      if (order.status === 'paid') {
        return response({ received: true, status: 'paid', alreadyProcessed: true });
      }
      if (!['pending', 'cancelled'].includes(order.status)) {
        return response({ error: 'Paystack order is not awaiting payment.' }, 409);
      }

      const result = await reconcile(reference, event, { persistCancellation: true });
      if (result.status !== 'paid') {
        return response({ received: true, status: 'pending', retry: true }, 503);
      }

      return response({
        received: true,
        status: result.status,
        alreadyProcessed: result.alreadyProcessed,
        emailSent: result.emailSent,
      });
    } catch (error) {
      console.error('[paystack] Webhook processing failed:', error);
      const status = /could not be matched/i.test(error.message) ? 404
        : /amount or currency|channel does not match/i.test(error.message) ? 409
          : /not configured/i.test(error.message) ? 503 : 502;
      return response({ error: error.message || 'Paystack webhook processing failed.' }, status);
    }
  };
}

const defaultWebhookHandler = createPaystackWebhookHandler();

export async function handlePaystackWebhook(request) {
  return defaultWebhookHandler(request);
}
