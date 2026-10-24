import {
  reconcilePaystackPayment,
  verifyPaystackWebhookSignature,
} from '../../../lib/paystack.js';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, private',
};

export async function POST({ request }) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature');

  try {
    if (!verifyPaystackWebhookSignature(rawBody, signature)) {
      return new Response(JSON.stringify({ error: 'Invalid Paystack webhook signature.' }), {
        status: 401,
        headers: JSON_HEADERS,
      });
    }

    const event = JSON.parse(rawBody);
    if (!['charge.success', 'charge.failed'].includes(event.event)) {
      return new Response(JSON.stringify({ received: true, ignored: true }), {
        status: 200,
        headers: JSON_HEADERS,
      });
    }

    const reference = String(event.data?.reference || '');
    if (!reference) {
      return new Response(JSON.stringify({ error: 'Paystack webhook is missing the transaction reference.' }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    const result = await reconcilePaystackPayment(reference);
    return new Response(JSON.stringify({
      received: true,
      status: result.status,
      alreadyProcessed: result.alreadyProcessed,
    }), { status: 200, headers: JSON_HEADERS });
  } catch (error) {
    console.error('[paystack] Webhook processing failed:', error);
    const status = /could not be matched/i.test(error.message) ? 404
      : /amount or currency|channel does not match/i.test(error.message) ? 409
        : /not configured/i.test(error.message) ? 503 : 502;
    return new Response(JSON.stringify({ error: error.message || 'Paystack webhook processing failed.' }), {
      status,
      headers: JSON_HEADERS,
    });
  }
}
