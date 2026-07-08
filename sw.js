/* ==========================================================================
   Portal Tic-Tac-Toe Service Worker (PWA Offline Cache)
   ========================================================================== */

const CACHE_NAME = 'portal-ttt-v4';
const ASSETS = [
  'index.html',
  'css/style.css',
  'css/animations.css',
  'css/responsive.css',
  'js/app.js',
  'js/ai.js',
  'js/game.js',
  'js/storage.js',
  'js/animations.js',
  'js/theme.js',
  'manifest.json'
];

// Install Service Worker and cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use addAll with catch to prevent single asset failures from blocking cache
      return Promise.allSettled(
        ASSETS.map(asset => {
          return cache.add(asset).catch(err => {
            console.warn(`PWA Service Worker: Failed to pre-cache ${asset}`, err);
          });
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercept fetch requests and serve cached content if offline
self.addEventListener('fetch', (event) => {
  // Only intercept HTTP/S GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Fallback to network
      return fetch(event.request).then((networkResponse) => {
        // Cache dynamic assets (like Google fonts or avatars) if successful
        if (networkResponse && networkResponse.status === 200 && event.request.url.startsWith('http')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Offline fallback (e.g. return cached index.html for navigation request)
        if (event.request.mode === 'navigate') {
          return caches.match('index.html');
        }
      });
    })
  );
});
