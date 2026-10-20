import { logoutAdmin, getAdminFromRequest, ADMIN_COOKIE_NAME } from '../../../lib/auth.js';

export async function POST({ request, redirect }) {
  const auth = getAdminFromRequest(request);
  if (auth?.session?.session_token) {
    logoutAdmin(auth.session.session_token);
  }

  const clearCookieHeader = `${ADMIN_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

  return new Response(
    JSON.stringify({ success: true, redirect: '/admin/login' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': clearCookieHeader,
      },
    }
  );
}

export async function GET({ request, redirect }) {
  const auth = getAdminFromRequest(request);
  if (auth?.session?.session_token) {
    logoutAdmin(auth.session.session_token);
  }

  const clearCookieHeader = `${ADMIN_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/admin/login',
      'Set-Cookie': clearCookieHeader,
    },
  });
}
