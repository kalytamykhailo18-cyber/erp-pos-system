/**
 * Service Worker Registration
 * Implements PWA offline-first capability as required by PART 12: OFFLINE MODE
 *
 * This utility handles:
 * - Service worker registration
 * - Update detection
 * - Skip waiting for new versions
 * - Offline/online event handling
 */

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
};

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config?: Config) {
  if ('serviceWorker' in navigator) {
    // The URL constructor is available in all browsers that support SW.
    const publicUrl = new URL(process.env.PUBLIC_URL || '', window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      // Service worker won't work if PUBLIC_URL is on a different origin
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `/sw.js`;

      if (isLocalhost) {
        // This is running on localhost. Check if a service worker still exists or not.
        checkValidServiceWorker(swUrl, config);

        // Add some additional logging to localhost, pointing developers to the
        // service worker/PWA documentation.
        navigator.serviceWorker.ready.then(() => {
          console.log(
            '[SW] This web app is being served cache-first by a service worker.'
          );
        });
      } else {
        // Is not localhost. Just register service worker
        registerValidSW(swUrl, config);
      }

      // Listen for offline/online events
      window.addEventListener('offline', () => {
        console.log('[SW] App is now offline');
        if (config?.onOffline) {
          config.onOffline();
        }
      });

      window.addEventListener('online', () => {
        console.log('[SW] App is now online');
        if (config?.onOnline) {
          config.onOnline();
        }
      });
    });
  }
}

function registerValidSW(swUrl: string, config?: Config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('[SW] Service Worker registered successfully');

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // At this point, the updated precached content has been fetched,
              // but the previous service worker will still serve the older
              // content until all client tabs are closed.
              console.log(
                '[SW] New content is available and will be used when all ' +
                  'tabs for this page are closed.'
              );

              // Execute callback
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // At this point, everything has been precached.
              // It's the perfect time to display a "Content is cached for offline use." message.
              console.log('[SW] Content is cached for offline use.');

              // Execute callback
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };

      // Check for updates every 1 hour
      setInterval(() => {
        registration.update();
      }, 1000 * 60 * 60);
    })
    .catch((error) => {
      console.error('[SW] Error during service worker registration:', error);
    });
}

function checkValidServiceWorker(swUrl: string, config?: Config) {
  // Check if the service worker can be found. If it can't reload the page.
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      // Ensure service worker exists, and that we really are getting a JS file.
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found. Probably a different app. Reload the page.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found. Proceed as normal.
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('[SW] No internet connection found. App is running in offline mode.');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('[SW] Error unregistering service worker:', error);
      });
  }
}

/**
 * Skip waiting for new service worker
 * Forces the waiting service worker to become active immediately
 */
export function skipWaiting() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });
  }
}

/**
 * Check if app is running in standalone mode (installed as PWA)
 */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Prompt user to install PWA
 */
let deferredPrompt: any;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  console.log('[SW] PWA install prompt available');
});

export function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log('[SW] PWA already installed or prompt not available');
    return Promise.resolve(false);
  }

  // Show the install prompt
  deferredPrompt.prompt();

  // Wait for the user to respond to the prompt
  return deferredPrompt.userChoice.then((choiceResult: any) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('[SW] User accepted the install prompt');
      return true;
    } else {
      console.log('[SW] User dismissed the install prompt');
      return false;
    }
  }).finally(() => {
    deferredPrompt = null;
  });
}

/**
 * Check if service worker is supported
 */
export function isSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Get service worker registration
 */
export function getRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker.getRegistration();
  }
  return Promise.resolve(undefined);
}

/**
 * Trigger background sync (for offline sales sync)
 */
export async function triggerBackgroundSync(tag: string = 'sync-offline-sales'): Promise<void> {
  const registration = await getRegistration();

  if (registration && 'sync' in registration) {
    try {
      await (registration as any).sync.register(tag);
      console.log(`[SW] Background sync registered: ${tag}`);
    } catch (error) {
      console.error(`[SW] Background sync failed: ${tag}`, error);
    }
  } else {
    console.warn('[SW] Background sync not supported');
  }
}
