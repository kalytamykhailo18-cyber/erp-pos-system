/**
 * Service Worker for Gretta's Mascotas POS System
 * Enables offline-first capability as required by PART 12: OFFLINE MODE
 *
 * Caching Strategy:
 * - App Shell: Cache-first (HTML, CSS, JS)
 * - API: Network-first with offline fallback (sales, products, customers)
 * - Static Assets: Cache-first with network fallback (images, fonts)
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `pos-cache-${CACHE_VERSION}`;
const API_CACHE_NAME = `pos-api-cache-${CACHE_VERSION}`;

// Files to cache immediately on install (App Shell)
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/logo.jpg',
  '/manifest.json',
];

// API endpoints to cache for offline use
const API_ENDPOINTS_TO_CACHE = [
  '/api/v1/products',
  '/api/v1/customers',
  '/api/v1/payment-methods',
  '/api/v1/categories',
];

/**
 * Install Event - Cache App Shell
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(APP_SHELL_FILES);
      })
      .then(() => {
        console.log('[ServiceWorker] App shell cached successfully');
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[ServiceWorker] Error caching app shell:', error);
      })
  );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Activated');
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

/**
 * Fetch Event - Network-first for API, Cache-first for static assets
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (except for known CDNs)
  if (url.origin !== self.location.origin && !url.origin.includes('googleapis')) {
    return;
  }

  // API Requests - Network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE_NAME));
    return;
  }

  // Static Assets - Cache-first strategy
  event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
});

/**
 * Network-First Strategy
 * Try network first, fall back to cache if offline
 * Good for API requests where fresh data is preferred
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    // If successful, update cache
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network request failed, trying cache:', request.url);

    // If network fails, try cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('[ServiceWorker] Serving from cache:', request.url);
      return cachedResponse;
    }

    // If no cache, return offline page or error response
    console.error('[ServiceWorker] No cache available for:', request.url);
    return new Response(
      JSON.stringify({
        error: 'Offline - No cached data available',
        offline: true
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      }
    );
  }
}

/**
 * Cache-First Strategy
 * Try cache first, fall back to network if not found
 * Good for static assets that don't change often
 */
async function cacheFirstStrategy(request, cacheName) {
  // Try cache first
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    console.log('[ServiceWorker] Serving from cache:', request.url);
    return cachedResponse;
  }

  // If not in cache, fetch from network
  try {
    console.log('[ServiceWorker] Fetching from network:', request.url);
    const networkResponse = await fetch(request);

    // Cache the fetched resource
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[ServiceWorker] Fetch failed:', request.url, error);

    // Return a fallback response for navigation requests
    if (request.mode === 'navigate') {
      const cache = await caches.open(cacheName);
      return cache.match('/index.html') || new Response('Offline');
    }

    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * Message Event - Handle messages from clients
 * Used for skip waiting, cache updates, etc.
 */
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    const { urls } = event.data;
    caches.open(CACHE_NAME).then((cache) => {
      cache.addAll(urls);
    });
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    });
  }
});

/**
 * Sync Event - Background sync for offline operations
 * Triggers when network is restored
 */
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync triggered:', event.tag);

  if (event.tag === 'sync-offline-sales') {
    event.waitUntil(
      // The actual sync logic is handled by syncProcessor.ts
      // This just triggers the sync event
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SYNC_TRIGGERED',
            tag: event.tag
          });
        });
      })
    );
  }
});

console.log('[ServiceWorker] Service Worker loaded');
