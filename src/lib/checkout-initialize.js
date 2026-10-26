import { createOrderCheckout, verifyPaymentAndIssueTickets } from './ticketing.js';
import { assertPaystackConfigured, initializePaystackTransaction } from './paystack.js';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, private',
};

function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
}

function errorMessage(error) {
  return error instanceof Error ? error.message : 'Checkout could not be started. Please try again.';
}

export async function initializeCheckout(request) {
  let order;

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Request body must contain valid JSON.' }, 400);
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonResponse({ error: 'Checkout details are required.' }, 400);
    }
    if (typeof body.email !== 'string' || !body.email.trim()) {
      return jsonResponse({ error: 'A valid email is required.' }, 400);
    }
    if (typeof body.event_id !== 'string' || !body.event_id.trim()) {
      return jsonResponse({ error: 'An event is required to start ticket checkout.' }, 400);
    }

    assertPaystackConfigured();
    const checkout = await createOrderCheckout(body.event_id, body);
    order = checkout.order;

    const payment = await initializePaystackTransaction(order, checkout.event);
    if (!payment.authorizationUrl && !payment.accessCode) {
      throw new Error('Paystack did not return a usable checkout session.');
    }

    return jsonResponse({
      success: true,
      reference: order.reference,
      access_code: payment.accessCode,
      authorization_url: payment.authorizationUrl,
      message: 'Complete payment in the secure Paystack checkout. Tickets are issued after server verification.',
      pending: true,
    }, 200);
  } catch (error) {
    const message = errorMessage(error);
    if (order) {
      try {
        await verifyPaymentAndIssueTickets({
          orderReference: order.reference,
          provider: 'paystack',
          providerReference: order.reference,
          status: 'failed',
        });
      } catch (recordError) {
        console.error('[checkout] Failed to record Paystack initialization failure:', recordError);
      }
    }

    if (/not configured|PUBLIC_SITE_URL/i.test(message)) {
      return jsonResponse({
        error: 'Secure payment is temporarily unavailable. Please try again later or contact the event organizer.',
      }, 503);
    }
    if (/Paystack|checkout session/i.test(message)) {
      console.error('[checkout] Paystack transaction initialization failed:', error);
      return jsonResponse({
        error: 'Unable to initialize secure payment with Paystack. Please try again.',
      }, 502);
    }
    if (/Ticketing database operation failed/i.test(message)) {
      console.error('[checkout] Ticketing database operation failed:', error);
      return jsonResponse({ error: 'Checkout is temporarily unavailable. Please try again later.' }, 500);
    }
    return jsonResponse({ error: message }, 400);
  }
}
