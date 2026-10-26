import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { authenticateAdmin, provisionAdminUser, ADMIN_COOKIE_NAME } from '../src/lib/auth.js';
import {
  isSafaricomKenyaPhone,
  normalizeEastAfricanPhone,
  validateEastAfricanPhone,
} from '../src/lib/phone.js';
import {
  createOrderCheckout as makeOrder,
  sendConfirmationEmail,
  verifyPaymentAndIssueTickets,
} from '../src/lib/ticketing.js';
import { readStore, resetStore, writeStore } from '../src/lib/ticketing-store.js';
import {
  initializePaystackTransaction,
  reconcilePaystackPayment,
} from '../src/lib/paystack.js';
import { POST as handlePaystackWebhook } from '../src/pages/api/payments/paystack.js';
import { POST as startCheckout } from '../src/pages/api/checkout.js';
import { POST as resendTicketEmail } from '../src/pages/api/admin/orders/resend.js';

test('East African phone inputs normalize to valid E.164 contacts', () => {
  const validNumbers = [
    ['0712345678', '254', '+254712345678'],
    ['701234567', '256', '+256701234567'],
    ['0712345678', '255', '+255712345678'],
    ['0721234567', '250', '+250721234567'],
    ['79123456', '257', '+25779123456'],
    ['912345678', '211', '+211912345678'],
    ['911234567', '251', '+251911234567'],
    ['61234567', '252', '+25261234567'],
  ];

  for (const [number, code, expected] of validNumbers) {
    assert.equal(normalizeEastAfricanPhone(number, code), expected);
    assert.equal(validateEastAfricanPhone(number, code), true);
  }
  assert.equal(isSafaricomKenyaPhone('0712345678'), true);
  assert.equal(isSafaricomKenyaPhone('+254731234567'), false);
  assert.equal(validateEastAfricanPhone('123', '254'), false);
});

test('Ticket confirmation email uses the verified sender and issued ticket codes', async () => {
  const oldResend = process.env.RESEND_API_KEY;
  const oldResendFrom = process.env.RESEND_FROM;
  const oldFetch = globalThis.fetch;
  process.env.RESEND_API_KEY = 're_test';
  process.env.RESEND_FROM = 'GeoHabari Tickets  < tickets@tickets.geohabari.com >';

  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), 'https://api.resend.com/emails');
    assert.equal(options.headers.Authorization, 'Bearer re_test');
    const payload = JSON.parse(options.body);
    assert.equal(payload.from, 'GeoHabari Tickets <tickets@tickets.geohabari.com>');
    assert.deepEqual(payload.to, ['buyer@example.com']);
    assert.equal(payload.subject, 'Your Ticket for Tech Summit [Confirmed]');
    assert.match(payload.html, /Hi Ada, your payment was successfully processed via Paystack/);
    assert.match(payload.html, /GH26-UNIQUE123/);
    assert.match(payload.html, /PAY-REFERENCE-123/);
    return Response.json({ id: 'email-test' });
  };

  try {
    await sendConfirmationEmail({
      buyerName: 'Ada Lovelace',
      buyerEmail: 'buyer@example.com',
      eventTitle: 'Tech Summit',
      venue: 'Nairobi',
      startsAt: '2026-10-26T09:00:00.000Z',
      ticketTypeName: 'Professional',
      quantity: 1,
      ticketCodes: ['GH26-UNIQUE123'],
      paymentReference: 'PAY-REFERENCE-123',
    });
  } finally {
    globalThis.fetch = oldFetch;
    if (oldResend === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = oldResend;
    if (oldResendFrom === undefined) delete process.env.RESEND_FROM;
    else process.env.RESEND_FROM = oldResendFrom;
  }
});

test('Paystack initialization is server-side, KES-denominated, and enables card and mobile money', async () => {
  const oldSecret = process.env.PAYSTACK_SECRET_KEY;
  const oldSite = process.env.PUBLIC_SITE_URL;
  const oldFetch = globalThis.fetch;
  process.env.PAYSTACK_SECRET_KEY = 'sk_test_private';
  process.env.PUBLIC_SITE_URL = 'https://tickets.geohabari.com';

  let initialization;
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), 'https://api.paystack.co/transaction/initialize');
    assert.match(options.headers.Authorization, /^Bearer sk_test_private$/);
    initialization = JSON.parse(options.body);
    return Response.json({
      status: true,
      data: {
        access_code: 'access-test',
        authorization_url: 'https://checkout.paystack.com/access-test',
        reference: 'GH-2026-ABC123',
      },
    });
  };

  try {
    const result = await initializePaystackTransaction({
      reference: 'GH-2026-ABC123',
      payment_method: 'mobile_money',
      amount: 600,
      email: 'buyer@example.com',
      phone: '+254712345678',
    }, { slug: 'summit', title: 'GeoHabari Summit' });

    assert.equal(result.accessCode, 'access-test');
    assert.equal(initialization.amount, '60000');
    assert.equal(initialization.currency, 'KES');
    assert.deepEqual(initialization.channels, ['mobile_money', 'card']);
    assert.match(initialization.callback_url, /reference=GH-2026-ABC123/);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldSecret === undefined) delete process.env.PAYSTACK_SECRET_KEY;
    else process.env.PAYSTACK_SECRET_KEY = oldSecret;
    if (oldSite === undefined) delete process.env.PUBLIC_SITE_URL;
    else process.env.PUBLIC_SITE_URL = oldSite;
  }
});

