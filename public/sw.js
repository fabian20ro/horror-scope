const CACHE_VERSION = 'horror-scope-v1';

self.addEventListener('install', (event) => {
  const scopePath = new URL(self.registration.scope).pathname;
  const assets = [
    `${scopePath}`,
    `${scopePath}index.html`,
    `${scopePath}data/en.txt`,
    `${scopePath}data/ro.txt`,
    `${scopePath}favicon.svg`,
    `${scopePath}manifest.webmanifest`,
  ];

  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(assets)).catch(() => {
      // Ignore preload failures; runtime caching still works.
    }),
  );

  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
        return response;
      });
    }),
  );
});
