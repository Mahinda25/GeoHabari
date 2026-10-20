import { createOrderCheckout, verifyPaymentAndIssueTickets } from '../../lib/ticketing.js';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { order, payment, event } = createOrderCheckout(body.event_id, body);

    if (body.payment_method === 'mpesa') {
      const response = {
        success: true,
        reference: order.reference,
        message: 'M-Pesa STK push initiated. Please complete the prompt on your phone.',
        pending: true,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const verification = verifyPaymentAndIssueTickets({
      orderReference: order.reference,
      provider: 'card',
      providerReference: payment.provider_reference,
      status: 'paid',
    });

    return new Response(JSON.stringify({
      success: true,
      reference: verification.order.reference,
      message: 'Card payment verified and tickets issued.',
      redirect: `/events/${event.slug}/success?reference=${verification.order.reference}`,
    }), {
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
