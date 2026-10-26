import crypto from 'node:crypto';
import { getSupabaseClient } from './supabase.js';

const TABLES = {
  events: 'events',
  ticket_types: 'ticket_types',
  orders: 'orders',
  payments: 'payments',
  tickets: 'tickets',
  exports: 'ticket_exports',
  audit_logs: 'audit_logs',
  student_verifications: 'student_verifications',
  admin_users: 'admin_users',
  admin_sessions: 'admin_sessions',
  login_attempts: 'login_attempts',
};

function database() {
  return getSupabaseClient();
}

function throwDatabaseError(error, operation) {
  if (error) {
    console.error(`[ticketing-store] Supabase ${operation} failed:`, error);
    throw new Error(`Ticketing database operation failed (${operation}): ${error.message}`);
  }
}

async function selectRows(table, query = (builder) => builder) {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await query(database().from(table).select('*'))
      .range(offset, offset + 999);
    throwDatabaseError(error, `read ${table}`);
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

async function selectIdentifiers(table) {
  const ids = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await database().from(table).select('id')
      .range(offset, offset + 999);
    throwDatabaseError(error, `read ${table} identifiers`);
    ids.push(...(data || []).map((row) => row.id));
    if (!data || data.length < 1000) break;
  }
  return ids;
}

function chunks(rows, size = 500) {
  const result = [];
  for (let offset = 0; offset < rows.length; offset += size) {
    result.push(rows.slice(offset, offset + size));
  }
  return result;
}

async function insertRow(table, row) {
  const { data, error } = await database().from(table).insert(row).select('*').single();
  throwDatabaseError(error, `insert ${table}`);
  return data;
}

async function upsertRow(table, row) {
  const { data, error } = await database().from(table).upsert(row, { onConflict: 'id' }).select('*').single();
  throwDatabaseError(error, `save ${table}`);
  return data;
}

const emptyStore = () => ({
  events: [],
  ticket_types: [],
  orders: [],
  payments: [],
  tickets: [],
  exports: [],
  audit_logs: [],
  student_verifications: [],
  admin_users: [],
  admin_sessions: [],
  login_attempts: [],
});

export async function readStore() {
  const store = emptyStore();
  await Promise.all(Object.entries(TABLES).map(async ([key, table]) => {
    store[key] = await selectRows(table);
  }));
  return store;
}

export async function writeStore(nextStore) {
  if (!nextStore || typeof nextStore !== 'object') {
    throw new Error('A ticketing store object is required.');
  }

  const deleteOrder = [
    'tickets',
    'payments',
    'orders',
    'student_verifications',
    'ticket_types',
    'events',
    'admin_sessions',
    'login_attempts',
    'admin_users',
    'audit_logs',
    'exports',
  ];
  for (const key of deleteOrder) {
    const rows = Array.isArray(nextStore[key]) ? nextStore[key] : [];
    const existingIds = await selectIdentifiers(TABLES[key]);
    const nextIds = new Set(rows.map((row) => row.id).filter(Boolean));
    const staleIds = existingIds.filter((id) => !nextIds.has(id));
    for (const staleBatch of chunks(staleIds, 500)) {
      const { error } = await database().from(TABLES[key]).delete().in('id', staleBatch);
      throwDatabaseError(error, `delete stale ${TABLES[key]}`);
    }
  }

  const saveOrder = [
    'events',
    'ticket_types',
    'orders',
    'payments',
    'tickets',
    'student_verifications',
    'admin_users',
    'admin_sessions',
    'login_attempts',
    'audit_logs',
    'exports',
  ];
  for (const key of saveOrder) {
    const rows = Array.isArray(nextStore[key]) ? nextStore[key] : [];
    for (const batch of chunks(rows, 500)) {
      const { error } = await database().from(TABLES[key]).upsert(batch, { onConflict: 'id' });
      throwDatabaseError(error, `save ${TABLES[key]}`);
    }
  }
  return nextStore;
}

