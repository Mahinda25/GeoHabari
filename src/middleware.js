import { getAdminFromRequest } from './lib/auth.js';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, private, max-age=0, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function onRequest(context, next) {
  const { pathname } = new URL(context.request.url);
  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');
  const isLoginPage = pathname === '/admin/login' || pathname === '/admin/login/';
  if (!isAdminPage || isLoginPage) {
    return next();
  }

  if (!getAdminFromRequest(context.request, context.cookies)) {
    const response = context.redirect('/admin/login', 302);
    for (const [name, value] of Object.entries(NO_CACHE_HEADERS)) {
      response.headers.set(name, value);
    }
    return response;
  }

  return next();
}
