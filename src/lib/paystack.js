import { createHmac, timingSafeEqual } from 'node:crypto';
import { getOrderByReference, getPaymentByReference, getTicketsByOrder } from './ticketing-store.js';
import { verifyPaymentAndIssueTickets } from './ticketing.js';

const API_BASE_URL = 'https://api.paystack.co';

function getServerEnv(name) {
  const viteEnv = import.meta.env || {};
  return String(process.env[name] || viteEnv[name] || '').trim();
}

function getSecretKey() {
  const secretKey = getServerEnv('PAYSTACK_SECRET_KEY');
  if (!secretKey) {
    throw new Error('Paystack is not configured. Set PAYSTACK_SECRET_KEY on the server.');
  }
  return secretKey;
}

function getSiteUrl() {
  const siteUrl = getServerEnv('PUBLIC_SITE_URL');
  if (!siteUrl) {
    throw new Error('Paystack checkout requires PUBLIC_SITE_URL to be configured.');
  }
  try {
    const parsedUrl = new URL(siteUrl);
    if (parsedUrl.protocol !== 'https:' && parsedUrl.hostname !== 'localhost') {
      throw new Error();
    }
  } catch {
    throw new Error('PUBLIC_SITE_URL must be a valid HTTPS URL (localhost is allowed for development).');
  }
  return siteUrl;
}

async function requestPaystack(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let response;
  let payload;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${getSecretKey()}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    try {
      payload = await response.json();
    } catch {
      throw new Error('Paystack returned an invalid response. Please try again.');
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Paystack request timed out. Please try again.');
    }
    if (error instanceof Error && error.message.startsWith('Paystack returned an invalid response')) {
      throw error;
    }
    throw new Error('Unable to reach Paystack. Please try again.');
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok || !payload || payload.status !== true || !payload.data) {
    const message = typeof payload?.message === 'string' ? payload.message : '';
    if (response.status === 401 || response.status === 403) {
      throw new Error('Paystack rejected the server credentials. Check PAYSTACK_SECRET_KEY.');
    }
    throw new Error(message || `Paystack request failed with status ${response.status}.`);
  }

  return payload.data;
}

export function assertPaystackConfigured() {
  getSecretKey();
  getSiteUrl();
}

export async function initializePaystackTransaction(order, event) {
  assertPaystackConfigured();
  if (!['card', 'mobile_money'].includes(order.payment_method)) {
    throw new Error('Unsupported Paystack payment channel.');
  }
  const amountKobo = Math.round(Number(order.amount) * 100);
  if (!Number.isSafeInteger(amountKobo) || amountKobo <= 0) {
    throw new Error('The order amount must be a positive KES amount.');
  }

  const callbackUrl = new URL(
    `/events/${encodeURIComponent(event.slug)}/success`,
    getSiteUrl()
  );
  callbackUrl.searchParams.set('reference', order.reference);

  const data = await requestPaystack('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: order.email,
      amount: String(amountKobo),
      currency: 'KES',
      reference: order.reference,
      callback_url: callbackUrl.toString(),
      channels: ['mobile_money', 'card'],
      metadata: {
        order_reference: order.reference,
        order_id: order.id,
        event_id: order.event_id,
        event_title: event.title,
        ticket_type_id: order.ticket_type_id,
        buyer_name: order.buyer_name,
        email: order.email,
        buyer_phone: order.phone,
        quantity: order.quantity,
        order_amount: order.amount,
        payment_method: order.payment_method,
        organization: order.organization || '',
        role: order.role || '',
        student_verification_id: order.student_verification_id || '',
        accepted_terms: order.accepted_terms === true,
      },
    }),
  });

  if (!data.access_code || !data.reference || data.reference !== order.reference) {
    throw new Error('Paystack returned an invalid transaction initialization response.');
  }

  return {
    accessCode: data.access_code,
    authorizationUrl: data.authorization_url,
    reference: data.reference,
  };
}

export async function verifyPaystackTransaction(reference) {
  const normalizedReference = String(reference ?? '').trim();
  if (!normalizedReference || !/^[A-Za-z0-9.=-]{1,100}$/.test(normalizedReference)) {
    throw new Error('A valid Paystack transaction reference is required.');
  }

  return requestPaystack(`/transaction/verify/${encodeURIComponent(normalizedReference)}`);
}

