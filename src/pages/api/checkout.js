import { createOrderCheckout, verifyPaymentAndIssueTickets } from '../../lib/ticketing.js';
import { assertPaystackConfigured, initializePaystackTransaction } from '../../lib/paystack.js';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, private',
};

export async function POST({ request }) {
  let order;
  try {
    const body = await request.json();
    assertPaystackConfigured();
    const checkout = createOrderCheckout(body.event_id, body);
    order = checkout.order;

    const payment = await initializePaystackTransaction(order, checkout.event);
    return new Response(JSON.stringify({
      success: true,
      reference: order.reference,
      access_code: payment.accessCode,
      authorization_url: payment.authorizationUrl,
      message: 'Complete payment in the secure Paystack checkout. Tickets are issued after server verification.',
      pending: true,
    }), { status: 200, headers: JSON_HEADERS });
  } catch (error) {
    if (order) {
      try {
        verifyPaymentAndIssueTickets({
          orderReference: order.reference,
          provider: 'paystack',
          providerReference: order.reference,
          status: 'failed',
        });
      } catch (recordError) {
        console.error('[checkout] Failed to record Paystack initialization failure:', recordError);
      }
    }

    const status = /not configured/i.test(error.message)
      ? 503
      : order ? 502 : 400;
    const message = status === 503
      ? 'Secure payment is temporarily unavailable. Please try again later or contact the event organizer.'
      : error.message || 'Checkout could not be started. Please try again.';
    return new Response(JSON.stringify({
      error: message,
    }), { status, headers: JSON_HEADERS });
  }
}
