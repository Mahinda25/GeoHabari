import { verifyPaymentAndIssueTickets } from '../../../lib/ticketing.js';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { Order_ID, OrderReference, status, Amount } = body || {};

    if (!OrderReference || !status) {
      return new Response(JSON.stringify({ error: 'Missing callback data.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = verifyPaymentAndIssueTickets({
      orderReference: OrderReference,
      provider: 'mpesa',
      providerReference: Order_ID || `mpesa-${Date.now()}`,
      status: status === 'paid' ? 'paid' : 'failed',
    });

    return new Response(JSON.stringify({ success: true, status: result.order.status, order: result.order.reference }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
