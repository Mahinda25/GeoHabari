import { getAdminFromRequest } from '../../../../lib/auth.js';
import { readStore, appendAuditLog } from '../../../../lib/ticketing-store.js';
import { sendConfirmationEmail } from '../../../../lib/ticketing.js';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, private',
};

export async function POST({ request, cookies }) {
  if (!await getAdminFromRequest(request, cookies)) {
    return new Response(JSON.stringify({ error: 'Unauthorized. Admin session required.' }), {
      status: 401,
      headers: JSON_HEADERS,
    });
  }

  try {
    const { reference } = await request.json();
    const store = await readStore();
    const order = store.orders.find((entry) => entry.reference === String(reference || '').trim());
    if (!order || order.status !== 'paid') {
      return new Response(JSON.stringify({ error: 'Only paid orders can receive ticket emails.' }), {
        status: 404,
        headers: JSON_HEADERS,
      });
    }

    const event = store.events.find((entry) => entry.id === order.event_id);
    const ticketType = store.ticket_types.find((entry) => entry.id === order.ticket_type_id);
    const tickets = store.tickets.filter((ticket) => ticket.order_id === order.id);
    if (!event || !ticketType || tickets.length === 0) {
      return new Response(JSON.stringify({ error: 'This paid order is missing ticket delivery details.' }), {
        status: 409,
        headers: JSON_HEADERS,
      });
    }

    await sendConfirmationEmail({
      buyerName: order.buyer_name,
      buyerEmail: order.email,
      eventTitle: event.title,
      venue: event.venue,
      startsAt: event.starts_at,
      ticketTypeName: ticketType.name,
      quantity: order.quantity,
      ticketCodes: tickets.map((ticket) => ticket.ticket_code),
      paymentReference: store.payments.find((payment) => payment.order_id === order.id)?.provider_reference || order.reference,
    });

    await appendAuditLog({
      action: 'email_resent',
      entity: 'order',
      entity_id: order.id,
      details: { reference: order.reference },
    });
    return new Response(JSON.stringify({ success: true, message: 'Ticket email sent.' }), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    console.error('[admin] Ticket email resend failed:', error);
    return new Response(JSON.stringify({
      error: 'Ticket email could not be sent. Check the email configuration and try again.',
    }), { status: 502, headers: JSON_HEADERS });
  }
}
