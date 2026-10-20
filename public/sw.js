// public/sw.js - Service Worker for Geohabari
const CACHE_NAME = 'geohabari-v1.0.0';
const STATIC_CACHE = 'geohabari-static-v1.0.0';
const DYNAMIC_CACHE = 'geohabari-dynamic-v1.0.0';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/styles/main.css',
  '/fonts/inter-var.woff2',
  '/images/geohabari-logo.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Assets that should be cached but not critical for offline
const DYNAMIC_ASSETS = [
  '/episodes',
  '/categories', 
  '/about',
  '/community'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              // Delete old cache versions
              return cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE &&
                     cacheName !== CACHE_NAME;
            })
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip external requests
  if (!url.origin.includes('geohabari.com') && !url.origin.includes('localhost')) {
    return;
  }
  
  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  const url = new URL(request.url);
  
  try {
    // Strategy 1: Cache First (for static assets)
    if (isStaticAsset(url.pathname)) {
      return await cacheFirst(request);
    }
    
    // Strategy 2: Network First (for dynamic content)
    if (isDynamicContent(url.pathname)) {
      return await networkFirst(request);
    }
    
    // Strategy 3: Stale While Revalidate (for pages)
    return await staleWhileRevalidate(request);
    
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    return await handleOffline(request);
  }
}

// Cache First Strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  const cache = await caches.open(STATIC_CACHE);
  cache.put(request, networkResponse.clone());
  
  return networkResponse;
}

// Network First Strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Stale While