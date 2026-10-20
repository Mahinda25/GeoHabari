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

const MAX_QUANTITY = 5;
const MIN_QUANTITY = 1;

export function sanitizeText(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

export function normalizePhone(value) {
  const raw = String(value ?? '').replace(/\s+/g, '').replace(/[^0-9+]/g, '');

  if (!raw) return '';
  if (raw.startsWith('+254')) return `0${raw.slice(4)}`;
  if (raw.startsWith('254')) return `0${raw.slice(3)}`;
  if (raw.startsWith('0')) return raw;
  return raw;
}

export function validatePhone(value) {
  const normalized = normalizePhone(value);
  return (
    /^(0\d{9}|\+?254\d{9})$/.test(normalized) ||
    /^(\+?2547\d{8}|\+?2541\d{8})$/.test(normalized) ||
    /^(07\d{8}|01\d{8})$/.test(normalized)
  );
}

export function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim());
}

export function generateOrderReference() {
  const year = new Date().getFullYear();
  const store = readStore();
  const count = store.orders.length + 1;
  return `GH-${year}-${String(count).padStart(5, '0')}`;
}

export function generateTicketCode(seed = '') {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const randomPart = Array.from({ length: 5 }, (_, index) => {
    const pool = index % 2 === 0 ? letters : digits;
    return pool[Math.floor(Math.random() * pool.length)];
  }).join('');
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
    ticket_types: getTicketTypesByEvent(event.id),
  };
}

export function ensureOrderRequestValid(payload) {
  const name = sanitizeText(payload.buyer_name || payload.full_name);
  const email = sanitizeText(payload.email || '');
  const phone = normalizePhone(payload.phone || '');
  const ticketTypeId = sanitizeText(payload.ticket_type_id || payload.ticketTypeId || '');
  const quantity = Number(payload.quantity ?? 1);
  const paymentMethod = sanitizeText(payload.payment_method || payload.paymentMethod || '');
  const acceptedTerms = Boolean(payload.accept_terms ?? payload.acceptTerms ?? payload.terms_accepted);
  const studentVerificationId = sanitizeText(payload.student_verification_id || '');
  const studentVerificationToken = sanitizeText(payload.student_verification_token || '');

  if (!name || name.length < 2) {
    throw new Error('Full name is required.');
  }

  if (!validateEmail(email)) {
    throw new Error('A valid email is required.');
  }

  if (!validatePhone(phone)) {
    throw new Error('A valid Kenyan phone number is required.');
  }

  if (!ticketTypeId) {
    throw new Error('Ticket type is required.');
  }

  if (!Number.isInteger(quantity) || quantity < MIN_QUANTITY || quantity > MAX_QUANTITY) {
    throw new Error('Quantity must be between 1 and 5 tickets.');
  }

  if (!['mpesa', 'card'].includes(paymentMethod)) {
    throw new Error('Unsupported payment method.');
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
    payment_method: paymentMethod,
    accepted_terms: true,
    student_verification_id: studentVerificationId,
    student_verification_token: studentVerificationToken,
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

  const totalSold = ticketType.sold_count ?? 0;
  if (totalSold + validated.quantity > ticketType.allocation) {
    throw new Error('Selected ticket quantity exceeds remaining capacity.');
  }

  // ========================================================
  // SERVER-SIDE STUDENT ELIGIBILITY ENFORCEMENT
  // ========================================================
  const isStudentTicket =
    ticketType.name.toLowerCase().includes('student') || ticketType.price < 1000;

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
    if (verificationToken) {
      const tokenResult = verifyVerificationToken(verificationToken, validated.buyer_name);
      if (!tokenResult.isValid) {
        throw new Error(`Student verification token invalid or expired: ${tokenResult.error}`);
      }
    } else {
      // Name consistency check
      const normRecorded = sanitizeText(verifiedStudentRecord.buyer_name).toLowerCase();
      const normInput = sanitizeText(validated.buyer_name).toLowerCase();
      if (normRecorded !== normInput) {
        throw new Error('Student verification record was issued for a different buyer name.');
      }
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
    status: 'pending',
    payment_method: validated.payment_method,
    accepted_terms: true,
    student_verification_id: verifiedStudentRecord ? verifiedStudentRecord.id : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const payment = {
    id: crypto.randomUUID(),
    order_id: order.id,
    provider: validated.payment_method,
    provider_reference: `${validated.payment_method.toUpperCase()}-${Date.now()}`,
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
      is_student: isStudentTicket,
    },
  });

  writeStore(store);

  return { order, payment, ticketType, event };
}

