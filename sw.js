/* Skin — Service Worker
   Cache shell for offline + standalone install */

const CACHE_NAME = 'elysium-v7';
const ASSETS = [
  './',
  './index.html',
  './css/base.css',
  './css/layout.css',
  './css/settings.css',
  './css/modal.css',
  './css/components.css',
  './css/cycle.css',
  './css/chronicle.css',
  './css/progress.css',
  './css/today.css',
  './css/auth.css',
  './css/temple.css',
  './main.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png',
  './js/constants.js',
  './js/utils.js',
  './js/state.js',
  './js/sync.js',
  './js/domains/care.js',
  './js/domains/chronicle.js',
  './js/domains/light.js',
  './js/domains/sleep.js',
  './js/domains/mind.js',
  './js/services/photos.js',
  './js/services/notifications.js',
  './js/render/common.js',
  './js/render/temple.js',
  './js/render/today.js',
  './js/render/cycle.js',
  './js/render/chronicle.js',
  './js/render/progress.js',
  './js/render/settings.js',
  './js/ui/tabs.js',
  './js/ui/modals.js',
  './js/ui/toast.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const sameOrigin = url.origin === self.location.origin;
  const shellPath = url.pathname === '/' ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.includes('/css/') ||
    url.pathname.endsWith('/main.js') ||
    url.pathname.endsWith('/manifest.json') ||
    url.pathname.includes('/js/');

  if (event.request.mode === 'navigate' || (sameOrigin && shellPath)) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const respClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
        }
        return response;
      }).catch(() =>
        caches.match(event.request).then(cached =>
          cached || caches.match('./index.html').then(shell => shell || Response.error())
        )
      )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const respClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
        }
        return response;
      }).catch(() => cached || Response.error());
      return cached || fetchPromise;
    })
  );
});

// Allow notification click to focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});
