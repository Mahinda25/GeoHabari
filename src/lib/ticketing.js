import {
  appendAuditLog,
  getEventById,
  getEventBySlug,
  getOrderById,
  getOrderByReference,
  getPaymentByReference,
  getTicketTypeById,
  getTicketTypesByEvent,
  listEvents,
  readStore,
  writeStore,
  saveEvent,
  saveTicketType,
  saveEventWithTickets,
  getStudentVerificationById,
  saveStudentVerification,
} from './ticketing-store.js';
import { verifyVerificationToken } from './student-verification.js';
import {
  isSafaricomKenyaPhone,
  normalizeEastAfricanPhone,
  validateEastAfricanPhone,
} from './phone.js';
import crypto from 'node:crypto';

const MAX_QUANTITY = 5;
const MIN_QUANTITY = 1;
const PENDING_ORDER_RESERVATION_MS = 20 * 60 * 1000;

export function sanitizeText(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

export function normalizePhone(value) {
  return normalizeEastAfricanPhone(value);
}

export function validatePhone(value) {
  return validateEastAfricanPhone(value);
}

export function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim());
}

export function generateOrderReference() {
  const year = new Date().getFullYear();
  return `GH-${year}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
}

export function generateTicketCode(seed = '') {
  const randomPart = crypto.randomBytes(8).toString('hex').toUpperCase();
  const suffix = seed ? `-${seed.slice(0, 2).toUpperCase()}` : '';
  return `GH${String(new Date().getFullYear()).slice(-2)}${suffix}-${randomPart}`;
}

export { saveEvent, saveTicketType, saveEventWithTickets };

export function getPublishedEvents() {
  return listEvents()
    .filter((event) => event.status === 'published' && !event.archived_at)
    .map((event) => ({
      ...event,
      ticket_types: getTicketTypesByEvent(event.id),
    }));
}

export function getEventDetail(slug) {
  const event = getEventBySlug(slug);
  if (!event || event.status !== 'published' || event.archived_at) {
    return null;
  }

  return {
    ...event,
    incentives: Array.isArray(event.incentives) ? event.incentives : [],
    ticket_types: getTicketTypesByEvent(event.id),
  };
}

export function ensureOrderRequestValid(payload) {
  const name = sanitizeText(payload.buyer_name || payload.full_name);
  const email = sanitizeText(payload.email || '');
  const phone = normalizePhone(payload.phone || '');
  const ticketTypeId = sanitizeText(payload.ticket_type_id || payload.ticketTypeId || '');
  const quantity = Number(payload.quantity ?? 1);
  const paymentMethod = sanitizeText(
    payload.payment_channel || payload.payment_method || payload.paymentMethod || ''
  );
  const acceptedTerms = Boolean(payload.accept_terms ?? payload.acceptTerms ?? payload.terms_accepted);
  const studentVerificationId = sanitizeText(payload.student_verification_id || '');
  const studentVerificationToken = sanitizeText(payload.student_verification_token || '');
  const organization = sanitizeText(payload.organization || payload.buyer_org || '');
  const role = sanitizeText(payload.role || payload.buyer_role || '');
  const attendees = Array.isArray(payload.attendees)
    ? payload.attendees.map((a) => ({
        name: sanitizeText(a?.name || ''),
        email: sanitizeText(a?.email || ''),
        phone: normalizePhone(a?.phone || ''),
        organization: sanitizeText(a?.organization || ''),
        role: sanitizeText(a?.role || ''),
      }))
    : [];

  if (!name || name.length < 2) {
    throw new Error('Full name is required.');
  }

  if (!validateEmail(email)) {
    throw new Error('A valid email is required.');
  }

  if (!validatePhone(phone)) {
    throw new Error('A valid East African phone number is required in international format.');
  }

  if (!ticketTypeId) {
    throw new Error('Ticket type is required.');
  }

  if (!Number.isInteger(quantity) || quantity < MIN_QUANTITY || quantity > MAX_QUANTITY) {
    throw new Error('Quantity must be between 1 and 5 tickets.');
  }

  const paymentChannel = paymentMethod === 'mpesa' ? 'mobile_money' : paymentMethod;
  if (!['mobile_money', 'card'].includes(paymentChannel)) {
    throw new Error('Choose Paystack mobile money or card checkout.');
  }
  if (paymentChannel === 'mobile_money' && !isSafaricomKenyaPhone(phone)) {
    throw new Error('Paystack M-Pesa is available only for Safaricom Kenya numbers. Choose card to pay with this number.');
  }

  if (!acceptedTerms) {
    throw new Error('You must accept the terms, privacy policy and refund policy.');
  }
  return {
    buyer_name: name,
    email,
    phone,
    ticket_type_id: ticketTypeId,
    quantity,
    payment_method: paymentChannel,
    accepted_terms: true,
    student_verification_id: studentVerificationId,
    student_verification_token: studentVerificationToken,
    organization,
    role,
    attendees: [],
  };
}

export function createOrderCheckout(eventId, requestPayload) {
  const store = readStore();
  const event = getEventById(eventId);
  if (!event || event.status !== 'published' || event.archived_at) {
    throw new Error('Event is not available for purchase.');
  }

  const validated = ensureOrderRequestValid(requestPayload);
  const ticketType = getTicketTypeById(validated.ticket_type_id);
  if (!ticketType || ticketType.event_id !== event.id) {
    throw new Error('Selected ticket type is invalid for this event.');
  }

  const now = Date.now();
  const activeReservations = store.orders
    .filter((order) => {
      if (order.ticket_type_id !== ticketType.id || order.status !== 'pending') return false;
      const fallbackExpiry = new Date(order.created_at).getTime() + PENDING_ORDER_RESERVATION_MS;
      const expiresAt = order.payment_expires_at
        ? new Date(order.payment_expires_at).getTime()
        : fallbackExpiry;
      return expiresAt > now;
    })
    .reduce((sum, order) => sum + Number(order.quantity || 0), 0);
  const totalReserved = Number(ticketType.sold_count || 0) + activeReservations;
  if (totalReserved + validated.quantity > Number(ticketType.allocation)) {
    throw new Error('Selected ticket quantity exceeds remaining capacity.');
  }

  // ========================================================
  // SERVER-SIDE STUDENT ELIGIBILITY ENFORCEMENT
  // ========================================================
  const isStudentTicket =
    ticketType.category_type === 'student' || ticketType.name.toLowerCase().includes('student');

  let verifiedStudentRecord = null;

  if (isStudentTicket) {
    const verificationId = validated.student_verification_id;
    const verificationToken = validated.student_verification_token;

    if (!verificationId) {
      throw new Error(
        'Student verification required for discounted Student tickets. Please verify your university email or Student ID.'
      );
    }

    verifiedStudentRecord = getStudentVerificationById(verificationId);
    if (!verifiedStudentRecord) {
      throw new Error('Student verification record not found. Please complete verification.');
    }

    if (verifiedStudentRecord.status !== 'approved') {
      throw new Error(
        `Student verification is not approved (status: ${verifiedStudentRecord.status}). Please complete verification.`
      );
    }

    // Token verification
    if (!verificationToken) {
      throw new Error('A signed student verification token is required. Please verify your student details again.');
    }
    const tokenResult = verifyVerificationToken(verificationToken, validated.buyer_name);
    if (!tokenResult.isValid || tokenResult.verificationId !== verifiedStudentRecord.id) {
      throw new Error(`Student verification token invalid or expired: ${tokenResult.error || 'verification ID mismatch'}`);
    }

    // Reuse prevention check
    if (verifiedStudentRecord.consumed_by_order_id) {
      const priorOrder = getOrderById(verifiedStudentRecord.consumed_by_order_id);
      if (priorOrder && priorOrder.status === 'paid') {
        throw new Error('This student verification has already been utilized for a completed order.');
      }
    }
  }

  const orderRef = generateOrderReference();
  // Price is strictly calculated from the database ticketType, never client-submitted!
  const amount = ticketType.price * validated.quantity;

  const createdAt = new Date();
  const order = {
    id: crypto.randomUUID(),
    reference: orderRef,
    event_id: event.id,
    ticket_type_id: ticketType.id,
    buyer_name: validated.buyer_name,
    phone: validated.phone,
    email: validated.email,
    quantity: validated.quantity,
    amount,
    organization: null,
    role: null,
    attendees: [],
    status: 'pending',
    payment_method: validated.payment_method,
    payment_provider: 'paystack',
    accepted_terms: true,
    student_verification_id: verifiedStudentRecord ? verifiedStudentRecord.id : null,
    payment_expires_at: new Date(createdAt.getTime() + PENDING_ORDER_RESERVATION_MS).toISOString(),
    created_at: createdAt.toISOString(),
    updated_at: new Date().toISOString(),
  };

  const payment = {
    id: crypto.randomUUID(),
    order_id: order.id,
    provider: 'paystack',
    provider_reference: orderRef,
    amount,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.orders.push(order);
  store.payments.push(payment);

  if (verifiedStudentRecord) {
    verifiedStudentRecord.consumed_by_order_id = order.id;
    saveStudentVerification(verifiedStudentRecord);
  }

  appendAuditLog({
    action: 'order_created',
    entity: 'order',
    entity_id: order.id,
    details: {
      reference: order.reference,
      payment_method: validated.payment_method,
      payment_provider: 'paystack',
      is_student: isStudentTicket,
    },
  });

  writeStore(store);

  return { order, payment, ticketType, event };
}

export function verifyPaymentAndIssueTickets({ orderReference, provider, providerReference, amount, status = 'paid' }) {
  const store = readStore();
  const order = store.orders.find((entry) => entry.reference === orderReference);
  if (!order) {
    throw new Error('Order not found.');
  }

  if (provider !== 'paystack' || order.payment_provider !== 'paystack') {
    throw new Error('Payment provider does not match this order.');
  }
  if (!['paid', 'failed', 'cancelled'].includes(status)) {
    throw new Error('Unsupported payment status.');
  }
  if (amount !== undefined && Number(amount) !== Number(order.amount)) {
    throw new Error('Verified payment amount does not match the order total.');
  }

  const existingPayment = providerReference ? getPaymentByReference(providerReference) : null;
  if (existingPayment && existingPayment.status === 'paid' && existingPayment.order_id === order.id) {
    return { order, payment: existingPayment, alreadyProcessed: true };
  }
  if (order.status === 'paid') {
    throw new Error('This order has already been paid with a different payment reference.');
  }
  if (status === 'paid' && !providerReference) {
    throw new Error('A verified provider payment reference is required.');
  }
  if (status === 'paid' && amount === undefined) {
    throw new Error('A verified payment amount is required.');
  }
  if (existingPayment && existingPayment.order_id !== order.id) {
    throw new Error('Provider payment reference is already associated with another order.');
  }

  const payment = store.payments.find((entry) => entry.order_id === order.id && entry.provider === provider) || {
    id: crypto.randomUUID(),
    order_id: order.id,
    provider,
    provider_reference: providerReference || `${provider.toUpperCase()}-${Date.now()}`,
    amount: order.amount,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  payment.status = status;
  payment.provider_reference = providerReference || payment.provider_reference;
  payment.updated_at = new Date().toISOString();

  if (!store.payments.some((entry) => entry.id === payment.id)) {
    store.payments.push(payment);
  }

  let ticketDelivery = null;

  if (status === 'paid') {
    order.status = 'paid';
    order.updated_at = new Date().toISOString();

    const ticketType = getTicketTypeById(order.ticket_type_id);
    if (!ticketType) {
      throw new Error('Ticket type could not be resolved.');
    }

    const existingTicketCount = store.tickets.filter((ticket) => ticket.order_id === order.id).length;
    if (existingTicketCount === 0) {
      const isPro = ticketType.category_type === 'professional' || ticketType.name.toLowerCase().includes('professional');
      const orderAttendees = Array.isArray(order.attendees) ? order.attendees : [];

      for (let index = 0; index < order.quantity; index += 1) {
        let ticketCode = generateTicketCode(order.reference);
        for (let attempt = 0; store.tickets.some((ticket) => ticket.ticket_code === ticketCode) && attempt < 5; attempt += 1) {
          ticketCode = generateTicketCode(order.reference);
        }
        if (store.tickets.some((ticket) => ticket.ticket_code === ticketCode)) {
          throw new Error('A unique ticket code could not be generated.');
        }
        const attendee = orderAttendees[index] || null;
        const attendeeName = attendee?.name || order.buyer_name;
        const attendeeEmail = attendee?.email || order.email;
        const attendeePhone = attendee?.phone || order.phone;
        const attendeeOrg = attendee?.organization || order.organization || null;
        const attendeeRole = attendee?.role || order.role || null;

        const ticket = {
          id: crypto.randomUUID(),
          order_id: order.id,
          event_id: order.event_id,
          ticket_type_id: order.ticket_type_id,
          ticket_code: ticketCode,
          category: ticketType.name,
          category_type: ticketType.category_type || (isPro ? 'professional' : ticketType.name.toLowerCase().includes('student') ? 'student' : 'standard'),
          attendee_name: attendeeName,
          attendee_email: attendeeEmail,
          attendee_phone: attendeePhone,
          organization: isPro ? attendeeOrg : null,
          role: isPro ? attendeeRole : null,
          status: 'active',
          created_at: new Date().toISOString(),
        };
        store.tickets.push(ticket);
      }
    }

    const targetTicketType = store.ticket_types.find((entry) => entry.id === order.ticket_type_id);
    if (targetTicketType && existingTicketCount === 0) {
      targetTicketType.sold_count = Number(targetTicketType.sold_count || 0) + order.quantity;
    }

    const event = getEventById(order.event_id);
    const orderTickets = store.tickets.filter((ticket) => ticket.order_id === order.id);
    if (event) {
      ticketDelivery = {
        order,
        payment,
        event,
        ticketType,
        ticketCodes: orderTickets.map((ticket) => ticket.ticket_code),
      };
    }
  } else if (status === 'failed' || status === 'cancelled') {
    order.status = status;
    order.updated_at = new Date().toISOString();
  }

  const orderIdx = store.orders.findIndex((o) => o.id === order.id);
  if (orderIdx >= 0) {
    store.orders[orderIdx] = order;
  }

  writeStore(store);

  if (status === 'paid') {
    appendAuditLog({
      action: 'payment_verified',
      entity: 'order',
      entity_id: order.id,
      details: { reference: order.reference, provider },
    });
  } else {
    appendAuditLog({
      action: 'payment_failed',
      entity: 'order',
      entity_id: order.id,
      details: { reference: order.reference, provider, status },
    });
  }

  if (ticketDelivery) {
    const { order: paidOrder, payment: paidPayment, event, ticketType, ticketCodes } = ticketDelivery;
    sendConfirmationEmail({
      buyerName: paidOrder.buyer_name,
      buyerEmail: paidOrder.email,
      eventTitle: event.title,
      venue: event.venue,
      startsAt: event.starts_at,
      ticketTypeName: ticketType.name,
      quantity: paidOrder.quantity,
      ticketCodes,
      paymentReference: paidPayment.provider_reference,
    }).catch((error) => {
      console.error('[ticketing] Ticket email delivery failed:', error);
      appendAuditLog({
        action: 'email_failed',
        entity: 'order',
        entity_id: paidOrder.id,
        details: { message: error.message },
      });
    });

    sendWhatsAppTicketConfirmation({
      buyerName: paidOrder.buyer_name,
      buyerPhone: paidOrder.phone,
      eventTitle: event.title,
      venue: event.venue,
      startsAt: event.starts_at,
      ticketTypeName: ticketType.name,
      quantity: paidOrder.quantity,
      ticketCodes,
      paymentReference: paidPayment.provider_reference,
    }).catch((error) => {
      console.error('[ticketing] WhatsApp ticket delivery failed:', error);
      appendAuditLog({
        action: 'whatsapp_failed',
        entity: 'order',
        entity_id: paidOrder.id,
        details: { message: error.message },
      });
    });
  }

  return { order, payment, alreadyProcessed: false };
}

export async function sendConfirmationEmail({
  buyerName,
  buyerEmail,
  eventTitle,
  venue,
  startsAt,
  ticketTypeName,
  quantity,
  ticketCodes,
  paymentReference,
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM || 'noreply@geohabari.com';

  const recipients = [buyerEmail, process.env.CONFIRMATION_EMAIL_TO].filter(Boolean);

  if (!apiKey) {
    throw new Error('Ticket email delivery is not configured. Set RESEND_API_KEY and retry delivery.');
  }

  const payload = {
    from: fromAddress,
    to: recipients.length > 0 ? recipients : ['hello@geohabari.com'],
    subject: `Your GeoHabari ticket confirmation for ${eventTitle}`,
    html: `
      <h2>Ticket Confirmation</h2>
        <p>Hello ${escapeHtml(buyerName)},</p>
        <p>Your order for <strong>${escapeHtml(eventTitle)}</strong> has been confirmed.</p>
      <ul>
          <li>Venue: ${escapeHtml(venue)}</li>
          <li>Date: ${escapeHtml(new Date(startsAt).toLocaleString())}</li>
          <li>Ticket type: ${escapeHtml(ticketTypeName)}</li>
        <li>Quantity: ${quantity}</li>
          <li>Payment reference: ${escapeHtml(paymentReference)}</li>
      </ul>
      <p>Ticket codes:</p>
        <ul>${ticketCodes.map((code) => `<li><strong>${escapeHtml(code)}</strong></li>`).join('')}</ul>
    `,
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Email sending failed: ${response.status}`);
  }

  return { success: true, mocked: false };
}

