import { getAdminFromRequest } from '../../../../lib/auth.js';
import { appendAuditLog, getOrderByReference, getPaymentByReference } from '../../../../lib/ticketing-store.js';
import { sendOrderTicketConfirmation } from '../../../../lib/ticketing.js';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, private',
};

export async function POST({ request, cookies }) {
  let admin;
  try {
    admin = await getAdminFromRequest(request, cookies);
  } catch (error) {
    console.error('[admin] Ticket email resend authentication failed:', error);
    return new Response(JSON.stringify({ error: 'Unable to verify administrator access right now.' }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
  if (!admin) {
    return new Response(JSON.stringify({ error: 'Unauthorized. Admin session required.' }), {
      status: 401,
      headers: JSON_HEADERS,
    });
  }
  if (!['admin', 'superadmin'].includes(admin.user?.role)) {
    return new Response(JSON.stringify({ error: 'Your administrator role cannot resend ticket emails.' }), {
      status: 403,
      headers: JSON_HEADERS,
    });
  }

  try {
    const body = await request.json();
    const reference = typeof body?.reference === 'string' ? body.reference.trim() : '';
    if (!/^[A-Za-z0-9.=-]{1,100}$/.test(reference)) {
      return new Response(JSON.stringify({ error: 'A valid order reference is required.' }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }
    const order = await getOrderByReference(reference);
    if (!order || order.status !== 'paid') {
      return new Response(JSON.stringify({ error: 'Only paid orders can receive ticket emails.' }), {
        status: 404,
        headers: JSON_HEADERS,
      });
    }

    const payment = await getPaymentByReference(reference);
    const result = await sendOrderTicketConfirmation(
      order,
      null,
      payment?.provider_reference || order.reference,
    );
    if (!result.emailSent) {
      return new Response(JSON.stringify({ error: 'Ticket email could not be sent. Retry after checking email configuration.' }), {
        status: 502,
        headers: JSON_HEADERS,
      });
    }

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
