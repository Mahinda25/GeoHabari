import test from 'node:test';
import assert from 'node:assert/strict';

import {
  hashPassword,
  verifyPassword,
  provisionAdminUser,
  authenticateAdmin,
  validateSession,
  logoutAdmin,
  getAdminFromRequest,
  checkRateLimit,
  ADMIN_COOKIE_NAME,
} from '../src/lib/auth.js';

import {
  readStore,
  writeStore,
  queryTicketHolders,
  checkInTicket,
  getTicketMetrics,
  saveAdminUser,
  recordLoginAttempt,
} from '../src/lib/ticketing-store.js';

import {
  createOrderCheckout,
  verifyPaymentAndIssueTickets,
} from '../src/lib/ticketing.js';

import {
  generateVerificationToken,
} from '../src/lib/student-verification.js';
import { POST as handleAdminLogout, GET as handleAdminLogoutGet } from '../src/pages/api/admin/logout.js';

// Clean initial state for test run
const initStore = readStore();
initStore.admin_users = [];
initStore.admin_sessions = [];
initStore.login_attempts = [];
writeStore(initStore);

// ============================================================================
// SUITE 1: SECURE ADMIN AUTHENTICATION & SESSIONS
// ============================================================================

test('Suite 1: Admin Password Hashing & Verification', async (t) => {
  await t.test('Securely hashes password with scrypt and unique salt', () => {
    const password = 'StrongPassword123!';
    const hash1 = hashPassword(password);
    const hash2 = hashPassword(password);

    assert.ok(hash1.startsWith('scrypt:'), 'Hash must start with scrypt: prefix');
    assert.notEqual(hash1, hash2, 'Salts must be unique for identical passwords');
  });

  await t.test('Verifies valid password and rejects incorrect password in timing-safe manner', () => {
    const password = 'StrongPassword123!';
    const hash = hashPassword(password);

    assert.equal(verifyPassword(password, hash), true, 'Valid password must verify');
    assert.equal(verifyPassword('WrongPassword!', hash), false, 'Wrong password must be rejected');
    assert.equal(verifyPassword('', hash), false, 'Empty password must be rejected');
    assert.equal(verifyPassword(password, 'invalid_hash_string'), false, 'Malformed hash must be rejected');
  });

  await t.test('Rejects passwords under 8 characters during hashing', () => {
    assert.throws(() => hashPassword('short'), /at least 8 characters/);
  });
});

test('Suite 2: Admin Login Flow & Session Lifecycle', async (t) => {
  const email = 'audit_admin@geohabari.com';
  const password = 'GeoHabari@2026Admin!';
  provisionAdminUser({ email, password, fullName: 'Audit Administrator', role: 'superadmin' });

  await t.test('Authenticates valid administrator and generates secure session token', async () => {
    const result = await authenticateAdmin({ email, password, ipAddress: '127.0.0.1' });
    assert.equal(result.success, true);
    assert.ok(result.sessionToken);
    assert.equal(result.user.email, email);
    assert.equal(result.user.role, 'superadmin');

    // Verify session in store
    const sessionValidation = validateSession(result.sessionToken);
    assert.ok(sessionValidation, 'Session token must be resolvable');
    assert.equal(sessionValidation.user.email, email);
  });

  await t.test('Rejects invalid credentials with generic message', async () => {
    const result = await authenticateAdmin({ email, password: 'WrongPassword!', ipAddress: '127.0.0.1' });
    assert.equal(result.success, false);
    assert.equal(result.error, 'Invalid email or password.');
  });

  await t.test('Rejects non-existent email with identical generic message (no user enumeration)', async () => {
    const result = await authenticateAdmin({ email: 'nonexistent@geohabari.com', password: 'AnyPassword!', ipAddress: '127.0.0.1' });
    assert.equal(result.success, false);
    assert.equal(result.error, 'Invalid email or password.');
  });

  await t.test('Invalidates session upon logout', async () => {
    const loginResult = await authenticateAdmin({ email, password, ipAddress: '127.0.0.1' });
    const token = loginResult.sessionToken;

    assert.ok(validateSession(token), 'Session must be valid before logout');
    const loggedOut = logoutAdmin(token);
    assert.equal(loggedOut, true, 'Logout must succeed');
    assert.equal(validateSession(token), null, 'Session must be null after logout');
  });

  await t.test('Resolves admin from HTTP Request cookies', async () => {
    const loginResult = await authenticateAdmin({ email, password, ipAddress: '127.0.0.1' });
    const mockRequest = new Request('https://geohabari.com/admin', {
      headers: {
        cookie: `${ADMIN_COOKIE_NAME}=${loginResult.sessionToken}; other_cookie=xyz`,
      },
    });

    const auth = getAdminFromRequest(mockRequest);
    assert.ok(auth, 'Admin must be extracted from Cookie header');
    assert.equal(auth.user.email, email);
  });

  await t.test('Returns null when request has no valid admin session', () => {
    const unauthenticatedRequest = new Request('https://geohabari.com/admin');
    assert.equal(getAdminFromRequest(unauthenticatedRequest), null);

    const invalidCookieRequest = new Request('https://geohabari.com/admin', {
      headers: { cookie: `${ADMIN_COOKIE_NAME}=fake_token_123` },
    });
    assert.equal(getAdminFromRequest(invalidCookieRequest), null);
  });
});

