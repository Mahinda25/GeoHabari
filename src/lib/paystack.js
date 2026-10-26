import { createHmac, timingSafeEqual } from 'node:crypto';
import { getOrderByReference, getPaymentByReference } from './ticketing-store.js';
import { verifyPaymentAndIssueTickets } from './ticketing.js';

const API_BASE_URL = 'https://api.paystack.co';

function getServerEnv(name) {
  const viteEnv = import.meta.env || {};
  return viteEnv[name] || process.env[name] || '';
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
        event_title: event.title,
        buyer_phone: order.phone,
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
  if (!signature || typeof signature !== 'string') return false;

  const expected = createHmac('sha512', secretKey).update(rawBody).digest();
  const actual = Buffer.from(signature, 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function reconcilePaystackPayment(reference) {
  const order = await getOrderByReference(reference);
  const payment = await getPaymentByReference(reference);
  if (
    !order ||
    order.payment_provider !== 'paystack' ||
    !payment ||
    payment.order_id !== order.id ||
    payment.provider !== 'paystack'
  ) {
    throw new Error('Paystack transaction could not be matched to a pending order.');
  }

  const transaction = await verifyPaystackTransaction(reference);
  if (transaction.reference !== order.reference) {
    throw new Error('Paystack transaction reference does not match the order.');
  }

  if (transaction.status === 'success') {
    if (Number(transaction.amount) !== Number(order.amount) * 100 || transaction.currency !== 'KES') {
      throw new Error('Verified Paystack amount or currency does not match the order.');
    }
    if (!['mobile_money', 'card'].includes(transaction.channel)) {
      throw new Error('Verified Paystack payment channel is not enabled for this checkout.');
    }

    const result = await verifyPaymentAndIssueTickets({
      orderReference: order.reference,
      provider: 'paystack',
      providerReference: reference,
      amount: Number(transaction.amount) / 100,
      status: 'paid',
    });
    return { order: result.order, status: result.order.status, alreadyProcessed: result.alreadyProcessed };
  }

  if (transaction.status === 'failed' || transaction.status === 'abandoned' || transaction.status === 'cancelled') {
    const paymentStatus = transaction.status === 'failed' ? 'failed' : 'cancelled';
    const result = await verifyPaymentAndIssueTickets({
      orderReference: order.reference,
      provider: 'paystack',
      providerReference: reference,
      status: paymentStatus,
    });
    return { order: result.order, status: result.order.status, alreadyProcessed: result.alreadyProcessed };
  }

  return { order, status: 'pending', alreadyProcessed: false };
}
