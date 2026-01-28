/**
 * Service Worker for Gretta's Mascotas POS System
 * Enables offline-first capability as required by PART 12: OFFLINE MODE
 *
 * Caching Strategy:
 * - HTML/JS: Network-first (always try fresh content first)
 * - API: Network-first with offline fallback
 * - Static Assets (images, fonts): Cache-first
 */

// IMPORTANT: Version changes on each build to force cache updates
const BUILD_TIMESTAMP = '{{BUILD_TIMESTAMP}}'; // Will be replaced during build
const CACHE_VERSION = `v2-${BUILD_TIMESTAMP}`;
const CACHE_NAME = `pos-cache-${CACHE_VERSION}`;
const API_CACHE_NAME = `pos-api-cache-${CACHE_VERSION}`;

// Files to cache immediately on install (minimal app shell)
const APP_SHELL_FILES = [
  '/logo.jpg',
  '/manifest.json',
];

/**
 * Install Event - Cache minimal app shell only
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing version:', CACHE_VERSION);

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(APP_SHELL_FILES);
      })
      .then(() => {
        console.log('[ServiceWorker] App shell cached successfully');
        // Force the waiting service worker to become active immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[ServiceWorker] Error caching app shell:', error);
      })
  );
});

/**
 * Activate Event - Clean up ALL old caches immediately
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating version:', CACHE_VERSION);

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete ANY cache that's not the current version
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Activated, old caches cleared');
        // Take control of all pages immediately (no waiting for reload)
        return self.clients.claim();
      })
      .then(() => {
        // Notify all clients that service worker updated
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'SW_UPDATED',
              version: CACHE_VERSION
            });
          });
        });
      })
  );
});

/**
 * Fetch Event - Smart caching strategy
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (except known CDNs)
  if (url.origin !== self.location.origin && !url.origin.includes('googleapis') && !url.origin.includes('cloudinary')) {
    return;
  }

  // API Requests - Network-first (always try fresh data)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE_NAME));
    return;
  }

  // HTML/JS/CSS - Network-first (always try fresh code)
  if (
    request.destination === 'document' ||
    request.destination === 'script' ||
    request.destination === 'style' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css')
  ) {
    event.respondWith(networkFirstStrategy(request, CACHE_NAME));
    return;
  }

  // Static Assets (images, fonts) - Cache-first (they don't change)
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|woff|woff2|ttf|eot)$/)
  ) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
    return;
  }

  // Default: Network-first for everything else
  event.respondWith(networkFirstStrategy(request, CACHE_NAME));
});

/**
 * Network-First Strategy
 * ALWAYS try network first, fall back to cache only if offline
 * This ensures users always get fresh content when online
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    // Try network first (with timeout to avoid hanging)
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout')), 5000)
      )
    ]);

    // If successful, update cache in background
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network failed, trying cache:', request.url);

    // Only use cache as fallback when network is unavailable
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('[ServiceWorker] Serving from cache (offline):', request.url);
      return cachedResponse;
    }

    // If navigation request and no cache, return minimal offline page
    if (request.destination === 'document') {
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head><title>Offline</title></head>
        <body>
          <h1>Sin conexión</h1>
          <p>No se puede conectar al servidor. Verifique su conexión a internet.</p>
          <button onclick="window.location.reload()">Reintentar</button>
        </body>
        </html>`,
        {
          status: 503,
          headers: new Headers({
            'Content-Type': 'text/html'
          })
        }
      );
    }

    // For API requests, return JSON error
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({
          error: 'Offline - No hay datos en caché',
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

    return new Response('Offline', { status: 503 });
  }
}

/**
 * Cache-First Strategy
 * Try cache first, fall back to network
 * ONLY for static assets that don't change (images, fonts)
 */
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  // Not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[ServiceWorker] Fetch failed:', request.url, error);
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Message Event - Handle commands from clients
 */
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('[ServiceWorker] Clearing cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        console.log('[ServiceWorker] All caches cleared');
      })
    );
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_VERSION,
      timestamp: BUILD_TIMESTAMP
    });
  }
}); /**
 * Sync Event - Background sync for offline operations
 */
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync triggered:', event.tag);

  if (event.tag === 'sync-offline-sales') {
    event.waitUntil(
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

console.log('[ServiceWorker] Loaded version:', CACHE_VERSION);
