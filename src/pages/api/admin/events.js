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

    const startsAt = body.starts_at ? new Date(body.starts_at).toISOString() : new Date().toISOString();
    const endsAt = body.ends_at ? new Date(body.ends_at).toISOString() : startsAt;

    let ticketTypes = Array.isArray(body.ticket_types) ? body.ticket_types : [];
    // Default categories if none provided
    if (ticketTypes.length === 0) {
      ticketTypes = [
        { name: 'Student', price: 600, allocation: 50, description: 'Student admission' },
        { name: 'Professional', price: 1000, allocation: 100, description: 'Full access ticket' },
      ];
    } else {
      ticketTypes = ticketTypes.map((t) => ({
        id: t.id || undefined,
        name: String(t.name || '').trim(),
        price: Math.max(0, Number(t.price ?? 0)),
        allocation: Math.max(1, Number(t.allocation ?? 50)),
        description: String(t.description || '').trim(),
      })).filter((t) => Boolean(t.name));
    }

    const eventData = {
      id: body.id || undefined,
      title,
      slug: body.slug ? String(body.slug).trim() : undefined,
      description: String(body.description || '').trim(),
      venue,
      poster: String(body.poster || '').trim() || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
      starts_at: startsAt,
      ends_at: endsAt,
      status: body.status === 'draft' ? 'draft' : 'published',
      speakers: Array.isArray(body.speakers) ? body.speakers : [],
      partners: Array.isArray(body.partners) ? body.partners : [],
      archived_at: null,
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
