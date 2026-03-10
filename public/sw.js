const CACHE_VERSION = 'horror-scope-v2';
const STATIC_TTL_MS = 180 * 1000;
const META_SUFFIX = "__sw_meta";

self.addEventListener('install', () => {
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

function getMetaRequest(requestUrl) {
  const url = new URL(requestUrl);
  url.searchParams.set(META_SUFFIX, 'true');
  return new Request(url.toString());
}

async function getCachedResponse(cache, request) {
  const cached = await cache.match(request);
  if (!cached) return null;

  const meta = await cache.match(getMetaRequest(request.url));
  if (!meta) return null;

  const fetchedAt = Number(await meta.text());
  if (!Number.isFinite(fetchedAt)) return null;

  return Date.now() - fetchedAt <= STATIC_TTL_MS ? cached : null;
}

async function putWithMeta(cache, request, response) {
  await cache.put(request, response);
  await cache.put(getMetaRequest(request.url), new Response(String(Date.now())));
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_VERSION);

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error('Network unavailable and no cached response');
  }
}

async function staticWithTtl(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await getCachedResponse(cache, request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    await putWithMeta(cache, request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;
  if (requestUrl.searchParams.has(META_SUFFIX)) return;

  const scopePath = new URL(self.registration.scope).pathname;
  const isIndexRequest =
    event.request.mode === 'navigate' ||
    requestUrl.pathname === scopePath ||
    requestUrl.pathname.endsWith('/index.html');

  if (isIndexRequest) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(staticWithTtl(event.request));
});
