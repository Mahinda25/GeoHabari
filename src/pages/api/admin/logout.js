import { ADMIN_COOKIE_NAME, getAdminFromRequest, logoutAdmin } from '../../../lib/auth.js';

const noCacheHeaders = {
  'Cache-Control': 'no-store, private, max-age=0, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

function endSession(request) {
  const auth = getAdminFromRequest(request);
  if (auth?.session?.session_token) {
    logoutAdmin(auth.session.session_token);
  }

  const cookie = [
    `${ADMIN_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    new URL(request.url).protocol === 'https:' ? 'Secure' : '',
  ].filter(Boolean).join('; ');

  return cookie;
}

export async function POST({ request }) {
  const cookie = endSession(request);
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      ...noCacheHeaders,
      'Content-Type': 'application/json',
      'Set-Cookie': cookie,
    },
  });
}

export async function GET({ request }) {
  const cookie = endSession(request);
  const publicHome = new URL(process.env.PUBLIC_WORDPRESS_URL || 'https://tickets.geohabari.com').origin;
  return new Response(null, {
    status: 303,
    headers: {
      ...noCacheHeaders,
      Location: publicHome,
      'Set-Cookie': cookie,
    },
  });
}