test('Checkout initializes Paystack when ticket email delivery is not configured', async () => {
  const oldSecret = process.env.PAYSTACK_SECRET_KEY;
  const oldSite = process.env.PUBLIC_SITE_URL;
  const oldResend = process.env.RESEND_API_KEY;
  const oldFetch = globalThis.fetch;
  process.env.PAYSTACK_SECRET_KEY = 'sk_test_private';
  process.env.PUBLIC_SITE_URL = 'https://tickets.geohabari.com';
  delete process.env.RESEND_API_KEY;
  resetStore();

  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), 'https://api.paystack.co/transaction/initialize');
    const payload = JSON.parse(options.body);
    assert.equal(payload.email, 'buyer@example.com');
    assert.equal(payload.amount, '100000');
    assert.equal(payload.currency, 'KES');
    assert.deepEqual(payload.channels, ['mobile_money', 'card']);
    return Response.json({
      status: true,
      data: {
        access_code: 'checkout-without-email',
        authorization_url: 'https://checkout.paystack.com/access-test',
        reference: payload.reference,
      },
    });
  };

  try {
    const store = readStore();
    const event = store.events[0];
    const ticketType = store.ticket_types.find((ticket) => ticket.event_id === event.id && ticket.name === 'Professional');
    const response = await startCheckout({
      request: new Request('https://tickets.geohabari.com/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event.id,
          ticket_type_id: ticketType.id,
          quantity: 1,
          buyer_name: 'Checkout Buyer',
          email: 'buyer@example.com',
          phone: '0712345678',
          payment_channel: 'card',
          accept_terms: true,
        }),
      }),
    });
    const result = await response.json();

    assert.equal(response.status, 200);
    assert.equal(result.success, true);
    assert.equal(readStore().orders[0].status, 'pending');
  } finally {
    globalThis.fetch = oldFetch;
    if (oldSecret === undefined) delete process.env.PAYSTACK_SECRET_KEY;
    else process.env.PAYSTACK_SECRET_KEY = oldSecret;
    if (oldSite === undefined) delete process.env.PUBLIC_SITE_URL;
    else process.env.PUBLIC_SITE_URL = oldSite;
    if (oldResend === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = oldResend;
  }
});

