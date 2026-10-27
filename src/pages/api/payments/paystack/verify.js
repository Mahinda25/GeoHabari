import { getOrderByReference } from '../../../../lib/ticketing-store.js';

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

    const order = await getOrderByReference(reference);
    if (!order || order.payment_provider !== 'paystack') {
      return new Response(JSON.stringify({ error: 'Paystack order could not be found.' }), {
        status: 404,
        headers: JSON_HEADERS,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      status: order.status,
    }), { status: 200, headers: JSON_HEADERS });
  } catch (error) {
    console.error('[paystack] Client status lookup failed:', error);
    const status = /not configured/i.test(error.message) ? 503 : 502;
    return new Response(JSON.stringify({ error: error.message || 'Payment verification failed.' }), {
      status,
      headers: JSON_HEADERS,
    });
  }
}
