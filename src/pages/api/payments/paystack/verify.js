import { reconcilePaystackPayment } from '../../../../lib/paystack.js';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, private',
};

export async function POST({ request }) {
  try {
    const body = await request.json();
    const reference = String(body.reference || '').trim();
    if (!reference) {
      return new Response(JSON.stringify({ error: 'A transaction reference is required.' }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    const result = await reconcilePaystackPayment(reference);
    return new Response(JSON.stringify({
      success: true,
      status: result.status,
      alreadyProcessed: result.alreadyProcessed,
    }), { status: 200, headers: JSON_HEADERS });
  } catch (error) {
    console.error('[paystack] Client-return verification failed:', error);
    const status = /could not be matched/i.test(error.message) ? 404
      : /amount or currency|channel does not match/i.test(error.message) ? 409
        : /not configured/i.test(error.message) ? 503 : 502;
    return new Response(JSON.stringify({ error: error.message || 'Payment verification failed.' }), {
      status,
      headers: JSON_HEADERS,
    });
  }
}