export async function sendWhatsAppTicketConfirmation({
  buyerName,
  buyerPhone,
  eventTitle,
  venue,
  startsAt,
  ticketTypeName,
  quantity,
  ticketCodes,
  paymentReference,
}) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TICKET_TEMPLATE;

  if (!accessToken && !phoneNumberId && !templateName) return { success: false, skipped: true };
  if (!accessToken || !phoneNumberId || !templateName) {
    throw new Error('WhatsApp ticket delivery is incomplete. Configure WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, and WHATSAPP_TICKET_TEMPLATE.');
  }

  const eventDate = new Date(startsAt).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' });
  const ticketSummary = [
    `Hello ${buyerName}, your GeoHabari payment is confirmed.`,
    `${eventTitle} | ${venue} | ${eventDate}`,
    `${ticketTypeName} x${quantity}`,
    `Ticket codes: ${ticketCodes.join(', ')}`,
    `Payment reference: ${paymentReference}`,
  ].join(' | ');

  const response = await fetch(`https://graph.facebook.com/v22.0/${encodeURIComponent(phoneNumberId)}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: buyerPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en' },
        components: [{
          type: 'body',
          parameters: [{ type: 'text', text: ticketSummary }],
        }],
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`WhatsApp ticket delivery failed: ${response.status}`);
  }

  return { success: true };
}

/**
 * Dispatches one-time verification code to .ac.ke university email
 */
export async function sendUniversityVerificationEmail({ email, buyerName, code }) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM || 'noreply@geohabari.com';

  if (!apiKey) {
    throw new Error('Student email verification is not configured. Set RESEND_API_KEY to send verification codes.');
  }

  const payload = {
    from: fromAddress,
    to: [email],
    subject: `Your GeoHabari Student Verification Code: ${code}`,
    html: `
      <h2>GeoHabari Student Ticket Verification</h2>
        <p>Hello ${escapeHtml(buyerName || 'Student')},</p>
      <p>Use the following single-use verification code to unlock discounted Student admission for GeoHabari events:</p>
      <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; padding: 12px 24px; background: #f3f4f6; border-radius: 8px; display: inline-block; margin: 16px 0;">
        ${code}
      </div>
      <p>This code expires in 15 minutes and can only be used once.</p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">
        Important notice: Verification confirms access to this academic mailbox and does not independently prove current institutional enrollment.
      </p>
    `,
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Verification email failed: ${response.status}`);
  }

  return { success: true, mocked: false };
}

