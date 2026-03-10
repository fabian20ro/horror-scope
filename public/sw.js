const CACHE_VERSION = 'horror-scope-v3';
const METADATA_CACHE_VERSION = 'horror-scope-meta-v3';
const CACHE_TTL_MS = 3 * 60 * 1000;

const getMetadataRequest = (request) => new Request(`${request.url}::ts`);

const updateTimestamp = async (request, timestamp = Date.now()) => {
  const metadataCache = await caches.open(METADATA_CACHE_VERSION);
  await metadataCache.put(
    getMetadataRequest(request),
    new Response(String(timestamp), {
      headers: { 'content-type': 'text/plain' },
    }),
  );
};

const getTimestamp = async (request) => {
  const metadataCache = await caches.open(METADATA_CACHE_VERSION);
  const metadataResponse = await metadataCache.match(getMetadataRequest(request));
  if (!metadataResponse) return null;

  const parsed = Number(await metadataResponse.text());
  return Number.isFinite(parsed) ? parsed : null;
};

const fetchAndRefresh = async (request, cache) => {
  const response = await fetch(request);
  await cache.put(request, response.clone());
  await updateTimestamp(request);
  return response;
};

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
    caches
      .open(CACHE_VERSION)
      .then(async (cache) => {
        await cache.addAll(assets);

        const now = Date.now();
        await Promise.all(
          assets.map((assetPath) => {
            const request = new Request(new URL(assetPath, self.registration.scope).toString());
            return updateTimestamp(request, now);
          }),
        );
      })
      .catch(() => {
        // Ignore preload failures; runtime caching still works.
      }),
  );

  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION && key !== METADATA_CACHE_VERSION)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      const cachedResponse = await cache.match(event.request);

      if (!cachedResponse) {
        return fetchAndRefresh(event.request, cache);
      }

      // TTL policy: cached responses older than 3 minutes are stale.
      // Stale entries are refreshed from network and both cache + timestamp are updated.
      const timestamp = await getTimestamp(event.request);
      const isFresh = timestamp !== null && Date.now() - timestamp <= CACHE_TTL_MS;
      if (isFresh) {
        return cachedResponse;
      }

      try {
        return await fetchAndRefresh(event.request, cache);
      } catch {
        // If refresh fails, serve the stale response rather than failing the request.
        return cachedResponse;
      }
    })(),
  );
});
