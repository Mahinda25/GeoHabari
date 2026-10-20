import { verifyPaymentAndIssueTickets } from '../../../lib/ticketing.js';
import { appendAuditLog, getOrderByReference } from '../../../lib/ticketing-store.js';

/**
 * Pesapal v3 Instant Payment Notification (IPN) Callback Handler
 */
export async function GET({ request }) {
  const url = new URL(request.url);
  const orderTrackingId = url.searchParams.get('OrderTrackingId') || '';
  const orderMerchantReference = url.searchParams.get('OrderMerchantReference') || '';
  const orderNotificationType = url.searchParams.get('OrderNotificationType') || 'IPNCHANGE';

  if (!orderMerchantReference) {
    return new Response(JSON.stringify({ error: 'Missing OrderMerchantReference' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const order = getOrderByReference(orderMerchantReference);
  if (!order) {
    return new Response(JSON.stringify({ error: 'Order not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  appendAuditLog({
    action: 'pesapal_ipn_received',
    entity: 'order',
    entity_id: order.id,
    details: { orderTrackingId, orderMerchantReference, orderNotificationType },
  });

  return new Response(
    JSON.stringify({
      orderNotificationType,
      orderTrackingId,
      orderMerchantReference,
      status: '200',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export async function POST({ request }) {
  try {
    const body = await request.json().catch(() => ({}));
    const { OrderTrackingId, OrderMerchantReference, status } = body;

    const orderRef = OrderMerchantReference || body.orderReference;
    if (!orderRef) {
      return new Response(JSON.stringify({ error: 'Missing OrderMerchantReference.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const isPaid = status === 'COMPLETED' || status === 'paid';
    const result = verifyPaymentAndIssueTickets({
      orderReference: orderRef,
      provider: 'pesapal',
      providerReference: OrderTrackingId || `pesapal-${Date.now()}`,
      status: isPaid ? 'paid' : 'failed',
    });

    return new Response(
      JSON.stringify({
        success: true,
        order: result.order.reference,
        status: result.order.status,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
