import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeCheckout } from '../src/lib/checkout-initialize.js';

test('Checkout initialization rejects malformed JSON with a JSON error', async () => {
  const response = await initializeCheckout(new Request('https://tickets.geohabari.com/api/checkout/initialize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{',
  }));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Request body must contain valid JSON.' });
});

test('Checkout initialization requires an event and does not accept an arbitrary amount-only payment', async () => {
  const response = await initializeCheckout(new Request('https://tickets.geohabari.com/api/checkout/initialize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'buyer@example.com', amount: 100 }),
  }));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'An event is required to start ticket checkout.' });
});

test('Checkout initialization reports missing server configuration as a service error', async () => {
  const oldSecret = process.env.PAYSTACK_SECRET_KEY;
  const oldSite = process.env.PUBLIC_SITE_URL;
  delete process.env.PAYSTACK_SECRET_KEY;
  delete process.env.PUBLIC_SITE_URL;

  try {
    const response = await initializeCheckout(new Request('https://tickets.geohabari.com/api/checkout/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: 'summit',
        email: 'buyer@example.com',
        amount: 100,
      }),
    }));

    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      error: 'Secure payment is temporarily unavailable. Please try again later or contact the event organizer.',
    });
  } finally {
    if (oldSecret === undefined) delete process.env.PAYSTACK_SECRET_KEY;
    else process.env.PAYSTACK_SECRET_KEY = oldSecret;
    if (oldSite === undefined) delete process.env.PUBLIC_SITE_URL;
    else process.env.PUBLIC_SITE_URL = oldSite;
  }
});
