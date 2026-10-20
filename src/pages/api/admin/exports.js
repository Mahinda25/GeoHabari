import { getAdminFromRequest } from '../../../lib/auth.js';
import { queryTicketHolders, appendAuditLog } from '../../../lib/ticketing-store.js';

function sanitizeCsvCell(value) {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  // Prevent CSV Formula Injection
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET({ request }) {
  // 1. Verify admin authentication
  const auth = getAdminFromRequest(request);
  if (!auth) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized. Admin session required to export records.' }),
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
    const dateFrom = url.searchParams.get('from') || '';
    const dateTo = url.searchParams.get('to') || '';

    // Fetch up to 10,000 records matching active filters
    const { rows } = queryTicketHolders({
      search,
      category,
      status,
      dateFrom,
      dateTo,
      page: 1,
      limit: 10000,
      sortField: 'created_at',
      sortOrder: 'desc',
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
      'Amount (KES)',
      'Payment Method',
      'Payment Status',
      'Payment Reference',
      'Purchase Date',
      'Check-in Status',
      'Student Verified',
    ];

    const csvLines = [headers.map(h => `"${h}"`).join(',')];

    for (const r of rows) {
      const line = [
        sanitizeCsvCell(r.ticket_code),
        sanitizeCsvCell(r.buyer_name),
        sanitizeCsvCell(r.email),
        sanitizeCsvCell(r.phone),
        sanitizeCsvCell(r.event_title),
        sanitizeCsvCell(r.category),
        sanitizeCsvCell(r.order_reference),
        r.order_quantity || 1,
        r.order_amount || 0,
        sanitizeCsvCell(r.payment_method),
        sanitizeCsvCell(r.payment_status),
        sanitizeCsvCell(r.payment_reference),
        sanitizeCsvCell(r.created_at ? new Date(r.created_at).toISOString() : ''),
        sanitizeCsvCell(r.check_in_status || 'not_checked_in'),
        sanitizeCsvCell(r.is_student_verified ? 'Yes' : 'No'),
      ];
      csvLines.push(line.join(','));
    }

    const today = new Date().toISOString().slice(0, 10);
    const filename = `geohabari-ticket-holders-${today}.csv`;

    // Audit log the export event
    appendAuditLog({
      action: 'ticket_holders_exported',
      entity: 'export',
      entity_id: null,
      details: {
        admin_email: auth.user.email,
        record_count: rows.length,
        filters: { search, category, status, dateFrom, dateTo },
      },
    });

    return new Response(csvLines.join('\r\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, private',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Export generation failed: ${error.message}` }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, private',
        },
      }
    );
  }
}
