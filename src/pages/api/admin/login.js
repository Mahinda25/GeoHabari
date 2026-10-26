import { authenticateAdmin, ADMIN_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, ensureInitialAdmin } from '../../../lib/auth.js';

export async function POST({ request, cookies }) {
  try {
    // Ensure at least one admin exists
    await ensureInitialAdmin();

    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                      request.headers.get('x-real-ip') ||
                      '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    const authResult = await authenticateAdmin({
      email,
      password,
      ipAddress,
      userAgent,
    });

    if (!authResult.success) {
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: authResult.status || 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Set secure session cookie
    const isProd = import.meta.env.PROD;
    const cookieHeader = [
      `${ADMIN_COOKIE_NAME}=${authResult.sessionToken}`,
      `Path=/`,
      `HttpOnly`,
      `SameSite=Lax`,
      `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
      isProd ? 'Secure' : '',
    ].filter(Boolean).join('; ');

    return new Response(
      JSON.stringify({
        success: true,
        user: authResult.user,
        redirect: '/admin',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookieHeader,
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'An unexpected authentication error occurred.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
