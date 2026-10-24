/* Disabled - may be used in future. Paystack is the only active payment gateway.
import { verifyPaymentAndIssueTickets } from '../../../lib/ticketing.js';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { orderReference, providerReference, status } = body || {};

    if (!orderReference) {
      return new Response(JSON.stringify({ error: 'Missing order reference.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = verifyPaymentAndIssueTickets({
      orderReference,
      provider: 'card',
      providerReference: providerReference || `card-${Date.now()}`,
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
*/
