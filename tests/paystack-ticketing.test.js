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
import { createPaystackWebhookHandler } from '../src/lib/paystack-webhook.js';
import { createPaystackStatusHandler } from '../src/pages/api/payments/paystack/verify.js';
import { createCheckoutInitializer } from '../src/lib/checkout-initialize.js';
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
    assert.match(options.headers['Idempotency-Key'], /^ticket-confirmation-[a-f\d]{64}$/);
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
  const checkoutOrder = {
    id: '00000000-0000-4000-8000-000000000001',
    reference: 'GH-2026-ABC123',
    payment_method: 'mobile_money',
    amount: 600,
    email: 'buyer@example.com',
    phone: '+254712345678',
    buyer_name: 'Checkout Buyer',
    event_id: 'event-test',
    ticket_type_id: 'ticket-student',
    quantity: 1,
    organization: null,
    role: null,
    accepted_terms: true,
    student_verification_id: 'verification-test',
  };
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
    const result = await initializePaystackTransaction(
      checkoutOrder,
      { slug: 'summit', title: 'GeoHabari Summit' }
    );

    assert.equal(result.accessCode, 'access-test');
    assert.equal(initialization.amount, '60000');
    assert.equal(initialization.currency, 'KES');
    assert.deepEqual(initialization.channels, ['mobile_money', 'card']);
    assert.match(initialization.callback_url, /reference=GH-2026-ABC123/);
    assert.deepEqual(initialization.metadata, {
      order_reference: checkoutOrder.reference,
      order_id: checkoutOrder.id,
      event_id: checkoutOrder.event_id,
      event_title: 'GeoHabari Summit',
      ticket_type_id: checkoutOrder.ticket_type_id,
      buyer_name: checkoutOrder.buyer_name,
      email: checkoutOrder.email,
      buyer_phone: checkoutOrder.phone,
      quantity: checkoutOrder.quantity,
      order_amount: checkoutOrder.amount,
      payment_method: checkoutOrder.payment_method,
      organization: '',
      role: '',
      student_verification_id: checkoutOrder.student_verification_id,
      accepted_terms: true,
    });
  } finally {
    globalThis.fetch = oldFetch;
    if (oldSecret === undefined) delete process.env.PAYSTACK_SECRET_KEY;
    else process.env.PAYSTACK_SECRET_KEY = oldSecret;
    if (oldSite === undefined) delete process.env.PUBLIC_SITE_URL;
    else process.env.PUBLIC_SITE_URL = oldSite;
  }
});

test('Checkout reserves pending order and payment before initializing Paystack', async () => {
  let preparedOrder;
  let preparedPayment;
  const persistenceOrder = [];
  const initializeCheckout = createCheckoutInitializer({
    assertConfigured: () => {},
    prepareOrder: async () => ({
      order: {
        reference: 'GH-2026-NO-PENDING',
        amount: 1000,
        email: 'buyer@example.com',
        status: 'pending',
      },
      payment: {
        provider_reference: 'GH-2026-NO-PENDING',
        amount: 1000,
        status: 'pending',
      },
      event: { title: 'Test Summit' },
    }),
    persistCheckout: async ({ order, payment }) => {
      preparedOrder = order;
      preparedPayment = payment;
      persistenceOrder.push('persist');
      return { order, payment };
    },
    initializeTransaction: async (order) => {
      assert.equal(preparedOrder, order);
      assert.equal(preparedPayment.status, 'pending');
      persistenceOrder.push('initialize');
      return {
        accessCode: 'checkout-no-pending',
        authorizationUrl: 'https://checkout.paystack.com/test',
      };
    },
  });

  const response = await initializeCheckout(new Request('https://tickets.geohabari.com/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_id: 'event-test', email: 'buyer@example.com' }),
  }));
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.success, true);
  assert.equal(result.reference, 'GH-2026-NO-PENDING');
  assert.equal(preparedOrder.status, 'pending');
  assert.equal(preparedPayment.status, 'pending');
  assert.deepEqual(persistenceOrder, ['persist', 'initialize']);
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