export async function createTicketOrderWithPayment(order, payment) {
  const { data, error } = await database().rpc('create_ticket_order_with_payment', {
    p_order: order,
    p_payment: payment,
  });
  throwDatabaseError(error, 'create ticket order');
  return data;
}

export async function confirmPaystackOrder({ orderReference, providerReference, amount, status }) {
  const { data, error } = await database().rpc('confirm_paystack_ticket_order', {
    p_order_reference: orderReference,
    p_provider_reference: providerReference || '',
    p_amount: amount === undefined ? null : Number(amount),
    p_status: status,
  });
  throwDatabaseError(error, 'confirm Paystack order');
  return data;
}

export async function saveExport(record) {
  return insertRow(TABLES.exports, {
    id: record.id || crypto.randomUUID(),
    format: record.format || 'csv',
    created_at: record.created_at || new Date().toISOString(),
    rows: Number(record.rows || 0),
  });
}

export async function resetStore() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('resetStore is disabled in production.');
  }
  const store = await readStore();
  store.events = [];
  store.ticket_types = [];
  store.orders = [];
  store.payments = [];
  store.tickets = [];
  store.exports = [];
  store.audit_logs = [];
  store.student_verifications = [];
  store.admin_users = [];
  store.admin_sessions = [];
  store.login_attempts = [];
  await writeStore(store);
  return readStore();
}

export async function listEvents() {
  return selectRows('events', (query) => query.order('starts_at', { ascending: true }));
}

export async function getEventBySlug(slug) {
  const rows = await selectRows('events', (query) => query.eq('slug', slug).limit(1));
  return rows[0] || null;
}

export async function getEventById(id) {
  if (!id) return null;
  const rows = await selectRows('events', (query) => query.eq('id', id).limit(1));
  return rows[0] || null;
}

export async function getTicketTypesByEvent(eventId) {
  return selectRows('ticket_types', (query) => query.eq('event_id', eventId).order('created_at'));
}

export async function getTicketTypeById(ticketTypeId) {
  if (!ticketTypeId) return null;
  const rows = await selectRows('ticket_types', (query) => query.eq('id', ticketTypeId).limit(1));
  return rows[0] || null;
}

export async function saveEvent(eventData) {
  const title = String(eventData.title || '').trim();
  let slug = String(eventData.slug || title)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!slug) slug = `event-${Date.now()}`;

  const existing = eventData.id
    ? await getEventById(eventData.id)
    : await getEventBySlug(slug);
  const now = new Date().toISOString();
  const record = {
    id: eventData.id || existing?.id || `evt-${slug}-${Date.now().toString(36)}`,
    title: title || existing?.title || 'Untitled Event',
    slug,
    poster: eventData.poster ?? existing?.poster ?? '',
    description: eventData.description ?? existing?.description ?? '',
    venue: eventData.venue ?? existing?.venue ?? '',
    starts_at: eventData.starts_at ?? existing?.starts_at ?? now,
    ends_at: eventData.ends_at ?? existing?.ends_at ?? now,
    status: eventData.status ?? existing?.status ?? 'published',
    speakers: Array.isArray(eventData.speakers) ? eventData.speakers : existing?.speakers || [],
    partners: Array.isArray(eventData.partners) ? eventData.partners : existing?.partners || [],
    incentives: Array.isArray(eventData.incentives) ? eventData.incentives : existing?.incentives || [],
    archived_at: eventData.archived_at !== undefined ? eventData.archived_at : existing?.archived_at ?? null,
    created_at: existing?.created_at || now,
    updated_at: now,
  };
  const saved = await upsertRow('events', record);
  await appendAuditLog({
    action: existing ? 'event_updated' : 'event_created',
    entity: 'event',
    entity_id: saved.id,
    details: { title: saved.title, slug: saved.slug, status: saved.status },
  });
  return saved;
}