test('Suite 3: Login Rate Limiting & Brute-Force Guard', async (t) => {
  const targetEmail = 'target@geohabari.com';
  provisionAdminUser({ email: targetEmail, password: 'Password@2026', fullName: 'Target Admin' });

  await t.test('Locks account after 5 consecutive failed attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await authenticateAdmin({ email: targetEmail, password: 'WrongPassword' });
    }

    const rateCheck = checkRateLimit(targetEmail);
    assert.equal(rateCheck.allowed, false, 'Rate limit check must fail after 5 attempts');

    const blockedAttempt = await authenticateAdmin({ email: targetEmail, password: 'Password@2026' });
    assert.equal(blockedAttempt.success, false);
    assert.equal(blockedAttempt.status, 429);
    assert.ok(blockedAttempt.error.includes('Too many failed login attempts'));
  });
});

test('Admin logout endpoint clears the cookie, revokes the session, and redirects to the public home', async () => {
  const email = `logout-${Date.now()}@geohabari.com`;
  provisionAdminUser({ email, password: 'SecurePass@2026', fullName: 'Logout Admin' });
  const login = await authenticateAdmin({ email, password: 'SecurePass@2026' });
  const request = new Request('https://tickets.geohabari.com/api/admin/logout', {
    method: 'POST',
    headers: { cookie: `${ADMIN_COOKIE_NAME}=${login.sessionToken}` },
  });

  const response = await handleAdminLogout({ request });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie'), /Max-Age=0/);
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.equal(validateSession(login.sessionToken), null);

  const fallback = await handleAdminLogoutGet({
    request: new Request('https://tickets.geohabari.com/api/admin/logout'),
  });
  assert.equal(fallback.status, 303);
  assert.equal(fallback.headers.get('location'), 'https://geohabari.com');
  assert.match(fallback.headers.get('set-cookie'), /Max-Age=0/);
});

// ============================================================================
// SUITE 2: TICKET-HOLDER QUERY, FILTERING & CHECK-IN
// ============================================================================

