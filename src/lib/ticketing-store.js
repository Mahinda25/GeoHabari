import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');
const storePath = path.join(dataDir, 'ticketing-store.json');

const defaultStore = {
  events: [
    {
      id: 'evt-summit-2026',
      title: 'GeoHabari Summit 2026',
      slug: 'geohabari-summit-2026',
      poster: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
      description: 'A flagship event bringing together founders, practitioners, marketers and geospatial experts across Africa.',
      venue: 'Kenyatta International Convention Centre, Nairobi',
      starts_at: '2026-12-12T09:00:00+03:00',
      ends_at: '2026-12-12T17:00:00+03:00',
      status: 'published',
      archived_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'evt-ai-2026',
      title: 'AI & Spatial Innovation Forum',
      slug: 'ai-spatial-innovation-forum',
      poster: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
      description: 'A practical conversation on how AI and geospatial intelligence are reshaping public systems and business models.',
      venue: 'iHub, Nairobi',
      starts_at: '2026-11-04T15:00:00+03:00',
      ends_at: '2026-11-04T19:00:00+03:00',
      status: 'published',
      archived_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ],
  ticket_types: [
    {
      id: 'ticket-student-evt-summit-2026',
      event_id: 'evt-summit-2026',
      name: 'Student',
      price: 600,
      allocation: 30,
      sold_count: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: 'ticket-professional-evt-summit-2026',
      event_id: 'evt-summit-2026',
      name: 'Professional',
      price: 1000,
      allocation: 70,
      sold_count: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: 'ticket-student-evt-ai-2026',
      event_id: 'evt-ai-2026',
      name: 'Student',
      price: 600,
      allocation: 30,
      sold_count: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: 'ticket-professional-evt-ai-2026',
      event_id: 'evt-ai-2026',
      name: 'Professional',
      price: 1000,
      allocation: 70,
      sold_count: 0,
      created_at: new Date().toISOString(),
    }
  ],
  orders: [],
  payments: [],
  tickets: [],
  exports: [],
  audit_logs: [],
  student_verifications: [],
  whatsapp_notifications: [],
  admin_users: [],
  admin_sessions: [],
  login_attempts: [],
};

function ensureStoreFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(storePath)) {
    fs.writeFileSync(storePath, JSON.stringify(defaultStore, null, 2), 'utf8');
  }
}

export function readStore() {
  ensureStoreFile();
  const raw = fs.readFileSync(storePath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    data = structuredClone(defaultStore);
  }

  // Ensure collections always exist
  data.events = data.events || [];
  data.ticket_types = data.ticket_types || [];
  data.orders = data.orders || [];
  data.payments = data.payments || [];
  data.tickets = data.tickets || [];
  data.exports = data.exports || [];
  data.audit_logs = data.audit_logs || [];
  data.student_verifications = data.student_verifications || [];
  data.whatsapp_notifications = data.whatsapp_notifications || [];
  data.admin_users = data.admin_users || [];
  data.admin_sessions = data.admin_sessions || [];
  data.login_attempts = data.login_attempts || [];

  return data;
}

export function writeStore(nextStore) {
  ensureStoreFile();
  fs.writeFileSync(storePath, JSON.stringify(nextStore, null, 2), 'utf8');
  return nextStore;
}

export function resetStore() {
  writeStore(structuredClone(defaultStore));
  return readStore();
}

export function listEvents() {
  const store = readStore();
  return [...store.events].sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
}

export function getEventBySlug(slug) {
  const store = readStore();
  return store.events.find((event) => event.slug === slug) || null;
}

export function getEventById(id) {
  const store = readStore();
  return store.events.find((event) => event.id === id) || null;
}

export function getTicketTypesByEvent(eventId) {
  const store = readStore();
  return store.ticket_types.filter((ticketType) => ticketType.event_id === eventId);
}

export function getTicketTypeById(ticketTypeId) {
  const store = readStore();
  return store.ticket_types.find((ticketType) => ticketType.id === ticketTypeId) || null;
}

