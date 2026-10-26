/* Disabled - may be used in future. Paystack is the only active payment gateway.
import { getEventById, getOrderByReference, readStore } from '../../../lib/ticketing-store.js';
import { submitPesapalOrder } from '../../../lib/pesapal.js';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const orderReference = String(body.order_reference || body.OrderReference || '').trim();
    const order = await getOrderByReference(orderReference);
    if (!order || order.payment_method !== 'mpesa' || order.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'A pending M-Pesa order is required.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    const store = await readStore();
    const payment = store.payments.find((entry) => entry.order_id === order.id);
    if (!payment || !payment.provider_reference.startsWith('MPESA-')) {
      return new Response(JSON.stringify({ error: 'Payment checkout has already been started for this order.' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    const event = await getEventById(order.event_id);
    if (!event) {
      return new Response(JSON.stringify({ error: 'The event for this order was not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    const checkout = await submitPesapalOrder(order, event);
    return new Response(JSON.stringify({
      success: true,
      reference: order.reference,
      redirect: checkout.redirectUrl,
      pending: true,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    const status = /not configured/i.test(error.message) ? 503 : 502;
    return new Response(JSON.stringify({ error: error.message || 'M-Pesa checkout could not be started.' }), {
      status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
}
*/
