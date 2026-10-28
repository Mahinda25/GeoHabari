import { handlePaystackWebhook } from '../../lib/paystack-webhook.js';

export async function POST({ request }) {
  return handlePaystackWebhook(request);
}