export function verifyPaymentAndIssueTickets({ orderReference, provider, providerReference, status = 'paid' }) {
  const store = readStore();
  const order = store.orders.find((entry) => entry.reference === orderReference);
  if (!order) {
    throw new Error('Order not found.');
  }

  const existingPayment = getPaymentByReference(providerReference || `${provider.toUpperCase()}-${Date.now()}`);
  if (existingPayment && existingPayment.status === 'paid' && existingPayment.order_id === order.id) {
    return { order, payment: existingPayment, alreadyProcessed: true };
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

  if (status === 'paid') {
    order.status = 'paid';
    order.updated_at = new Date().toISOString();

    const ticketType = getTicketTypeById(order.ticket_type_id);
    if (!ticketType) {
      throw new Error('Ticket type could not be resolved.');
    }

    const existingTicketCount = store.tickets.filter((ticket) => ticket.order_id === order.id).length;
    if (existingTicketCount === 0) {
      for (let index = 0; index < order.quantity; index += 1) {
        const ticketCode = generateTicketCode(order.reference);
        const ticket = {
          id: crypto.randomUUID(),
          order_id: order.id,
          event_id: order.event_id,
          ticket_type_id: order.ticket_type_id,
          ticket_code: ticketCode,
          category: ticketType.name,
          status: 'active',
          created_at: new Date().toISOString(),
        };
        store.tickets.push(ticket);
      }
    }

    const targetTicketType = store.ticket_types.find((entry) => entry.id === order.ticket_type_id);
    if (targetTicketType) {
      targetTicketType.sold_count = Number(targetTicketType.sold_count || 0) + order.quantity;
    }

    appendAuditLog({
      action: 'payment_verified',
      entity: 'order',
      entity_id: order.id,
      details: { reference: order.reference, provider },
    });

    const event = getEventById(order.event_id);
    const orderTickets = store.tickets.filter((ticket) => ticket.order_id === order.id);

    // 1. Email Confirmation (Non-blocking)
    if (event) {
      sendConfirmationEmail({
        buyerName: order.buyer_name,
        buyerEmail: order.email,
        eventTitle: event.title,
        venue: event.venue,
        startsAt: event.starts_at,
        ticketTypeName: ticketType.name,
        quantity: order.quantity,
        ticketCodes: orderTickets.map((ticket) => ticket.ticket_code),
        paymentReference: payment.provider_reference,
      }).catch((error) => {
        appendAuditLog({
          action: 'email_failed',
          entity: 'order',
          entity_id: order.id,
          details: { message: error.message },
        });
      });
    }
  } else if (status === 'failed' || status === 'cancelled') {
    order.status = status;
    order.updated_at = new Date().toISOString();
    appendAuditLog({
      action: 'payment_failed',
      entity: 'order',
      entity_id: order.id,
      details: { reference: order.reference, provider, status },
    });
  }

  const orderIdx = store.orders.findIndex((o) => o.id === order.id);
  if (orderIdx >= 0) {
    store.orders[orderIdx] = order;
  }

  writeStore(store);
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
    appendAuditLog({
      action: 'email_mocked',
      entity: 'order',
      entity_id: null,
      details: { buyerName, eventTitle, paymentReference, recipients },
    });
    return { success: true, mocked: true };
  }

  const payload = {
    from: fromAddress,
    to: recipients.length > 0 ? recipients : ['hello@geohabari.com'],
    subject: `Your GeoHabari ticket confirmation for ${eventTitle}`,
    html: `
      <h2>Ticket Confirmation</h2>
      <p>Hello ${buyerName},</p>
      <p>Your order for <strong>${eventTitle}</strong> has been confirmed.</p>
      <ul>
        <li>Venue: ${venue}</li>
        <li>Date: ${new Date(startsAt).toLocaleString()}</li>
        <li>Ticket type: ${ticketTypeName}</li>
        <li>Quantity: ${quantity}</li>
        <li>Payment reference: ${paymentReference}</li>
      </ul>
      <p>Ticket codes:</p>
      <ul>${ticketCodes.map((code) => `<li><strong>${code}</strong></li>`).join('')}</ul>
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

/**
 * Dispatches one-time verification code to .ac.ke university email
 */
export async function sendUniversityVerificationEmail({ email, buyerName, code }) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM || 'noreply@geohabari.com';

  if (!apiKey) {
    appendAuditLog({
      action: 'verification_email_mocked',
      entity: 'student_verification',
      entity_id: null,
      details: {
        to: email,
        buyerName,
        note: 'RESEND_API_KEY unconfigured - verification code generated in secure store',
      },
    });
    return { success: true, mocked: true };
  }

  const payload = {
    from: fromAddress,
    to: [email],
    subject: `Your GeoHabari Student Verification Code: ${code}`,
    html: `
      <h2>GeoHabari Student Ticket Verification</h2>
      <p>Hello ${buyerName || 'Student'},</p>
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