export async function saveTicketType(ticketData) {
  let existing = ticketData.id ? await getTicketTypeById(ticketData.id) : null;
  if (!existing && ticketData.event_id && ticketData.name) {
    const rows = await selectRows('ticket_types', (query) =>
      query.eq('event_id', ticketData.event_id).ilike('name', ticketData.name).limit(1));
    existing = rows[0] || null;
  }
  const now = new Date().toISOString();
  return upsertRow('ticket_types', {
    id: ticketData.id || existing?.id || `ticket-${ticketData.event_id}-${crypto.randomUUID().slice(0, 8)}`,
    event_id: ticketData.event_id,
    name: ticketData.name || existing?.name || 'Standard',
    category_type: ticketData.category_type || existing?.category_type ||
      (String(ticketData.name || '').toLowerCase().includes('professional') ? 'professional'
        : String(ticketData.name || '').toLowerCase().includes('student') ? 'student' : 'standard'),
    price: Number(ticketData.price ?? existing?.price ?? 1000),
    allocation: Number(ticketData.allocation ?? existing?.allocation ?? 50),
    sold_count: Number(existing?.sold_count || 0),
    description: ticketData.description ?? existing?.description ?? '',
    created_at: existing?.created_at || now,
    updated_at: now,
  });
}

export async function saveEventWithTickets({ eventData, ticketTypes = [] }) {
  const event = await saveEvent(eventData);
  const savedTickets = [];
  for (const ticket of ticketTypes) {
    if (!ticket?.name) continue;
    savedTickets.push(await saveTicketType({ ...ticket, event_id: event.id }));
  }
  return { event, ticket_types: savedTickets };
}

export async function listOrders() {
  return selectRows('orders', (query) => query.order('created_at', { ascending: false }));
}

export async function getOrderById(orderId) {
  if (!orderId) return null;
  const rows = await selectRows('orders', (query) => query.eq('id', orderId).limit(1));
  return rows[0] || null;
}

export async function getOrderByReference(reference) {
  if (!reference) return null;
  const rows = await selectRows('orders', (query) => query.eq('reference', reference).limit(1));
  return rows[0] || null;
}

export async function getPaymentByReference(providerReference) {
  if (!providerReference) return null;
  const rows = await selectRows('payments', (query) =>
    query.eq('provider_reference', providerReference).limit(1));
  return rows[0] || null;
}

export async function setPaymentProviderReference(orderId, providerReference) {
  if (!orderId || !providerReference) {
    throw new Error('Payment record or provider reference was not found.');
  }
  const existing = await getPaymentByReference(providerReference);
  if (existing && existing.order_id !== orderId) {
    throw new Error('The provider payment reference is already associated with another order.');
  }
  const { data, error } = await database()
    .from('payments')
    .update({ provider_reference: providerReference, updated_at: new Date().toISOString() })
    .eq('order_id', orderId)
    .select('*')
    .maybeSingle();
  throwDatabaseError(error, 'update payment reference');
  if (!data) throw new Error('Payment record or provider reference was not found.');
  return data;
}

export async function getTicketsByOrder(orderId) {
  return selectRows('tickets', (query) => query.eq('order_id', orderId));
}

export async function getLastExport() {
  const rows = await selectRows('ticket_exports', (query) => query.order('created_at', { ascending: false }).limit(1));
  return rows[0] || null;
}

export async function appendAuditLog(entry) {
  return insertRow('audit_logs', {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...entry,
  });
}

export async function getStudentVerificationById(id) {
  if (!id) return null;
  const rows = await selectRows('student_verifications', (query) => query.eq('id', id).limit(1));
  return rows[0] || null;
}

export async function saveStudentVerification(record) {
  const existing = record.id ? await getStudentVerificationById(record.id) : null;
  const now = new Date().toISOString();
  return upsertRow('student_verifications', {
    ...existing,
    ...record,
    id: record.id || crypto.randomUUID(),
    created_at: record.created_at || existing?.created_at || now,
    updated_at: now,
  });
}

