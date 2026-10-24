/* Disabled - may be used in future. Paystack is the only active payment gateway.
import { getOrderByReference, getPaymentByReference } from '../../../lib/ticketing-store.js';
import { getPesapalTransactionStatus } from '../../../lib/pesapal.js';
import { verifyPaymentAndIssueTickets } from '../../../lib/ticketing.js';

export async function GET({ request }) {
  const url = new URL(request.url);
  const trackingId = url.searchParams.get('OrderTrackingId');
  const merchantReference = url.searchParams.get('OrderMerchantReference');
  try {
    if (!trackingId || !merchantReference) {
      return new Response(JSON.stringify({ error: 'Pesapal transaction identifiers are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, private' },
      });
    }

    const order = getOrderByReference(merchantReference);
    const payment = getPaymentByReference(trackingId);
    if (!order || !payment || payment.order_id !== order.id || payment.provider !== order.payment_method) {
      return new Response(JSON.stringify({ error: 'Payment transaction could not be matched to an order.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, private' },
      });
    }

    const providerStatus = await getPesapalTransactionStatus(trackingId);
    const statusCode = Number(providerStatus.status_code);
    if (statusCode === 1) {
      if (Number(providerStatus.amount) !== Number(order.amount) || providerStatus.currency !== 'KES') {
        return new Response(JSON.stringify({ error: 'Verified payment amount or currency does not match the order.' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, private' },
        });
      }
      const providerMethod = String(providerStatus.payment_method || '');
      if (
        !providerMethod ||
        (order.payment_method === 'mpesa' && !/m-?pesa/i.test(providerMethod)) ||
        (order.payment_method === 'card' && /m-?pesa/i.test(providerMethod))
      ) {
        return new Response(JSON.stringify({ error: 'Payment method does not match the order.' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, private' },
        });
      }

      const result = verifyPaymentAndIssueTickets({
        orderReference: order.reference,
        provider: order.payment_method,
        providerReference: trackingId,
        amount: providerStatus.amount,
        status: 'paid',
      });
      return new Response(JSON.stringify({
        success: true,
        alreadyProcessed: result.alreadyProcessed,
        status: result.order.status,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, private' },
      });
    }

    if (statusCode === 2) {
      const result = verifyPaymentAndIssueTickets({
        orderReference: order.reference,
        provider: order.payment_method,
        providerReference: trackingId,
        status: 'failed',
      });
      return new Response(JSON.stringify({ success: true, status: result.order.status }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, private' },
      });
    }

    return new Response(JSON.stringify({ success: true, status: 'pending' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, private' },
    });
  } catch (error) {
    console.error('[pesapal] Transaction callback verification failed:', error);
    return new Response(JSON.stringify({ error: 'Pesapal transaction verification failed.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, private' },
    });
  }
}
*/