test('Unmatched and abandoned legacy Paystack transactions remain unfulfilled', async () => {
  const order = {
    id: 'order-pending-test',
    reference: 'GH-2026-PENDING',
    event_id: 'event-test',
    ticket_type_id: 'ticket-type-test',
    buyer_name: 'Test Buyer',
    email: 'buyer@example.com',
    phone: '+254712345678',
    quantity: 1,
    payment_provider: 'paystack',
    status: 'pending',
    amount: 1000,
    payment_method: 'card',
    accepted_terms: true,
  };
  const payment = {
    order_id: order.id,
    provider: 'paystack',
    provider_reference: order.reference,
    status: 'pending',
  };
  let transaction = {
    reference: order.reference,
    status: 'success',
    amount: order.amount * 100 + 1,
    currency: 'KES',
    channel: 'card',
  };
  const dependencies = {
    getOrderByReference: async () => order,
    getPaymentByReference: async () => payment,
    verifyTransaction: async () => transaction,
    fulfillPayment: async () => {
      throw new Error('Unsuccessful payments must not fulfill orders.');
    },
  };

  await assert.rejects(
    reconcilePaystackPayment(order.reference, null, dependencies),
    /amount or currency does not match/
  );
  assert.equal(order.status, 'pending');

  transaction = { ...transaction, status: 'abandoned' };
  const result = await reconcilePaystackPayment(order.reference, null, dependencies);
  assert.equal(result.status, 'processing');
  assert.equal(order.status, 'pending');

  transaction = { ...transaction, status: 'failed' };
  const delayedVerification = await reconcilePaystackPayment(
    order.reference,
    { event: 'charge.success', data: { reference: order.reference } },
    { ...dependencies, persistCancellation: true }
  );
  assert.equal(delayedVerification.status, 'processing');
  assert.equal(order.status, 'pending');
});

test('Timed-out webhook payment recovers through status polling and provisions tickets once', async () => {
  const order = {
    id: 'order-recovery-test',
    reference: 'GH-2026-RECOVERY',
    event_id: 'event-recovery',
    ticket_type_id: 'ticket-type-recovery',
    buyer_name: 'Recovery Buyer',
    email: 'buyer@example.com',
    phone: '+254712345678',
    payment_method: 'card',
    accepted_terms: true,
    organization: 'Example Org',
    role: 'Engineer',
    payment_provider: 'paystack',
    status: 'pending',
    amount: 1000,
    quantity: 2,
  };
  const payment = {
    order_id: order.id,
    provider: 'paystack',
    provider_reference: order.reference,
    status: 'pending',
  };
  const tickets = [];
  let confirmedPayment;
  const logger = console.error;
  console.error = () => {};

  try {
    const webhook = createPaystackWebhookHandler({
      verifySignature: () => true,
      loadOrder: async (reference) => reference === order.reference ? order : null,
      reconcile: async () => {
        throw new Error('Paystack request timed out.');
      },
    });
    const webhookResponse = await webhook(new Request('https://tickets.geohabari.com/api/paystack/webhook', {
      method: 'POST',
      headers: { 'x-paystack-signature': 'test-signature' },
      body: JSON.stringify({
        event: 'charge.success',
        data: { reference: order.reference },
      }),
    }));
    assert.equal(webhookResponse.status, 502);
    assert.equal(order.status, 'pending');

    const recoveryHandler = createPaystackStatusHandler({
      loadOrder: async (reference) => reference === order.reference ? order : null,
      recoverPayment: (reference) => reconcilePaystackPayment(reference, null, {
        getOrderByReference: async () => order,
        getPaymentByReference: async () => payment,
        verifyTransaction: async () => ({
          reference: order.reference,
          status: 'success',
          amount: order.amount * 100,
          currency: 'KES',
          channel: 'card',
          paid_at: '2026-10-27T10:00:00.000Z',
        }),
        fulfillPayment: async (details) => {
          confirmedPayment = details;
          order.status = 'paid';
          payment.status = 'paid';
          tickets.push(...Array.from({ length: order.quantity }, (_, index) => ({
            order_id: order.id,
            ticket_code: `TCK-2026-RECOVERY${index + 1}`,
          })));
          return {
            order,
            payment,
            tickets,
            alreadyProcessed: false,
          };
        },
      }),
    });
    const pollResponse = await recoveryHandler({
      request: new Request('https://tickets.geohabari.com/api/payments/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: order.reference }),
      }),
    });
    const result = await pollResponse.json();

    assert.equal(pollResponse.status, 200);
    assert.equal(result.status, 'paid');
    assert.equal(order.status, 'paid');
    assert.equal(payment.status, 'paid');
    assert.equal(tickets.length, order.quantity);
    assert.ok(tickets.every((ticket) => ticket.order_id === order.id && ticket.ticket_code.startsWith('TCK-2026-')));
    assert.equal(confirmedPayment.currency, 'KES');
    assert.equal(confirmedPayment.channel, 'card');
    assert.equal(confirmedPayment.amount, order.amount);
    assert.equal(confirmedPayment.rawPayload.status, 'success');

    const duplicatePoll = await recoveryHandler({
      request: new Request('https://tickets.geohabari.com/api/payments/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: order.reference }),
      }),
    });
    assert.equal((await duplicatePoll.json()).status, 'paid');
    assert.equal(tickets.length, order.quantity);
  } finally {
    console.error = logger;
  }
});