export async function getStudentVerificationByHash(documentHash) {
  if (!documentHash) return null;
  const rows = await selectRows('student_verifications', (query) =>
    query.eq('document_hash', documentHash).limit(1));
  return rows[0] || null;
}

export async function listStudentVerifications() {
  return selectRows('student_verifications', (query) => query.order('created_at', { ascending: false }));
}

export async function getTicketMetrics() {
  const store = await readStore();
  return {
    totalEvents: store.events.length,
    totalOrders: store.orders.length,
    totalRevenue: store.orders.filter((order) => order.status === 'paid')
      .reduce((sum, order) => sum + Number(order.amount || 0), 0),
    openOrders: store.orders.filter((order) => order.status !== 'paid').length,
    totalTickets: store.tickets.length,
    totalVerifications: store.student_verifications.length,
    approvedVerifications: store.student_verifications.filter((verification) => verification.status === 'approved').length,
  };
}

export async function purgeExpiredStudentDocuments(nowIso = new Date().toISOString()) {
  const expired = await selectRows('student_verifications', (query) =>
    query.lte('retention_expires_at', nowIso).is('purged_at', null));
  for (const record of expired) {
    const { error } = await database()
      .from('student_verifications')
      .update({ purged_at: nowIso, document_storage_key: null, updated_at: nowIso })
      .eq('id', record.id);
    throwDatabaseError(error, 'purge student document metadata');
  }
  return { purgedCount: expired.length };
}

export async function getAdminUserByEmail(email) {
  if (!email) return null;
  const rows = await selectRows('admin_users', (query) =>
    query.ilike('email', String(email).trim()).limit(1));
  return rows[0] || null;
}

export async function getAdminUserById(id) {
  if (!id) return null;
  const rows = await selectRows('admin_users', (query) => query.eq('id', id).limit(1));
  return rows[0] || null;
}

export async function listAdminUsers() {
  const users = await selectRows('admin_users');
  return users.map(({ id, email, full_name, role, is_active, created_at, updated_at }) => ({
    id, email, full_name, role, is_active, created_at, updated_at,
  }));
}

export async function saveAdminUser(userData) {
  const normalizedEmail = String(userData.email || '').toLowerCase().trim();
  const existing = userData.id
    ? await getAdminUserById(userData.id)
    : await getAdminUserByEmail(normalizedEmail);
  const now = new Date().toISOString();
  return upsertRow('admin_users', {
    id: userData.id || existing?.id || crypto.randomUUID(),
    email: normalizedEmail,
    password_hash: userData.password_hash ?? existing?.password_hash ?? '',
    full_name: userData.full_name || existing?.full_name || 'Administrator',
    role: userData.role || existing?.role || 'admin',
    is_active: userData.is_active !== undefined ? Boolean(userData.is_active) : existing?.is_active ?? true,
    created_at: existing?.created_at || now,
    updated_at: now,
  });
}

export async function createAdminSession(sessionData) {
  return insertRow('admin_sessions', {
    id: crypto.randomUUID(),
    user_id: sessionData.user_id,
    session_token: sessionData.session_token,
    user_agent: sessionData.user_agent || '',
    ip_address: sessionData.ip_address || '',
    expires_at: sessionData.expires_at,
    created_at: new Date().toISOString(),
  });
}

export async function getAdminSession(token) {
  if (!token) return null;
  const sessions = await selectRows('admin_sessions', (query) =>
    query.eq('session_token', token).gt('expires_at', new Date().toISOString()).limit(1));
  const session = sessions[0];
  if (!session) return null;
  const user = await getAdminUserById(session.user_id);
  if (!user?.is_active) return null;
  return {
    session,
    user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
  };
}

export async function deleteAdminSession(token) {
  if (!token) return false;
  const { data, error } = await database().from('admin_sessions').delete()
    .eq('session_token', token).select('id');
  throwDatabaseError(error, 'delete admin session');
  return Boolean(data?.length);
}

