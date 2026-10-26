import { initializeCheckout } from '../../lib/checkout-initialize.js';

export async function POST({ request }) {
  return initializeCheckout(request);
}
