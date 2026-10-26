// src/hooks.server.js – global error handler for Astro (server‑side only)

/**
 * Astro calls this hook for every incoming request.
 * We wrap the normal resolver in a try/catch so that any uncaught exception
 * is logged (Vercel captures console.error) and a safe generic 500 response
 * is sent to the client. This gives us full stack traces in Vercel Runtime
 * Logs without leaking secrets to end‑users.
 */
export async function handle({ request, resolve }) {
  try {
    // Let Astro resolve the request normally (pages, API routes, etc.)
    return await resolve(request);
  } catch (error) {
    // ------------------------------------------------------------------
    // 1️⃣ Log the full error – Vercel will store this in Runtime Logs.
    // ------------------------------------------------------------------
    console.error('⚠️ Unhandled server error', {
      url: request.url,
      method: request.method,
      // Preserve original message & stack for debugging.
      message: error?.message ?? String(error),
      stack: error?.stack ?? null,
    });

    // ------------------------------------------------------------------
    // 2️⃣ Return a safe generic response to the client.
    // ------------------------------------------------------------------
    // Do NOT expose stack traces, env variables, or any secret data.
    return new Response('Internal Server Error', { status: 500 });
  }
}