test('Email delivery failures do not prevent verified ticket issuance', async () => {
  const oldResend = process.env.RESEND_API_KEY;
  const oldFetch = globalThis.fetch;
  delete process.env.RESEND_API_KEY;
  resetStore();
  const store = readStore();
  const event = store.events[0];
  const ticketType = store.ticket_types.find((ticket) => ticket.event_id === event.id && ticket.name === 'Professional');
  const order = makeOrder(event.id, {
    buyer_name: 'Paid Buyer',
    email: 'paid@example.com',
    phone: '0712345678',
    ticket_type_id: ticketType.id,
    quantity: 1,
    payment_channel: 'card',
    accept_terms: true,
  }).order;

  globalThis.fetch = async () => {
    throw new Error('Email must not be attempted when configuration is missing.');
  };

  try {
    const result = verifyPaymentAndIssueTickets({
      orderReference: order.reference,
      provider: 'paystack',
      providerReference: order.reference,
      amount: order.amount,
      status: 'paid',
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(result.order.status, 'paid');
    assert.equal(readStore().orders.find((entry) => entry.id === order.id).status, 'paid');
    assert.equal(readStore().tickets.filter((ticket) => ticket.order_id === order.id).length, 1);
    assert.ok(readStore().audit_logs.some((log) => log.action === 'email_failed' && log.entity_id === order.id));
  } finally {
    globalThis.fetch = oldFetch;
    if (oldResend === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = oldResend;
  }
});

test('Admin can retry ticket email delivery for a paid order without changing its payment state', async () => {
  const oldResend = process.env.RESEND_API_KEY;
  const oldFetch = globalThis.fetch;
  delete process.env.RESEND_API_KEY;
  resetStore();

  const store = readStore();
  const event = store.events[0];
  const ticketType = store.ticket_types.find((ticket) => ticket.event_id === event.id && ticket.name === 'Professional');
  const order = makeOrder(event.id, {
    buyer_name: 'Resend Buyer',
    email: 'resend@example.com',
    phone: '0712345678',
    ticket_type_id: ticketType.id,
    quantity: 1,
    payment_channel: 'card',
    accept_terms: true,
  }).order;
  const paidStore = readStore();
  paidStore.orders.find((entry) => entry.id === order.id).status = 'paid';
  paidStore.tickets.push({
    id: 'ticket-resend-test',
    order_id: order.id,
    event_id: event.id,
    ticket_type_id: ticketType.id,
    ticket_code: 'GH-RESEND-TEST',
  });
  writeStore(paidStore);

  provisionAdminUser({
    email: 'resend-admin@example.com',
    password: 'LocalTestPassword123!',
    fullName: 'Resend Admin',
  });
  const login = await authenticateAdmin({ email: 'resend-admin@example.com', password: 'LocalTestPassword123!' });
  const createRequest = () => new Request('https://tickets.geohabari.com/api/admin/orders/resend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: `${ADMIN_COOKIE_NAME}=${login.sessionToken}`,
    },
    body: JSON.stringify({ reference: order.reference }),
  });

  try {
    const unavailable = await resendTicketEmail({ request: createRequest() });
    assert.equal(unavailable.status, 502);
    assert.equal(readStore().orders.find((entry) => entry.id === order.id).status, 'paid');

    process.env.RESEND_API_KEY = 're_test';
    globalThis.fetch = async (url, options) => {
      assert.equal(String(url), 'https://api.resend.com/emails');
      const email = JSON.parse(options.body);
      assert.deepEqual(email.to, ['resend@example.com']);
      assert.match(email.html, /GH-RESEND-TEST/);
      return Response.json({ id: 'resend-test-id' });
    };

    const resent = await resendTicketEmail({ request: createRequest() });
    const result = await resent.json();
    assert.equal(resent.status, 200);
    assert.equal(result.success, true);
    assert.equal(readStore().orders.find((entry) => entry.id === order.id).status, 'paid');
    assert.ok(readStore().audit_logs.some((entry) => entry.action === 'email_resent' && entry.entity_id === order.id));
  } finally {
    globalThis.fetch = oldFetch;
    if (oldResend === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = oldResend;
  }
});

test('Signed Paystack webhooks verify server-side and issue tickets exactly once', async () => {
  const oldSecret = process.env.PAYSTACK_SECRET_KEY;
  const oldSite = process.env.PUBLIC_SITE_URL;
  const oldResend = process.env.RESEND_API_KEY;
  const oldResendFrom = process.env.RESEND_FROM;
  const oldFetch = globalThis.fetch;
  process.env.PAYSTACK_SECRET_KEY = 'sk_test_private';
  process.env.PUBLIC_SITE_URL = 'https://tickets.geohabari.com';
  process.env.RESEND_API_KEY = 're_test';
  process.env.RESEND_FROM = 'GeoHabari Tickets  < tickets@tickets.geohabari.com >';
  resetStore();

  const store = readStore();
  const event = store.events[0];
  const ticketType = store.ticket_types.find((ticket) => ticket.event_id === event.id && ticket.name === 'Professional');
  const order = makeOrder(event.id, {
    buyer_name: 'Card Buyer',
    email: 'buyer@example.com',
    phone: '0712345678',
    ticket_type_id: ticketType.id,
    quantity: 2,
    payment_channel: 'card',
    accept_terms: true,
  }).order;
  let verificationCalls = 0;
  const sentEmails = [];

  globalThis.fetch = async (url, options) => {
    if (String(url) === `https://api.paystack.co/transaction/verify/${order.reference}`) {
      verificationCalls += 1;
      return Response.json({
        status: true,
        data: {
          reference: order.reference,
          status: 'success',
          amount: order.amount * 100,
          currency: 'KES',
          channel: 'card',
        },
      });
    }
    if (String(url) === 'https://api.resend.com/emails') {
      sentEmails.push(JSON.parse(options.body));
      return Response.json({ id: 'email-test' });
    }
    throw new Error('Unexpected request in Paystack webhook test.');
  };

  try {
    const rawBody = JSON.stringify({
      event: 'charge.success',
      data: { reference: order.reference },
    });
    const signature = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest('hex');
    const request = () => new Request('https://tickets.geohabari.com/api/payments/paystack', {
      method: 'POST',
      headers: { 'x-paystack-signature': signature },
      body: rawBody,
    });

    const first = await handlePaystackWebhook({ request: request() });
    const firstBody = await first.json();
    assert.equal(first.status, 200);
    assert.equal(firstBody.status, 'paid');
    assert.equal(firstBody.alreadyProcessed, false);

    const duplicate = await handlePaystackWebhook({ request: request() });
    const duplicateBody = await duplicate.json();
    assert.equal(duplicate.status, 200);
    assert.equal(duplicateBody.alreadyProcessed, true);
    assert.equal(verificationCalls, 2);
    assert.equal(sentEmails.length, 1);
    assert.equal(sentEmails[0].from, 'GeoHabari Tickets <tickets@tickets.geohabari.com>');
    assert.deepEqual(sentEmails[0].to, ['buyer@example.com']);
    assert.equal(sentEmails[0].subject, `Your Ticket for ${event.title} [Confirmed]`);
    assert.match(sentEmails[0].html, /Thank you for your purchase!/);
    assert.match(sentEmails[0].html, /payment was successfully processed via Paystack/);
    assert.equal(readStore().tickets.filter((ticket) => ticket.order_id === order.id).length, 2);
    assert.ok(readStore().tickets.every((ticket) => ticket.attendee_name === order.buyer_name));
    for (const ticket of readStore().tickets.filter((entry) => entry.order_id === order.id)) {
      assert.match(sentEmails[0].html, new RegExp(ticket.ticket_code));
    }

    const invalid = await handlePaystackWebhook({
      request: new Request('https://tickets.geohabari.com/api/payments/paystack', {
        method: 'POST',
        headers: { 'x-paystack-signature': 'invalid' },
        body: rawBody,
      }),
    });
    assert.equal(invalid.status, 401);
    assert.equal(verificationCalls, 2);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldSecret === undefined) delete process.env.PAYSTACK_SECRET_KEY;
    else process.env.PAYSTACK_SECRET_KEY = oldSecret;
    if (oldSite === undefined) delete process.env.PUBLIC_SITE_URL;
    else process.env.PUBLIC_SITE_URL = oldSite;
    if (oldResend === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = oldResend;
    if (oldResendFrom === undefined) delete process.env.RESEND_FROM;
    else process.env.RESEND_FROM = oldResendFrom;
  }
});

test('Mobile money checkout rejects non-Safaricom contact numbers but card accepts them', () => {
  resetStore();
  const store = readStore();
  const event = store.events[0];
  const ticketType = store.ticket_types.find((ticket) => ticket.event_id === event.id && ticket.name === 'Professional');
  const buyer = {
    buyer_name: 'Regional Buyer',
    email: 'buyer@example.com',
    phone: '+256701234567',
    ticket_type_id: ticketType.id,
    quantity: 1,
    accept_terms: true,
  };

  assert.throws(
    () => makeOrder(event.id, { ...buyer, payment_channel: 'mobile_money' }),
    /Safaricom Kenya numbers/
  );
  const cardOrder = makeOrder(event.id, { ...buyer, payment_channel: 'card' }).order;
  assert.equal(cardOrder.phone, '+256701234567');
});

test('Unmatched amounts stay pending and abandoned Paystack transactions are cancelled', async () => {
  const oldSecret = process.env.PAYSTACK_SECRET_KEY;
  const oldFetch = globalThis.fetch;
  process.env.PAYSTACK_SECRET_KEY = 'sk_test_private';
  resetStore();

  const store = readStore();
  const event = store.events[0];
  const ticketType = store.ticket_types.find((ticket) => ticket.event_id === event.id && ticket.name === 'Professional');
  const order = makeOrder(event.id, {
    buyer_name: 'Verification Buyer',
    email: 'verify@example.com',
    phone: '0712345678',
    ticket_type_id: ticketType.id,
    quantity: 1,
    payment_channel: 'card',
    accept_terms: true,
  }).order;
  let transaction = {
    reference: order.reference,
    status: 'success',
    amount: order.amount * 100 + 1,
    currency: 'KES',
    channel: 'card',
  };
  globalThis.fetch = async () => Response.json({ status: true, data: transaction });

  try {
    await assert.rejects(reconcilePaystackPayment(order.reference), /amount or currency does not match/);
    assert.equal(readStore().orders.find((entry) => entry.id === order.id).status, 'pending');
    assert.equal(readStore().tickets.filter((ticket) => ticket.order_id === order.id).length, 0);

    transaction = { ...transaction, status: 'abandoned' };
    const result = await reconcilePaystackPayment(order.reference);
    assert.equal(result.status, 'cancelled');
    assert.equal(readStore().orders.find((entry) => entry.id === order.id).status, 'cancelled');
    assert.equal(readStore().tickets.filter((ticket) => ticket.order_id === order.id).length, 0);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldSecret === undefined) delete process.env.PAYSTACK_SECRET_KEY;
    else process.env.PAYSTACK_SECRET_KEY = oldSecret;
  }
});