test('Client verification records an explicitly failed Paystack checkout as cancelled without tickets', async () => {
  const reference = 'GH-2026-CANCELLED';
  const metadata = {
    order_id: '00000000-0000-4000-8000-000000000002',
    order_reference: reference,
    event_id: 'event-test',
    ticket_type_id: 'ticket-type-test',
    buyer_name: 'Cancelled Buyer',
    email: 'cancelled@example.com',
    buyer_phone: '+254712345678',
    quantity: 1,
    order_amount: 1000,
    payment_method: 'card',
    accepted_terms: true,
  };
  const pendingOrder = {
    id: metadata.order_id,
    reference,
    event_id: metadata.event_id,
    ticket_type_id: metadata.ticket_type_id,
    buyer_name: metadata.buyer_name,
    email: metadata.email,
    phone: metadata.buyer_phone,
    quantity: metadata.quantity,
    amount: metadata.order_amount,
    payment_method: metadata.payment_method,
    payment_provider: 'paystack',
    accepted_terms: true,
    status: 'pending',
  };
  const pendingPayment = {
    order_id: pendingOrder.id,
    provider: 'paystack',
    provider_reference: reference,
    status: 'pending',
  };
  let fulfillment;
  const handler = createPaystackStatusHandler({
    loadOrder: async () => pendingOrder,
    recoverPayment: (orderReference, _payload, options) => reconcilePaystackPayment(
      orderReference,
      null,
      {
        ...options,
        getOrderByReference: async () => pendingOrder,
        getPaymentByReference: async () => pendingPayment,
        verifyTransaction: async () => ({
          reference,
          status: 'failed',
          amount: 100000,
          currency: 'KES',
          channel: 'card',
          metadata,
        }),
        fulfillPayment: async (details) => {
          fulfillment = details;
          return {
            order: { ...details.orderData, status: 'cancelled' },
            payment: { status: 'failed' },
            tickets: [],
            alreadyProcessed: false,
          };
        },
      }
    ),
  });

  const response = await handler({
    request: new Request('https://tickets.geohabari.com/api/payments/paystack/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference }),
    }),
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.status, 'cancelled');
  assert.equal(fulfillment.status, 'cancelled');
  assert.equal(fulfillment.orderData.reference, reference);
});

test('Client verification keeps unknown Paystack states pending without writing cancellation', async () => {
  const reference = 'GH-2026-UNKNOWN';
  const order = {
    id: '00000000-0000-4000-8000-000000000003',
    reference,
    event_id: 'event-test',
    ticket_type_id: 'ticket-type-test',
    buyer_name: 'Unknown State Buyer',
    email: 'buyer@example.com',
    phone: '+254712345678',
    quantity: 1,
    payment_provider: 'paystack',
    status: 'pending',
    amount: 1000,
    payment_method: 'card',
    accepted_terms: true,
  };
  let fulfillmentCalls = 0;
  const handler = createPaystackStatusHandler({
    loadOrder: async () => order,
    recoverPayment: (orderReference, _payload, options) => reconcilePaystackPayment(
      orderReference,
      null,
      {
        ...options,
        getOrderByReference: async () => order,
        getPaymentByReference: async () => ({
          order_id: order.id,
          provider: 'paystack',
          provider_reference: reference,
          status: 'pending',
        }),
        verifyTransaction: async () => ({
          reference,
          status: 'cancelled',
          amount: 100000,
          currency: 'KES',
          channel: 'card',
        }),
        fulfillPayment: async () => {
          fulfillmentCalls += 1;
          throw new Error('Unconfirmed provider states must not be persisted.');
        },
      }
    ),
  });

  const response = await handler({
    request: new Request('https://tickets.geohabari.com/api/payments/paystack/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference }),
    }),
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.status, 'pending');
  assert.equal(result.message, 'Waiting for payment gateway settlement');
  assert.equal(order.status, 'pending');
  assert.equal(fulfillmentCalls, 0);
});