export function getTicketMetrics() {
  const store = readStore();
  const totalRevenue = store.orders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
  const openOrders = store.orders.filter((order) => order.status !== 'paid').length;
  const totalVerifications = store.student_verifications.length;
  const approvedVerifications = store.student_verifications.filter((v) => v.status === 'approved').length;

  return {
    totalEvents: store.events.length,
    totalOrders: store.orders.length,
    totalRevenue,
    openOrders,
    totalTickets: store.tickets.length,
    totalVerifications,
    approvedVerifications,
  };
}

export function exportRecords(format = 'csv') {
  const store = readStore();
  const rows = store.orders.map((order) => {
    const event = getEventById(order.event_id);
    const ticketType = getTicketTypeById(order.ticket_type_id);
    const ticketCodes = store.tickets.filter((ticket) => ticket.order_id === order.id).map((ticket) => ticket.ticket_code);

    return {
      buyer: order.buyer_name,
      phone: order.phone,
      email: order.email,
      event: event?.title || 'Unknown event',
      ticket_type: ticketType?.name || 'Unknown',
      quantity: order.quantity,
      amount: order.amount,
      status: order.status,
      ticket_codes: ticketCodes.join('; '),
    };
  });

  const exportRecord = {
    id: crypto.randomUUID(),
    format,
    created_at: new Date().toISOString(),
    rows: rows.length,
  };

  store.exports.push(exportRecord);
  writeStore(store);
  return { rows, exportRecord };
}
