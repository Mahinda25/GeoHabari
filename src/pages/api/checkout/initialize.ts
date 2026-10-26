import type { APIRoute } from 'astro';
import { initializeCheckout } from '../../../lib/checkout-initialize.js';

type CheckoutResponse =
  | {
      success: true;
      reference: string;
      access_code?: string;
      authorization_url?: string;
      message: string;
      pending: true;
    }
  | { error: string };

interface CheckoutRequest {
  email: string;
  amount: number;
  event_id: string;
  [key: string]: unknown;
}

function isCheckoutRequest(value: unknown): value is CheckoutRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const body = value as Record<string, unknown>;
  return typeof body.email === 'string' && body.email.trim().length > 0
    && typeof body.event_id === 'string' && body.event_id.trim().length > 0
    && typeof body.amount === 'number' && Number.isFinite(body.amount) && body.amount > 0;
}

function jsonError(error: string, status: number): Response {
  return new Response(JSON.stringify({ error } satisfies CheckoutResponse), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, private',
    },
  });
}

export const POST: APIRoute = async ({ request }): Promise<Response> => {
  let body: unknown;
  try {
    body = await request.clone().json();
  } catch {
    return jsonError('Request body must contain valid JSON.', 400);
  }
  if (!isCheckoutRequest(body)) {
    return jsonError('A valid email, event, and positive amount are required.', 400);
  }

  const response = await initializeCheckout(request);
  const payload = await response.json() as CheckoutResponse;
  return new Response(JSON.stringify(payload), {
    status: response.status,
    headers: response.headers,
  });
};