export function saveEvent(eventData) {
  const store = readStore();
  const now = new Date().toISOString();

  let slug = (eventData.slug || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (!slug && eventData.title) {
    slug = eventData.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  if (!slug) {
    slug = `event-${Date.now()}`;
  }

  const existingIndex = store.events.findIndex(
    (e) => (eventData.id && e.id === eventData.id) || (slug && e.slug === slug)
  );

  const eventId = eventData.id || (existingIndex >= 0 ? store.events[existingIndex].id : `evt-${slug}-${Date.now().toString(36)}`);

  const record = {
    id: eventId,
    title: eventData.title || (existingIndex >= 0 ? store.events[existingIndex].title : 'Untitled Event'),
    slug: slug,
    poster: eventData.poster || (existingIndex >= 0 ? store.events[existingIndex].poster : ''),
    description: eventData.description || (existingIndex >= 0 ? store.events[existingIndex].description : ''),
    venue: eventData.venue || (existingIndex >= 0 ? store.events[existingIndex].venue : ''),
    starts_at: eventData.starts_at || (existingIndex >= 0 ? store.events[existingIndex].starts_at : now),
    ends_at: eventData.ends_at || (existingIndex >= 0 ? store.events[existingIndex].ends_at : now),
    status: eventData.status || (existingIndex >= 0 ? store.events[existingIndex].status : 'published'),
    speakers: Array.isArray(eventData.speakers) ? eventData.speakers : (existingIndex >= 0 ? store.events[existingIndex].speakers || [] : []),
    partners: Array.isArray(eventData.partners) ? eventData.partners : (existingIndex >= 0 ? store.events[existingIndex].partners || [] : []),
    archived_at: eventData.archived_at !== undefined ? eventData.archived_at : (existingIndex >= 0 ? store.events[existingIndex].archived_at : null),
    created_at: existingIndex >= 0 ? store.events[existingIndex].created_at : now,
    updated_at: now,
  };

  if (existingIndex >= 0) {
    store.events[existingIndex] = record;
  } else {
    store.events.push(record);
  }

  writeStore(store);

  appendAuditLog({
    action: existingIndex >= 0 ? 'event_updated' : 'event_created',
    entity: 'event',
    entity_id: record.id,
    details: { title: record.title, slug: record.slug, status: record.status },
  });

  return record;
}

export function saveTicketType(ticketData) {
  const store = readStore();
  const now = new Date().toISOString();

  const existingIndex = store.ticket_types.findIndex(
    (t) => (ticketData.id && t.id === ticketData.id) ||
           (ticketData.event_id && t.event_id === ticketData.event_id && t.name.toLowerCase() === (ticketData.name || '').toLowerCase())
  );

  const ticketId = ticketData.id || (existingIndex >= 0 ? store.ticket_types[existingIndex].id : `ticket-${ticketData.event_id}-${crypto.randomUUID().slice(0, 8)}`);

  const record = {
    id: ticketId,
    event_id: ticketData.event_id,
    name: ticketData.name || (existingIndex >= 0 ? store.ticket_types[existingIndex].name : 'Standard'),
    price: Number(ticketData.price ?? (existingIndex >= 0 ? store.ticket_types[existingIndex].price : 1000)),
    allocation: Number(ticketData.allocation ?? (existingIndex >= 0 ? store.ticket_types[existingIndex].allocation : 50)),
    sold_count: existingIndex >= 0 ? Number(store.ticket_types[existingIndex].sold_count || 0) : 0,
    description: ticketData.description || (existingIndex >= 0 ? store.ticket_types[existingIndex].description : ''),
    created_at: existingIndex >= 0 ? store.ticket_types[existingIndex].created_at : now,
    updated_at: now,
  };

  if (existingIndex >= 0) {
    store.ticket_types[existingIndex] = record;
  } else {
    store.ticket_types.push(record);
  }

  writeStore(store);
  return record;
}

export function saveEventWithTickets({ eventData, ticketTypes = [] }) {
  const event = saveEvent(eventData);

  const savedTickets = [];
  if (Array.isArray(ticketTypes) && ticketTypes.length > 0) {
    for (const t of ticketTypes) {
      if (!t || !t.name) continue;
      const saved = saveTicketType({
        ...t,
        event_id: event.id,
      });
      savedTickets.push(saved);
    }
  }

  return {
    event,
    ticket_types: savedTickets,
  };
}

export function listOrders() {
  const store = readStore();
  return [...store.orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function getOrderById(orderId) {
  const store = readStore();
  return store.orders.find((order) => order.id === orderId) || null;
}

export function getOrderByReference(reference) {
  const store = readStore();
  return store.orders.find((order) => order.reference === reference) || null;
}

export function getPaymentByReference(providerReference) {
  const store = readStore();
  return store.payments.find((payment) => payment.provider_reference === providerReference) || null;
}

export function getTicketsByOrder(orderId) {
  const store = readStore();
  return store.tickets.filter((ticket) => ticket.order_id === orderId);
}

export function getLastExport() {
  const store = readStore();
  return store.exports.at(-1) || null;
}

export function appendAuditLog(entry) {
  const store = readStore();
  store.audit_logs.unshift({
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...entry,
  });
  writeStore(store);
  return store.audit_logs[0];
}

// ==========================================
// STUDENT VERIFICATIONS
// ==========================================

export function getStudentVerificationById(id) {
  if (!id) return null;
  const store = readStore();
  return store.student_verifications.find((v) => v.id === id) || null;
}

export function saveStudentVerification(record) {
  const store = readStore();
  const index = store.student_verifications.findIndex((v) => v.id === record.id);
  const now = new Date().toISOString();

  if (index >= 0) {
    store.student_verifications[index] = {
      ...store.student_verifications[index],
      ...record,
      updated_at: now,
    };
  } else {
    store.student_verifications.push({
      ...record,
      created_at: record.created_at || now,
      updated_at: now,
    });
  }

  writeStore(store);
  return record;
}

export function getStudentVerificationByHash(documentHash) {
  if (!documentHash) return null;
  const store = readStore();
  return store.student_verifications.find((v) => v.document_hash === documentHash) || null;
}

export function listStudentVerifications() {
  const store = readStore();
  return [...store.student_verifications].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function getTicketMetrics() {
  const store = readStore();
  const totalRevenue = store.orders.filter(o => o.status === 'paid').reduce((sum, order) => sum + Number(order.amount || 0), 0);
  const openOrders = store.orders.filter((order) => order.status !== 'paid').length;
  const totalVerifications = store.student_verifications.length;
  const approvedVerifications = store.student_verifications.filter((v) => v.status === 'approved').length;

  return {
    totalEvents: store.events.length,
    totalOrders: store.orders.length,
    totalRevenue,
    openOrders,
    totalTickets: store.tickets.length,
    totalVerifications,
    approvedVerifications,
  };
}

export function purgeExpiredStudentDocuments(nowIso = new Date().toISOString()) {
  const store = readStore();
  let purgedCount = 0;

  for (const record of store.student_verifications) {
    if (record.retention_expires_at && record.retention_expires_at <= nowIso && !record.purged_at) {
      record.purged_at = nowIso;
      record.document_storage_key = null; // Removed pointer
      purgedCount += 1;
    }
  }

  if (purgedCount > 0) {
    writeStore(store);
  }

  return { purgedCount };
}

// ==========================================
// WHATSAPP NOTIFICATIONS
// ==========================================

export function getWhatsAppNotificationByOrderId(orderId) {
  if (!orderId) return null;
  const store = readStore();
  return store.whatsapp_notifications.find((w) => w.order_id === orderId) || null;
}

export function saveWhatsAppNotification(record) {
  const store = readStore();
  const index = store.whatsapp_notifications.findIndex((w) => w.id === record.id || (w.order_id && w.order_id === record.order_id));
  const now = new Date().toISOString();

  if (index >= 0) {
    store.whatsapp_notifications[index] = {
      ...store.whatsapp_notifications[index],
      ...record,
      updated_at: now,
    };
  } else {
    store.whatsapp_notifications.push({
      id: record.id || crypto.randomUUID(),
      ...record,
      created_at: record.created_at || now,
      updated_at: now,
    });
  }

  writeStore(store);
  return record;
}

export function getPendingWhatsAppNotifications() {
  const store = readStore();
  return store.whatsapp_notifications.filter((w) => w.status === 'pending' || (w.status === 'processing' && w.attempts < (w.max_attempts || 3)));
}

// ==========================================
// ADMIN USERS & AUTHENTICATION
// ==========================================

export function getAdminUserByEmail(email) {
  if (!email) return null;
  const store = readStore();
  return store.admin_users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
}

export function getAdminUserById(id) {
  if (!id) return null;
  const store = readStore();
  return store.admin_users.find((u) => u.id === id) || null;
}

export function listAdminUsers() {
  const store = readStore();
  return store.admin_users.map((u) => ({
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    role: u.role,
    is_active: u.is_active,
    created_at: u.created_at,
    updated_at: u.updated_at,
  }));
}

export function saveAdminUser(userData) {
  const store = readStore();
  const now = new Date().toISOString();
  const normalizedEmail = (userData.email || '').toLowerCase().trim();
  const index = store.admin_users.findIndex(
    (u) => u.id === userData.id || u.email.toLowerCase() === normalizedEmail
  );

  const record = {
    id: userData.id || (index >= 0 ? store.admin_users[index].id : crypto.randomUUID()),
    email: normalizedEmail,
    password_hash: userData.password_hash !== undefined ? userData.password_hash : (index >= 0 ? store.admin_users[index].password_hash : ''),
    full_name: userData.full_name || (index >= 0 ? store.admin_users[index].full_name : 'Administrator'),
    role: userData.role || (index >= 0 ? store.admin_users[index].role : 'admin'),
    is_active: userData.is_active !== undefined ? Boolean(userData.is_active) : true,
    created_at: index >= 0 ? store.admin_users[index].created_at : now,
    updated_at: now,
  };

  if (index >= 0) {
    store.admin_users[index] = record;
  } else {
    store.admin_users.push(record);
  }

  writeStore(store);
  return record;
}

export function createAdminSession(sessionData) {
  const store = readStore();
  const now = new Date().toISOString();
  const session = {
    id: crypto.randomUUID(),
    user_id: sessionData.user_id,
    session_token: sessionData.session_token,
    user_agent: sessionData.user_agent || '',
    ip_address: sessionData.ip_address || '',
    expires_at: sessionData.expires_at,
    created_at: now,
  };
  store.admin_sessions.push(session);
  writeStore(store);
  return session;
}

export function getAdminSession(token) {
  if (!token) return null;
  const store = readStore();
  const now = new Date().toISOString();
  const session = store.admin_sessions.find((s) => s.session_token === token && s.expires_at > now);
  if (!session) return null;
  const user = store.admin_users.find((u) => u.id === session.user_id && u.is_active);
  if (!user) return null;
  return {
    session,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    },
  };
}

export function deleteAdminSession(token) {
  if (!token) return false;
  const store = readStore();
  const initialLen = store.admin_sessions.length;
  store.admin_sessions = store.admin_sessions.filter((s) => s.session_token !== token);
  if (store.admin_sessions.length !== initialLen) {
    writeStore(store);
    return true;
  }
  return false;
}

export function purgeExpiredAdminSessions() {
  const store = readStore();
  const now = new Date().toISOString();
  const initialLen = store.admin_sessions.length;
  store.admin_sessions = store.admin_sessions.filter((s) => s.expires_at > now);
  if (store.admin_sessions.length !== initialLen) {
    writeStore(store);
  }
}

// Rate-limiting store functions
export function recordLoginAttempt(identifier, success) {
  const store = readStore();
  const now = new Date().toISOString();
  store.login_attempts.push({
    id: crypto.randomUUID(),
    identifier: identifier.toLowerCase().trim(),
    success: Boolean(success),
    created_at: now,
  });
  // Keep only attempts from the last 2 hours
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  store.login_attempts = store.login_attempts.filter((a) => a.created_at >= twoHoursAgo);
  writeStore(store);
}

export function getRecentFailedLoginAttempts(identifier, windowMinutes = 15) {
  const store = readStore();
  const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const normalized = identifier.toLowerCase().trim();
  return store.login_attempts.filter(
    (a) => a.identifier === normalized && !a.success && a.created_at >= cutoff
  ).length;
}

// ==========================================
// TICKET HOLDERS QUERY & MANAGEMENT
// ==========================================

export function queryTicketHolders({
  search = '',
  category = 'all',
  status = 'all',
  dateFrom = '',
  dateTo = '',
  page = 1,
  limit = 20,
  sortField = 'created_at',
  sortOrder = 'desc',
} = {}) {
  const store = readStore();

  let rows = [];

  // 1. Process confirmed tickets
  for (const ticket of store.tickets) {
    const order = store.orders.find((o) => o.id === ticket.order_id);
    const event = store.events.find((e) => e.id === ticket.event_id);
    const payment = store.payments.find((p) => p.order_id === ticket.order_id);
    const verification = order?.student_verification_id
      ? store.student_verifications.find((v) => v.id === order.student_verification_id)
      : null;

    rows.push({
      ticket_id: ticket.id,
      ticket_code: ticket.ticket_code,
      ticket_status: ticket.status || 'active',
      category: ticket.category || 'Standard',
      event_id: ticket.event_id,
      event_title: event?.title || 'GeoHabari Event',
      order_id: ticket.order_id,
      order_reference: order?.reference || 'N/A',
      buyer_name: order?.buyer_name || 'N/A',
      email: order?.email || 'N/A',
      phone: order?.phone || 'N/A',
      order_quantity: order?.quantity || 1,
      order_amount: order?.amount || 0,
      payment_method: order?.payment_method || payment?.provider || 'N/A',
      payment_status: order?.status || 'pending',
      payment_reference: payment?.provider_reference || 'N/A',
      created_at: ticket.created_at || order?.created_at || new Date().toISOString(),
      whatsapp_opt_in: Boolean(order?.whatsapp_opt_in),
      is_student_verified: Boolean(verification && verification.status === 'approved'),
      verification_method: verification?.method || null,
      check_in_status: ticket.check_in_status || 'not_checked_in',
      check_in_at: ticket.check_in_at || null,
    });
  }

  // 2. Also include unissued / pending orders for visibility
  for (const order of store.orders) {
    if (order.status !== 'paid') {
      const event = store.events.find((e) => e.id === order.event_id);
      const ticketType = store.ticket_types.find((t) => t.id === order.ticket_type_id);
      const payment = store.payments.find((p) => p.order_id === order.id);

      rows.push({
        ticket_id: `pending-${order.id}`,
        ticket_code: order.status === 'pending' ? 'PENDING_PAYMENT' : 'PAYMENT_FAILED',
        ticket_status: 'unissued',
        category: ticketType?.name || 'Standard',
        event_id: order.event_id,
        event_title: event?.title || 'GeoHabari Event',
        order_id: order.id,
        order_reference: order.reference,
        buyer_name: order.buyer_name,
        email: order.email,
        phone: order.phone,
        order_quantity: order.quantity,
        order_amount: order.amount,
        payment_method: order.payment_method || payment?.provider || 'N/A',
        payment_status: order.status,
        payment_reference: payment?.provider_reference || 'N/A',
        created_at: order.created_at,
        whatsapp_opt_in: Boolean(order.whatsapp_opt_in),
        is_student_verified: Boolean(order.student_verification_id),
        verification_method: null,
        check_in_status: 'not_checked_in',
        check_in_at: null,
      });
    }
  }

  // Search filtering
  if (search && search.trim()) {
    const s = search.toLowerCase().trim();
    rows = rows.filter(
      (r) =>
        r.ticket_code.toLowerCase().includes(s) ||
        r.order_reference.toLowerCase().includes(s) ||
        r.buyer_name.toLowerCase().includes(s) ||
        r.email.toLowerCase().includes(s) ||
        r.phone.toLowerCase().includes(s)
    );
  }

  // Category filtering
  if (category && category !== 'all') {
    const cat = category.toLowerCase().trim();
    rows = rows.filter((r) => r.category.toLowerCase().includes(cat));
  }

  // Payment status filtering
  if (status && status !== 'all') {
    const st = status.toLowerCase().trim();
    rows = rows.filter((r) => r.payment_status.toLowerCase() === st);
  }

  // Date range filtering
  if (dateFrom) {
    const fromTime = new Date(dateFrom).getTime();
    if (!isNaN(fromTime)) {
      rows = rows.filter((r) => new Date(r.created_at).getTime() >= fromTime);
    }
  }

  if (dateTo) {
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    const toTime = toDate.getTime();
    if (!isNaN(toTime)) {
      rows = rows.filter((r) => new Date(r.created_at).getTime() <= toTime);
    }
  }

  // Sorting
  rows.sort((a, b) => {
    let valA = a[sortField] ?? '';
    let valB = b[sortField] ?? '';
    if (sortField === 'created_at') {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    } else if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = String(valB).toLowerCase();
    }
    if (sortOrder === 'asc') {
      return valA > valB ? 1 : valA < valB ? -1 : 0;
    }
    return valA < valB ? 1 : valA > valB ? -1 : 0;
  });

  const total = rows.length;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const totalPages = Math.ceil(total / pageLimit) || 1;
  const offset = (pageNum - 1) * pageLimit;
  const paginatedRows = rows.slice(offset, offset + pageLimit);

  return {
    rows: paginatedRows,
    total,
    page: pageNum,
    limit: pageLimit,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
  };
}

// Check-in helper for ticket validation
export function checkInTicket(ticketCode, adminEmail = 'admin') {
  const store = readStore();
  const ticket = store.tickets.find((t) => t.ticket_code === ticketCode);
  if (!ticket) {
    return { success: false, error: 'Ticket code not found.' };
  }
  if (ticket.check_in_status === 'checked_in') {
    return {
      success: false,
      alreadyCheckedIn: true,
      error: `Ticket already checked in at ${ticket.check_in_at}.`,
      ticket,
    };
  }
  ticket.check_in_status = 'checked_in';
  ticket.check_in_at = new Date().toISOString();
  ticket.checked_in_by = adminEmail;
  writeStore(store);

  appendAuditLog({
    action: 'ticket_check_in',
    entity: 'ticket',
    entity_id: ticket.id,
    details: { ticket_code: ticket.ticket_code, checked_in_by: adminEmail },
  });

  return { success: true, ticket };
}

