import { getAdminFromRequest } from '../../../lib/auth.js';
import {
  listEvents,
  getEventById,
  getTicketTypesByEvent,
  saveEventWithTickets,
  saveEvent,
  readStore,
  writeStore,
  appendAuditLog,
} from '../../../lib/ticketing-store.js';

export async function GET({ request, cookies }) {
  const auth = getAdminFromRequest(request, cookies);
  if (!auth) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized. Admin session required.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const rawEvents = listEvents();
    const events = rawEvents.map((event) => ({
      ...event,
      ticket_types: getTicketTypesByEvent(event.id),
    }));

    return new Response(JSON.stringify({ events }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST({ request, cookies }) {
  const auth = getAdminFromRequest(request, cookies);
  if (!auth) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized. Admin session required.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();

    const title = String(body.title || '').trim();
    if (!title || title.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Event title must be at least 3 characters long.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const venue = String(body.venue || '').trim();
    if (!venue) {
      return new Response(
        JSON.stringify({ error: 'Venue is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const startsDate = body.starts_at ? new Date(body.starts_at) : new Date();
    const endsDate = body.ends_at
      ? new Date(body.ends_at)
      : new Date(startsDate.getTime() + 60 * 60 * 1000);
    if (Number.isNaN(startsDate.getTime()) || Number.isNaN(endsDate.getTime()) || endsDate <= startsDate) {
      return new Response(
        JSON.stringify({ error: 'Event end date must be valid and later than its start date.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const startsAt = startsDate.toISOString();
    const endsAt = endsDate.toISOString();
    const requestedStatus = body.status || 'published';
    if (!['published', 'draft', 'archived'].includes(requestedStatus)) {
      return new Response(JSON.stringify({ error: 'Unsupported event status.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (requestedStatus === 'archived' && body.id && new Date(endsAt).getTime() > Date.now()) {
      return new Response(JSON.stringify({ error: 'Only completed events can be archived.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let ticketTypes = Array.isArray(body.ticket_types) ? body.ticket_types : [];
    if (ticketTypes.length === 0) {
      return new Response(JSON.stringify({ error: 'At least one configured ticket category is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    ticketTypes = ticketTypes.map((t) => ({
      id: t.id || undefined,
      name: String(t.name || '').trim(),
      category_type: t.category_type || (String(t.name || '').toLowerCase().includes('professional') ? 'professional' : String(t.name || '').toLowerCase().includes('student') ? 'student' : 'standard'),
      price: Number(t.price ?? 0),
      allocation: Number(t.allocation ?? 50),
      description: String(t.description || '').trim(),
    }));
    if (ticketTypes.some((t) => (
      !t.name ||
      !Number.isSafeInteger(t.price) ||
      t.price < 0 ||
      !Number.isSafeInteger(t.allocation) ||
      t.allocation < 1 ||
      !['student', 'professional', 'standard'].includes(t.category_type)
    ))) {
      return new Response(JSON.stringify({ error: 'Ticket categories require a name, a non-negative whole-number price, and a positive whole-number allocation.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (new Set(ticketTypes.map((ticket) => ticket.name.toLowerCase())).size !== ticketTypes.length) {
      return new Response(JSON.stringify({ error: 'Ticket category names must be unique within an event.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const store = readStore();
    for (const ticketType of ticketTypes) {
      const existingTicketType = ticketType.id
        ? store.ticket_types.find((ticket) => ticket.id === ticketType.id)
        : null;
      if (ticketType.id && (!existingTicketType || existingTicketType.event_id !== body.id)) {
        return new Response(JSON.stringify({ error: 'A ticket category does not belong to this event.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (existingTicketType && ticketType.allocation < Number(existingTicketType.sold_count || 0)) {
        return new Response(JSON.stringify({ error: 'Ticket allocation cannot be lower than tickets already sold.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (existingTicketType) {
        const activeReserved = store.orders
          .filter((order) => (
            order.ticket_type_id === existingTicketType.id &&
            order.status === 'pending' &&
            new Date(order.payment_expires_at || new Date(order.created_at).getTime() + 20 * 60 * 1000).getTime() > Date.now()
          ))
          .reduce((sum, order) => sum + Number(order.quantity || 0), 0);
        if (ticketType.allocation < Number(existingTicketType.sold_count || 0) + activeReserved) {
          return new Response(JSON.stringify({ error: 'Ticket allocation cannot be lower than sold tickets and active payment reservations.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    }

    const incentives = Array.isArray(body.incentives)
      ? body.incentives.map((inc) => ({
          id: inc.id || `inc-${crypto.randomUUID().slice(0, 8)}`,
          title: String(inc.title || '').trim(),
          description: String(inc.description || '').trim(),
          discount_type: ['percentage', 'fixed', 'none'].includes(inc.discount_type) ? inc.discount_type : 'none',
          discount_value: Math.max(0, Number(inc.discount_value ?? 0)),
          eligibility: String(inc.eligibility || '').trim(),
          start_date: inc.start_date ? new Date(inc.start_date).toISOString() : null,
          end_date: inc.end_date ? new Date(inc.end_date).toISOString() : null,
          is_active: inc.is_active !== false,
        })).filter((inc) => Boolean(inc.title))
      : [];

    const isArchived = body.status === 'archived';

    const eventData = {
      id: body.id || undefined,
      title,
      slug: body.slug ? String(body.slug).trim() : undefined,
      description: String(body.description || '').trim(),
      venue,
      poster: String(body.poster || '').trim() || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
      starts_at: startsAt,
      ends_at: endsAt,
      status: isArchived ? 'archived' : (requestedStatus === 'draft' ? 'draft' : 'published'),
      speakers: Array.isArray(body.speakers) ? body.speakers : [],
      partners: Array.isArray(body.partners) ? body.partners : [],
      incentives,
      archived_at: isArchived ? new Date().toISOString() : null,
    };

    const result = saveEventWithTickets({ eventData, ticketTypes });

    appendAuditLog({
      action: body.id ? 'admin_event_updated' : 'admin_event_created',
      entity: 'event',
      entity_id: result.event.id,
      details: {
        admin_email: auth.user.email,
        title: result.event.title,
        slug: result.event.slug,
        ticketCount: result.ticket_types.length,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: body.id ? 'Event updated successfully.' : 'Event created successfully.',
        event: result.event,
        ticket_types: result.ticket_types,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(context) {
  return POST(context);
}

export async function DELETE({ request, cookies }) {
  const auth = getAdminFromRequest(request, cookies);
  if (!auth) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized. Admin session required.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const url = new URL(request.url);
    const eventId = url.searchParams.get('id');
    if (!eventId) {
      return new Response(JSON.stringify({ error: 'Event ID is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const event = getEventById(eventId);
    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (new Date(event.ends_at).getTime() > Date.now()) {
      return new Response(JSON.stringify({ error: 'Only completed events can be archived.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    saveEvent({
      ...event,
      status: 'archived',
      archived_at: new Date().toISOString(),
    });

    appendAuditLog({
      action: 'admin_event_archived',
      entity: 'event',
      entity_id: eventId,
      details: { admin_email: auth.user.email, title: event.title },
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Event archived successfully.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
