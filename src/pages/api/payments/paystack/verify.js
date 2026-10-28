import { getOrderByReference } from '../../../../lib/ticketing-store.js';
import { reconcilePaystackPayment } from '../../../../lib/paystack.js';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, private',
};

export function createPaystackStatusHandler({
  loadOrder = getOrderByReference,
  recoverPayment = reconcilePaystackPayment,
} = {}) {
  return async function POST({ request }) {
    try {
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Request body must contain valid JSON.' }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    const reference = typeof body?.reference === 'string' ? body.reference.trim() : '';
    if (!/^[A-Za-z0-9.=-]{1,100}$/.test(reference)) {
      return new Response(JSON.stringify({ error: 'A transaction reference is required.' }), {
        status: 400,
        headers: JSON_HEADERS,
        });
      }

      const order = await loadOrder(reference);
      if (!order || order.payment_provider !== 'paystack') {
        return new Response(JSON.stringify({ error: 'Paystack order could not be found.' }), {
          status: 404,
          headers: JSON_HEADERS,
        });
      }

      if (order?.status === 'paid') {
        return new Response(JSON.stringify({
          success: true,
          status: 'paid',
          alreadyProcessed: true,
        }), { status: 200, headers: JSON_HEADERS });
      }

      if (!['pending', 'cancelled'].includes(order.status)) {
        return new Response(JSON.stringify({
          error: 'Paystack order is not awaiting payment.',
        }), { status: 409, headers: JSON_HEADERS });
      }

      const result = await recoverPayment(reference, null, { persistCancellation: true });
      return new Response(JSON.stringify({
        success: true,
        status: result.status === 'paid' || result.status === 'cancelled'
          ? result.status
          : 'pending',
        ...(result.status === 'processing' && {
          message: 'Waiting for payment gateway settlement',
        }),
        alreadyProcessed: result.alreadyProcessed,
      }), { status: 200, headers: JSON_HEADERS });
    } catch (error) {
      if (/timed out|unable to reach paystack|gateway timeout|request failed with status 5\d\d/i.test(error.message || '')) {
        console.warn('[paystack] Verification is temporarily unavailable; keeping checkout open:', error.message);
        return new Response(JSON.stringify({
          success: true,
          status: 'pending',
          message: 'Waiting for payment gateway settlement',
        }), { status: 200, headers: JSON_HEADERS });
      }

      console.error('[paystack] Client status lookup failed:', error);
      const status = /not configured/i.test(error.message) ? 503 : 502;
      return new Response(JSON.stringify({ error: error.message || 'Payment verification failed.' }), {
        status,
        headers: JSON_HEADERS,
      });
    }
  };
}

export const POST = createPaystackStatusHandler();