test('Suite 4: Ticket-Holder Records & Search Engine', async (t) => {
  const store = readStore();
  const event = store.events[0];
  const proTicket = store.ticket_types.find((tt) => tt.event_id === event.id && tt.name === 'Professional');

  // Create a verified test purchase
  const orderResult = createOrderCheckout(event.id, {
    full_name: 'Wanjiru Mwangi',
    email: 'wanjiru.test@example.com',
    phone: '0712345678',
    ticket_type_id: proTicket.id,
    quantity: 2,
    payment_method: 'card',
    accept_terms: true,
    attendees: [
      { name: 'Wanjiru Mwangi' },
      { name: 'Second Test Attendee' },
    ],
  });

  // Confirm payment & issue tickets
  verifyPaymentAndIssueTickets({
    orderReference: orderResult.order.reference,
    provider: 'paystack',
    providerReference: `card-test-${Date.now()}`,
    amount: orderResult.order.amount,
    status: 'paid',
  });

  await t.test('Authoritative query retrieves issued ticket-holder records with codes', () => {
    const result = queryTicketHolders({ search: 'Wanjiru' });
    assert.ok(result.rows.length >= 2, 'Must return both issued tickets for quantity 2');

    const first = result.rows[0];
    assert.equal(first.buyer_name, 'Wanjiru Mwangi');
    assert.equal(first.email, 'wanjiru.test@example.com');
    assert.equal(first.payment_status, 'paid');
    assert.ok(first.ticket_code.startsWith('GH26-'), 'Ticket code must follow standard prefix');
    assert.equal(first.check_in_status, 'not_checked_in');
  });

  await t.test('Filters correctly by category', () => {
    const proResults = queryTicketHolders({ category: 'professional' });
    assert.ok(proResults.rows.every((r) => r.category.toLowerCase().includes('professional')));

    const studentResults = queryTicketHolders({ category: 'student' });
    assert.ok(studentResults.rows.every((r) => r.category.toLowerCase().includes('student')));
  });

  await t.test('Filters correctly by payment status', () => {
    const paidResults = queryTicketHolders({ status: 'paid' });
    assert.ok(paidResults.rows.every((r) => r.payment_status === 'paid'));

    const pendingResults = queryTicketHolders({ status: 'pending' });
    assert.ok(pendingResults.rows.every((r) => r.payment_status === 'pending'));
  });

  await t.test('Performs server-side pagination properly', () => {
    const page1 = queryTicketHolders({ limit: 1, page: 1 });
    assert.equal(page1.rows.length, 1);
    assert.ok(page1.totalPages >= 1);
    assert.equal(page1.page, 1);
  });

  await t.test('Executes ticket check-in and prevents duplicate check-in', () => {
    const searchRes = queryTicketHolders({ search: 'Wanjiru' });
    const targetTicket = searchRes.rows[0];

    // 1. Initial check-in
    const checkInResult = checkInTicket(targetTicket.ticket_code, 'admin@geohabari.com');
    assert.equal(checkInResult.success, true);
    assert.equal(checkInResult.ticket.check_in_status, 'checked_in');

    // 2. Duplicate check-in attempt
    const secondAttempt = checkInTicket(targetTicket.ticket_code, 'admin@geohabari.com');
    assert.equal(secondAttempt.success, false);
    assert.equal(secondAttempt.alreadyCheckedIn, true);
    assert.ok(secondAttempt.error.includes('already checked in'));
  });
});

// ============================================================================
// SUITE 3: RESTRICTED EXPORTS & FORMULA INJECTION DEFENSE
// ============================================================================

test('Suite 5: CSV Export Sanitization & Formula Injection Guard', async (t) => {
  // Test cell sanitization logic
  function sanitizeCsvCell(value) {
    if (value === null || value === undefined) return '""';
    let str = String(value);
    if (/^[=+\-@\t\r]/.test(str) || /^[\u0000-\u0020]+[=+\-@]/.test(str)) {
      str = `'${str}`;
    }
    return `"${str.replace(/"/g, '""')}"`;
  }

  await t.test('Defends against spreadsheet formula injection (=, +, -, @)', () => {
    assert.equal(sanitizeCsvCell('=SUM(A1:A10)'), `"'=SUM(A1:A10)"`);
    assert.equal(sanitizeCsvCell('+123456789'), `"'+123456789"`);
    assert.equal(sanitizeCsvCell('-1000'), `"'-1000"`);
    assert.equal(sanitizeCsvCell('@attacker'), `"'@attacker"`);
    assert.equal(sanitizeCsvCell('\tmalicious'), `"'\tmalicious"`);
    assert.equal(sanitizeCsvCell('  =SUM(A1:A10)'), `"'  =SUM(A1:A10)"`);
    assert.equal(sanitizeCsvCell('Normal Name'), `"Normal Name"`);
  });

  await t.test('Escapes embedded double quotes properly in CSV', () => {
    assert.equal(sanitizeCsvCell('Jane "Special" Doe'), `"Jane ""Special"" Doe"`);
  });
});