export function verifyPaystackWebhookSignature(rawBody, signature) {
  const secretKey = getSecretKey();
  if (typeof signature !== 'string' || !/^[a-f\d]{128}$/i.test(signature)) return false;

  const expected = createHmac('sha512', secretKey).update(rawBody).digest();
  const actual = Buffer.from(signature, 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function reconcilePaystackPayment(reference, webhookPayload = null, dependencies = {}) {
  const loadOrder = dependencies.getOrderByReference || getOrderByReference;
  const loadPayment = dependencies.getPaymentByReference || getPaymentByReference;
  const verifyTransaction = dependencies.verifyTransaction || verifyPaystackTransaction;
  const fulfillPayment = dependencies.fulfillPayment || verifyPaymentAndIssueTickets;
  const order = await loadOrder(reference);
  const payment = await loadPayment(reference);
  const existingTickets = order?.status === 'paid' && payment?.status === 'paid'
    ? await getTicketsByOrder(order.id)
    : [];
  if (
    order?.status === 'paid' &&
    payment?.status === 'paid' &&
    existingTickets.length >= Number(order.quantity)
  ) {
    return { order, status: 'paid', alreadyProcessed: true };
  }
  if (!order) {
    throw new Error('Paystack transaction could not be matched to a pending order.');
  }
  if (order && order.payment_provider !== 'paystack') {
    throw new Error('Paystack transaction could not be matched to a Paystack order.');
  }
  if (!['pending', 'paid', 'cancelled'].includes(order.status)) {
    throw new Error('Paystack transaction order is not pending, paid, or cancelled.');
  }
  if (
    payment &&
    (payment.order_id !== order.id ||
      payment.provider !== 'paystack' ||
      payment.provider_reference !== reference)
  ) {
    throw new Error('Paystack transaction could not be matched to its order.');
  }
  if (!payment && order.status === 'pending') {
    throw new Error('Paystack pending order is missing its payment record.');
  }

  const transaction = await verifyTransaction(reference);
  if (transaction.reference !== reference) {
    throw new Error('Paystack transaction reference does not match the order.');
  }

  const orderData = order;
  if (
    orderData.reference !== reference ||
    !orderData.id ||
    !orderData.event_id ||
    !orderData.ticket_type_id ||
    !orderData.buyer_name ||
    !orderData.email ||
    !orderData.phone ||
    !Number.isInteger(Number(orderData.quantity)) ||
    Number(orderData.quantity) < 1 ||
    Number(orderData.quantity) > 5 ||
    !Number.isFinite(Number(orderData.amount)) ||
    !['mobile_money', 'card'].includes(orderData.payment_method)
  ) {
    throw new Error('Paystack transaction is missing validated checkout metadata.');
  }

  if (transaction.status === 'success') {
    const expectedAmountKobo = Number(orderData.amount) * 100;
    const receivedAmountKobo = Number(transaction.amount);
    if (
      !Number.isSafeInteger(expectedAmountKobo) ||
      !Number.isSafeInteger(receivedAmountKobo) ||
      receivedAmountKobo !== expectedAmountKobo ||
      transaction.currency !== 'KES'
    ) {
      throw new Error('Verified Paystack amount or currency does not match the order.');
    }
    if (!['mobile_money', 'card'].includes(transaction.channel)) {
      throw new Error('Verified Paystack payment channel is not enabled for this checkout.');
    }
    if (
      (transaction.metadata?.order_reference && transaction.metadata.order_reference !== order.reference) ||
      (transaction.metadata?.order_id && transaction.metadata.order_id !== order.id)
    ) {
      throw new Error('Verified Paystack transaction metadata does not match the order.');
    }

    const result = await fulfillPayment({
      orderReference: order.reference,
      provider: 'paystack',
      providerReference: reference,
      amount: Number(transaction.amount) / 100,
      currency: transaction.currency,
      channel: transaction.channel,
      paidAt: transaction.paid_at || new Date().toISOString(),
      rawPayload: webhookPayload || transaction,
      orderData,
      status: 'paid',
    });
    return {
      order: result.order,
      status: result.order.status,
      alreadyProcessed: result.alreadyProcessed,
      emailSent: result.emailSent,
    };
  }

  const paymentExpiresAt = Date.parse(order.payment_expires_at || '');
  const fallbackExpiresAt = Date.parse(order.created_at || '') + 20 * 60 * 1000;
  const reservationExpired = Number.isFinite(paymentExpiresAt)
    ? paymentExpiresAt <= Date.now()
    : Number.isFinite(fallbackExpiresAt) && fallbackExpiresAt <= Date.now();
  const terminalFailure = transaction.status === 'failed'
    || (transaction.status === 'abandoned' && reservationExpired);
  const webhookSuccessStillUnverified = webhookPayload?.event === 'charge.success';

  if (
    dependencies.persistCancellation &&
    terminalFailure &&
    !webhookSuccessStillUnverified &&
    order.status !== 'cancelled'
  ) {
    const result = await fulfillPayment({
      orderReference: reference,
      provider: 'paystack',
      providerReference: reference,
      amount: Number(orderData.amount),
      currency: transaction.currency || 'KES',
      channel: transaction.channel || orderData.payment_method,
      paidAt: null,
      rawPayload: transaction,
      orderData,
      status: 'cancelled',
    });
    return { order: result.order, status: 'cancelled', alreadyProcessed: result.alreadyProcessed };
  }

  if (order.status === 'cancelled' && terminalFailure && !webhookSuccessStillUnverified) {
    return { order, status: 'cancelled', alreadyProcessed: true };
  }

  return { order, status: 'processing', alreadyProcessed: false };
}
