import {
  listStudentVerifications,
  purgeExpiredStudentDocuments,
  getTicketMetrics,
  readStore,
  appendAuditLog,
} from '../../../lib/ticketing-store.js';
import { deletePrivateFile } from '../../../lib/private-storage.js';

function authenticateAdmin(request) {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    // If no ADMIN_API_KEY is configured, protect the route by denying by default
    return false;
  }

  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim() === adminKey;
  }

  const url = new URL(request.url);
  return url.searchParams.get('key') === adminKey;
}

export async function GET({ request }) {
  if (!authenticateAdmin(request)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized. Admin API key required.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const metrics = getTicketMetrics();
  const verifications = listStudentVerifications();
  const store = readStore();

  // Sanitize verification records for admin observability (mask sensitive emails and hashes)
  const sanitizedVerifications = verifications.slice(0, 50).map((v) => ({
    id: v.id,
    method: v.method,
    buyer_name: v.buyer_name,
    email_domain: v.email ? v.email.split('@')[1] : null,
    status: v.status,
    match_score: v.match_score || null,
    is_duplicate_flagged: Boolean(v.is_duplicate_flagged),
    has_stored_file: Boolean(v.document_storage_key),
    retention_expires_at: v.retention_expires_at,
    purged: Boolean(v.purged_at),
    created_at: v.created_at,
  }));

  return new Response(
    JSON.stringify({
      metrics,
      verifications: sanitizedVerifications,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function POST({ request }) {
  if (!authenticateAdmin(request)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized. Admin API key required.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'purge_retention';

    if (action === 'purge_retention') {
      const store = readStore();
      const nowIso = new Date().toISOString();
      let filesDeleted = 0;

      for (const record of store.student_verifications) {
        if (record.retention_expires_at && record.retention_expires_at <= nowIso && !record.purged_at) {
          if (record.document_storage_key) {
            deletePrivateFile(record.document_storage_key);
            filesDeleted += 1;
          }
        }
      }

      const { purgedCount } = purgeExpiredStudentDocuments(nowIso);

      appendAuditLog({
        action: 'admin_retention_purge',
        entity: 'student_verification',
        entity_id: null,
        details: { purgedRecords: purgedCount, filesDeleted },
      });

      return new Response(
        JSON.stringify({
          success: true,
          purgedRecords: purgedCount,
          filesDeleted,
          message: `Purged ${purgedCount} expired student verification records and deleted ${filesDeleted} private documents.`,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown admin action: ${action}` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
