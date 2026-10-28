import { getAdminFromRequest } from '../../../lib/auth.js';
import { reconcilePaystackPayment } from '../../../lib/paystack.js';
import { sendOrderTicketConfirmation } from '../../../lib/ticketing.js';
import {
  getOrderByReference,
  getPaymentByReference,
  getTicketsByOrder,
} from '../../../lib/ticketing-store.js';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, private',
};

function respond(payload, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
}

export async function POST({ request, cookies }) {
  let admin;
  try {
    admin = await getAdminFromRequest(request, cookies);
  } catch (error) {
    console.error('[admin] Payment verification authentication failed:', error);
    return respond({ error: 'Unable to verify administrator access right now.' }, 500);
  }

  if (!admin) return respond({ error: 'Administrator authentication is required.' }, 401);
  if (!['admin', 'superadmin'].includes(admin.user?.role)) {
    return respond({ error: 'Your administrator role cannot verify payments.' }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return respond({ error: 'Request body must contain valid JSON.' }, 400);
  }

  const reference = typeof body?.reference === 'string' ? body.reference.trim() : '';
  if (!/^[A-Za-z0-9.=-]{1,100}$/.test(reference)) {
    return respond({ error: 'A valid Paystack reference is required.' }, 400);
  }

  try {
    const order = await getOrderByReference(reference);
    if (!order || order.payment_provider !== 'paystack') {
      return respond({ error: 'No matching Paystack order was found.' }, 404);
    }

    if (!['pending', 'paid'].includes(order.status)) {
      return respond({
        status: order.status,
        verified: false,
        ticketsIssued: false,
        emailSent: false,
        message: 'This order is not eligible for payment verification.',
      }, 409);
    }

    const result = await reconcilePaystackPayment(reference, null, { persistCancellation: true });
    if (result.status === 'cancelled') {
      return respond({
        status: 'cancelled',
        verified: true,
        ticketsIssued: false,
        emailSent: false,
        message: 'Payment failed or was abandoned. No tickets were issued.',
      });
    }

    if (result.status !== 'paid') {
      return respond({
        status: 'pending',
        verified: false,
        ticketsIssued: false,
        emailSent: false,
        message: 'Payment is still pending. No tickets were issued.',
      });
    }

    const fulfilledOrder = result.order || order;
    let emailSent = result.emailSent === true;
    let tickets = await getTicketsByOrder(fulfilledOrder.id);

    if (result.alreadyProcessed) {
      const payment = await getPaymentByReference(reference);
      const delivery = await sendOrderTicketConfirmation(
        fulfilledOrder,
        tickets,
        payment?.provider_reference || reference,
      );
      emailSent = delivery.emailSent;
      tickets = await getTicketsByOrder(fulfilledOrder.id);
    }

    const ticketsIssued = tickets.length >= Number(fulfilledOrder.quantity);
    return respond({
      status: 'paid',
      verified: true,
      alreadyPaid: result.alreadyProcessed,
      ticketsIssued,
      emailSent,
      message: !ticketsIssued
        ? 'Payment was verified, but ticket issuance needs administrator attention.'
        : emailSent
          ? result.alreadyProcessed
            ? 'Payment is already verified. Existing tickets were retained and the ticket email was sent.'
            : 'Payment verified with Paystack. Ticket issued and emailed.'
          : 'Payment verified and tickets retained, but email delivery failed. Retry email delivery.',
    });
  } catch (error) {
    if (/timed out|unable to reach paystack|gateway timeout|request failed with status 5\d\d/i.test(error.message || '')) {
      console.warn('[admin] Paystack verification is temporarily unavailable:', error.message);
      return respond({
        status: 'pending',
        verified: false,
        ticketsIssued: false,
        emailSent: false,
        message: 'Paystack could not be reached. The order remains pending; try again shortly.',
      });
    }

    console.error('[admin] Payment verification failed:', error);
    const status = /amount or currency|channel does not match/i.test(error.message || '') ? 409
      : /not configured/i.test(error.message || '') ? 503 : 502;
    return respond({
      error: status === 409
        ? 'Paystack transaction details do not match the stored order.'
        : status === 503
          ? 'Paystack verification is not configured on the server.'
          : 'Payment could not be verified right now.',
    }, status);
  }
}
