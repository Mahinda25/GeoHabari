import { getAdminFromRequest } from '../../lib/auth.js';
import { queryTicketHolders, appendAuditLog } from '../../lib/ticketing-store.js';

function sanitizeCsvCell(value) {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET({ request }) {
  // CRITICAL SECURITY GUARD: Verify administrator authentication
  const auth = getAdminFromRequest(request);
  if (!auth) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized. Admin session required to download ticket exports.' }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, private',
        },
      }
    );
  }

  try {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const category = url.searchParams.get('category') || 'all';
    const status = url.searchParams.get('status') || 'all';

    const { rows } = queryTicketHolders({
      search,
      category,
      status,
      page: 1,
      limit: 10000,
    });

    const headers = [
      'Ticket Code',
      'Buyer Name',
      'Email',
      'Phone',
      'Event',
      'Ticket Category',
      'Order Reference',
      'Quantity',
      'Amount',
      'Payment Status',
    ];

    const csvLines = [headers.map(h => `"${h}"`).join(',')];
    for (const r of rows) {
      csvLines.push([
        sanitizeCsvCell(r.ticket_code),
        sanitizeCsvCell(r.buyer_name),
        sanitizeCsvCell(r.email),
        sanitizeCsvCell(r.phone),
        sanitizeCsvCell(r.event_title),
        sanitizeCsvCell(r.category),
        sanitizeCsvCell(r.order_reference),
        r.order_quantity,
        r.order_amount,
        sanitizeCsvCell(r.payment_status),
      ].join(','));
    }

    const today = new Date().toISOString().slice(0, 10);
    appendAuditLog({
      action: 'ticket_holders_exported_legacy',
      entity: 'export',
      entity_id: null,
      details: { admin_email: auth.user.email, record_count: rows.length },
    });

    return new Response(csvLines.join('\r\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="geohabari-export-${today}.csv"`,
        'Cache-Control': 'no-store, private',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
