/* Disabled - may be used in future. Paystack is the only active payment gateway.
import { setPaymentProviderReference } from './ticketing-store.js';

function getPesapalConfig() {
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
  const notificationId = process.env.PESAPAL_IPN_ID;
  const siteUrl = process.env.PUBLIC_SITE_URL;

  if (!consumerKey || !consumerSecret || !notificationId || !siteUrl) {
    throw new Error('Pesapal checkout is not configured. Set PESAPAL_CONSUMER_KEY, PESAPAL_CONSUMER_SECRET, PESAPAL_IPN_ID, and PUBLIC_SITE_URL.');
  }

  return {
    consumerKey,
    consumerSecret,
    notificationId,
    siteUrl: siteUrl.replace(/\/+$/, ''),
    baseUrl: process.env.PESAPAL_ENVIRONMENT === 'live'
      ? 'https://pay.pesapal.com/v3'
      : 'https://cybqa.pesapal.com/pesapalv3',
  };
}

export function assertPesapalConfigured() {
  getPesapalConfig();
}

async function getAccessToken(config) {
  const response = await fetch(`${config.baseUrl}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      consumer_key: config.consumerKey,
      consumer_secret: config.consumerSecret,
    }),
  });
  const data = await response.json();
  if (!response.ok || !data.token) {
    throw new Error(data.message || 'Pesapal authentication failed.');
  }
  return data.token;
}

export async function submitPesapalOrder(order, event) {
  const config = getPesapalConfig();
  const token = await getAccessToken(config);
  const callbackUrl = new URL(`/events/${encodeURIComponent(event.slug)}/success`, config.siteUrl);
  callbackUrl.searchParams.set('reference', order.reference);

  const nameParts = order.buyer_name.trim().split(/\s+/);
  const response = await fetch(`${config.baseUrl}/api/Transactions/SubmitOrderRequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      id: order.reference,
      currency: 'KES',
      amount: order.amount,
      description: `${event.title} ticket purchase`,
      callback_url: callbackUrl.toString(),
      notification_id: config.notificationId,
      billing_address: {
        email_address: order.email,
        phone_number: order.phone,
        country_code: 'KE',
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(' ') || nameParts[0],
      },
    }),
  });
  const data = await response.json();
  if (!response.ok || !data.order_tracking_id || !data.redirect_url) {
    throw new Error(data.message || 'Pesapal did not return a hosted checkout URL.');
  }

  setPaymentProviderReference(order.id, data.order_tracking_id);
  return {
    redirectUrl: data.redirect_url,
    trackingId: data.order_tracking_id,
  };
}

export async function getPesapalTransactionStatus(orderTrackingId) {
  const config = getPesapalConfig();
  const token = await getAccessToken(config);
  const statusUrl = new URL(`${config.baseUrl}/api/Transactions/GetTransactionStatus`);
  statusUrl.searchParams.set('orderTrackingId', orderTrackingId);

  const response = await fetch(statusUrl, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Pesapal could not verify the transaction.');
  }
  return data;
}
*/