test('Client verification returns pending when Paystack verification times out', async () => {
  const logger = console.warn;
  console.warn = () => {};
  const handler = createPaystackStatusHandler({
    loadOrder: async () => ({
      reference: 'GH-2026-TIMEOUT',
      payment_provider: 'paystack',
      status: 'pending',
    }),
    recoverPayment: async () => {
      throw new Error('Paystack request timed out.');
    },
  });

  try {
    const response = await handler({
      request: new Request('https://tickets.geohabari.com/api/payments/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: 'GH-2026-TIMEOUT' }),
      }),
    });
    const result = await response.json();

    assert.equal(response.status, 200);
    assert.equal(result.status, 'pending');
    assert.equal(result.message, 'Waiting for payment gateway settlement');
  } finally {
    console.warn = logger;
  }
});

test('Client verification returns paid directly and rechecks cancelled orders for late success', async () => {
  let recoverCalls = 0;
  const paidHandler = createPaystackStatusHandler({
    loadOrder: async () => ({
      reference: 'GH-2026-PAID',
      payment_provider: 'paystack',
      status: 'paid',
    }),
    recoverPayment: async () => {
      recoverCalls += 1;
      throw new Error('Already-paid orders should not be re-verified.');
    },
  });
  const paidResponse = await paidHandler({
    request: new Request('https://tickets.geohabari.com/api/payments/paystack/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference: 'GH-2026-PAID' }),
    }),
  });
  assert.equal(paidResponse.status, 200);
  assert.equal((await paidResponse.json()).status, 'paid');

  const cancelledHandler = createPaystackStatusHandler({
    loadOrder: async () => ({
      reference: 'GH-2026-CANCELLED',
      payment_provider: 'paystack',
      status: 'cancelled',
    }),
    recoverPayment: async () => {
      recoverCalls += 1;
      return { status: 'paid', alreadyProcessed: false };
    },
  });
  const cancelledResponse = await cancelledHandler({
    request: new Request('https://tickets.geohabari.com/api/payments/paystack/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference: 'GH-2026-CANCELLED' }),
    }),
  });
  assert.equal(cancelledResponse.status, 200);
  assert.equal((await cancelledResponse.json()).status, 'paid');
  assert.equal(recoverCalls, 1);
});

test('Canonical webhook requires a pre-created pending order before reconciliation', async () => {
  let reconcileCalls = 0;
  const handler = createPaystackWebhookHandler({
    verifySignature: () => true,
    loadOrder: async (reference) => reference === 'GH-2026-PRECREATED'
      ? {
          reference,
          payment_provider: 'paystack',
          status: 'pending',
        }
      : null,
    reconcile: async () => {
      reconcileCalls += 1;
      return { status: 'paid', alreadyProcessed: false };
    },
  });
  const makeRequest = (reference) => new Request('https://tickets.geohabari.com/api/paystack/webhook', {
    method: 'POST',
    headers: { 'x-paystack-signature': 'test-signature' },
    body: JSON.stringify({
      event: 'charge.success',
      data: { reference },
    }),
  });

  const accepted = await handler(makeRequest('GH-2026-PRECREATED'));
  assert.equal(accepted.status, 200);
  assert.equal((await accepted.json()).status, 'paid');

  const missing = await handler(makeRequest('GH-2026-MISSING'));
  assert.equal(missing.status, 404);
  assert.equal(reconcileCalls, 1);
});

test('Canonical webhook acknowledges charge.failed without cancelling the reservation', async () => {
  let reconcileCalls = 0;
  const handler = createPaystackWebhookHandler({
    verifySignature: () => true,
    loadOrder: async () => {
      throw new Error('Failure webhooks must not look up or change order state.');
    },
    reconcile: async () => {
      reconcileCalls += 1;
      throw new Error('Failure webhooks must not reconcile payment state.');
    },
  });
  const response = await handler(new Request('https://tickets.geohabari.com/api/paystack/webhook', {
    method: 'POST',
    headers: { 'x-paystack-signature': 'test-signature' },
    body: JSON.stringify({
      event: 'charge.failed',
      data: { reference: 'GH-2026-FAILED-ATTEMPT' },
    }),
  }));
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.ignored, true);
  assert.equal(reconcileCalls, 0);
});