export async function purgeExpiredAdminSessions() {
  const { data, error } = await database().from('admin_sessions').delete()
    .lte('expires_at', new Date().toISOString()).select('id');
  throwDatabaseError(error, 'purge admin sessions');
  return data?.length || 0;
}

export async function recordLoginAttempt(identifier, success) {
  const normalized = String(identifier || '').toLowerCase().trim();
  const now = new Date().toISOString();
  await insertRow('login_attempts', {
    id: crypto.randomUUID(),
    identifier: normalized,
    success: Boolean(success),
    created_at: now,
  });
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { error } = await database().from('login_attempts').delete().lt('created_at', cutoff);
  throwDatabaseError(error, 'purge old login attempts');
}

export async function getRecentFailedLoginAttempts(identifier, windowMinutes = 15) {
  const normalized = String(identifier || '').toLowerCase().trim();
  const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const { count, error } = await database().from('login_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('identifier', normalized)
    .eq('success', false)
    .gte('created_at', cutoff);
  throwDatabaseError(error, 'count failed login attempts');
  return count || 0;
}

export async function queryTicketHolders({
  search = '',
  category = 'all',
  status = 'all',
  eventId = 'all',
  dateFrom = '',
  dateTo = '',
  page = 1,
  limit = 20,
  sortField = 'created_at',
  sortOrder = 'desc',
} = {}) {
  const store = await readStore();
  let rows = [];
  const events = new Map(store.events.map((event) => [event.id, event]));
  const orders = new Map(store.orders.map((order) => [order.id, order]));
  const payments = new Map(store.payments.map((payment) => [payment.order_id, payment]));
  const verifications = new Map(store.student_verifications.map((verification) => [verification.id, verification]));
  const ticketTypes = new Map(store.ticket_types.map((ticketType) => [ticketType.id, ticketType]));

  for (const ticket of store.tickets) {
    const order = orders.get(ticket.order_id);
    const event = events.get(ticket.event_id);
    const payment = payments.get(ticket.order_id);
    const verification = order?.student_verification_id
      ? verifications.get(order.student_verification_id)
      : null;
    rows.push({
      ticket_id: ticket.id,
      ticket_code: ticket.ticket_code,
      ticket_status: ticket.status || 'active',
      category: ticket.category || 'Standard',
      category_type: ticket.category_type || 'standard',
      event_id: ticket.event_id,
      event_title: event?.title || 'GeoHabari Event',
      order_id: ticket.order_id,
      order_reference: order?.reference || 'N/A',
      buyer_name: ticket.attendee_name || order?.buyer_name || 'N/A',
      attendee_name: ticket.attendee_name || order?.buyer_name || 'N/A',
      email: ticket.attendee_email || order?.email || 'N/A',
      phone: ticket.attendee_phone || order?.phone || 'N/A',
      organization: ticket.organization || order?.organization || '',
      role: ticket.role || order?.role || '',
      order_quantity: order?.quantity || 1,
      order_amount: order?.amount || 0,
      payment_method: order?.payment_method || payment?.provider || 'N/A',
      payment_status: order?.status || 'paid',
      payment_reference: payment?.provider_reference || 'N/A',
      created_at: ticket.created_at || order?.created_at || new Date().toISOString(),
      is_student_verified: Boolean(verification && verification.status === 'approved'),
      verification_method: verification?.method || null,
      check_in_status: ticket.check_in_status || 'not_checked_in',
      check_in_at: ticket.check_in_at || null,
    });
  }

  for (const order of store.orders) {
    if (!['failed', 'cancelled'].includes(order.status)) continue;
    const ticketType = ticketTypes.get(order.ticket_type_id);
    const payment = payments.get(order.id);
    rows.push({
      ticket_id: `failed-${order.id}`,
      ticket_code: 'PAYMENT_FAILED',
      ticket_status: 'unissued',
      category: ticketType?.name || 'Standard',
      category_type: ticketType?.category_type || 'standard',
      event_id: order.event_id,
      event_title: events.get(order.event_id)?.title || 'GeoHabari Event',
      order_id: order.id,
      order_reference: order.reference,
      buyer_name: order.buyer_name,
      attendee_name: order.buyer_name,
      email: order.email,
      phone: order.phone,
      organization: order.organization || '',
      role: order.role || '',
      order_quantity: order.quantity,
      order_amount: order.amount,
      payment_method: order.payment_method || payment?.provider || 'N/A',
      payment_status: order.status,
      payment_reference: payment?.provider_reference || 'N/A',
      created_at: order.created_at,
      is_student_verified: Boolean(order.student_verification_id),
      verification_method: null,
      check_in_status: 'not_checked_in',
      check_in_at: null,
    });
  }

  if (eventId && eventId !== 'all') rows = rows.filter((row) => row.event_id === eventId);
  if (search.trim()) {
    const query = search.toLowerCase().trim();
    rows = rows.filter((row) => [
      row.ticket_code, row.order_reference, row.buyer_name, row.email, row.phone,
      row.organization, row.role,
    ].some((value) => String(value || '').toLowerCase().includes(query)));
  }
  if (category && category !== 'all') {
    const value = category.toLowerCase().trim();
    rows = rows.filter((row) => row.category.toLowerCase().includes(value));
  }
  if (status && status !== 'all') {
    const value = status.toLowerCase().trim();
    rows = rows.filter((row) => row.payment_status.toLowerCase() === value);
  }
  if (dateFrom && !Number.isNaN(new Date(dateFrom).getTime())) {
    const from = new Date(dateFrom).getTime();
    rows = rows.filter((row) => new Date(row.created_at).getTime() >= from);
  }
  if (dateTo) {
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);
    if (!Number.isNaN(end.getTime())) rows = rows.filter((row) => new Date(row.created_at).getTime() <= end.getTime());
  }

  rows.sort((a, b) => {
    let left = a[sortField] ?? '';
    let right = b[sortField] ?? '';
    if (sortField === 'created_at') {
      left = new Date(left).getTime();
      right = new Date(right).getTime();
    } else if (typeof left === 'string') {
      left = left.toLowerCase();
      right = String(right).toLowerCase();
    }
    return sortOrder === 'asc' ? (left > right ? 1 : left < right ? -1 : 0) : (left < right ? 1 : left > right ? -1 : 0);
  });

  const total = rows.length;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const totalPages = Math.ceil(total / pageLimit) || 1;
  const offset = (pageNum - 1) * pageLimit;
  return {
    rows: rows.slice(offset, offset + pageLimit),
    total,
    page: pageNum,
    limit: pageLimit,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
  };
}

export async function checkInTicket(ticketCode, adminEmail = 'admin') {
  const { data, error } = await database().from('tickets')
    .update({
      check_in_status: 'checked_in',
      check_in_at: new Date().toISOString(),
      checked_in_by: adminEmail,
    })
    .eq('ticket_code', ticketCode)
    .eq('check_in_status', 'not_checked_in')
    .select('*')
    .maybeSingle();
  throwDatabaseError(error, 'check in ticket');

  if (data) {
    await appendAuditLog({
      action: 'ticket_check_in',
      entity: 'ticket',
      entity_id: data.id,
      details: { ticket_code: data.ticket_code, checked_in_by: adminEmail },
    });
    return { success: true, ticket: data };
  }

  const rows = await selectRows('tickets', (query) => query.eq('ticket_code', ticketCode).limit(1));
  const ticket = rows[0];
  if (!ticket) return { success: false, error: 'Ticket code not found.' };
  if (ticket.check_in_status === 'checked_in') {
    return {
      success: false,
      alreadyCheckedIn: true,
      error: `Ticket already checked in at ${ticket.check_in_at}.`,
      ticket,
    };
  }
  throw new Error('Ticket check-in did not complete. Please retry.');
}