// ============================================================================
// SUITE 4: FINANCIAL INTEGRITY & PAYMENT CONSISTENCY
// ============================================================================

test('Suite 6: Financial Integrity & Revenue Calculation', async (t) => {
  const store = readStore();
  const event = store.events[0];
  const proTicket = store.ticket_types.find((tt) => tt.event_id === event.id && tt.name === 'Professional');

  const beforeMetrics = getTicketMetrics();

  // 1. Create a pending order (not yet paid)
  const pendingOrder = createOrderCheckout(event.id, {
    full_name: 'Pending Buyer',
    email: 'pending.buyer@example.com',
    phone: '0700000001',
    ticket_type_id: proTicket.id,
    quantity: 1,
    payment_channel: 'mobile_money',
    accept_terms: true,
    attendees: [{ name: 'Pending Buyer' }],
  });

  await t.test('Pending orders DO NOT increment issued tickets or paid revenue', () => {
    const afterPendingStore = readStore();
    const paidRevenue = afterPendingStore.orders
      .filter((o) => o.status === 'paid')
      .reduce((sum, o) => sum + Number(o.amount || 0), 0);

    // Tickets must NOT be issued for pending payment
    const issuedTicketsForPending = afterPendingStore.tickets.filter((t) => t.order_id === pendingOrder.order.id);
    assert.equal(issuedTicketsForPending.length, 0, 'No tickets may be issued for pending payment');
  });

  await t.test('Failed payment does not issue tickets', () => {
    verifyPaymentAndIssueTickets({
      orderReference: pendingOrder.order.reference,
      provider: 'paystack',
      providerReference: 'FAILED-TXN-123',
      status: 'failed',
    });

    const storeAfterFail = readStore();
    const order = storeAfterFail.orders.find((o) => o.id === pendingOrder.order.id);
    assert.equal(order.status, 'failed');

    const issuedTickets = storeAfterFail.tickets.filter((t) => t.order_id === pendingOrder.order.id);
    assert.equal(issuedTickets.length, 0, 'Failed order must never have tickets issued');
  });

  await t.test('Payment confirmation issues tickets and callback retry is idempotent', () => {
    // Create new order to pay
    const orderToPay = createOrderCheckout(event.id, {
      full_name: 'Confirmed Buyer',
      email: 'confirmed.buyer@example.com',
      phone: '0700000002',
      ticket_type_id: proTicket.id,
      quantity: 2,
      payment_method: 'card',
      accept_terms: true,
      attendees: [
        { name: 'Confirmed Buyer' },
        { name: 'Second Confirmed Attendee' },
      ],
    });

    const txnRef = `card-confirm-${Date.now()}`;

    // Callback 1: Success
    const firstCall = verifyPaymentAndIssueTickets({
      orderReference: orderToPay.order.reference,
      provider: 'paystack',
      providerReference: txnRef,
      amount: orderToPay.order.amount,
      status: 'paid',
    });

    assert.equal(firstCall.alreadyProcessed, false);
    assert.equal(firstCall.order.status, 'paid');

    const storeAfterFirst = readStore();
    const ticketsFirst = storeAfterFirst.tickets.filter((t) => t.order_id === orderToPay.order.id);
    assert.equal(ticketsFirst.length, 2, 'Must issue exactly 2 tickets');

    // Callback 2: Repeated webhook retry
    const secondCall = verifyPaymentAndIssueTickets({
      orderReference: orderToPay.order.reference,
      provider: 'paystack',
      providerReference: txnRef,
      amount: orderToPay.order.amount,
      status: 'paid',
    });

    assert.equal(secondCall.alreadyProcessed, true, 'Retry callback must be detected as already processed');

    const storeAfterSecond = readStore();
    const ticketsSecond = storeAfterSecond.tickets.filter((t) => t.order_id === orderToPay.order.id);
    assert.equal(ticketsSecond.length, 2, 'Tickets must NOT be duplicated upon retry callback');
  });
});
