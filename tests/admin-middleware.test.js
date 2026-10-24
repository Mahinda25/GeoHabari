import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../src/middleware.js';

test('Admin page authentication redirects before layout rendering with no-cache headers', async () => {
  let continued = false;
  const response = await onRequest({
    request: new Request('https://tickets.geohabari.com/admin/events'),
    cookies: { get: () => undefined },
    redirect: (location, status) => new Response(null, {
      status,
      headers: { Location: location },
    }),
  }, async () => {
    continued = true;
    return new Response('rendered');
  });

  assert.equal(continued, false);
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), '/admin/login');
  assert.equal(response.headers.get('cache-control'), 'no-store, private, max-age=0, must-revalidate');
});

test('Admin login and public routes are not redirected by the admin guard', async () => {
  for (const url of [
    'https://tickets.geohabari.com/admin/login',
    'https://tickets.geohabari.com/events',
  ]) {
    const expected = new Response('allowed');
    const response = await onRequest({
      request: new Request(url),
      cookies: { get: () => undefined },
      redirect: () => {
        throw new Error('Public routes should not redirect.');
      },
    }, async () => expected);
    assert.equal(response, expected);
  }
});
