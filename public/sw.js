const CACHE_VERSION = 'horror-scope-v2';
const STATIC_TTL_MS = 180 * 1000;
const META_MARKER = '__sw_meta';

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

function metaRequestFor(requestUrl) {
  const url = new URL(requestUrl);
  url.searchParams.set(META_MARKER, '1');
  return new Request(url.toString());
}

async function setTimedCacheEntry(cache, request, response) {
  await cache.put(request, response);
  await cache.put(metaRequestFor(request.url), new Response(String(Date.now())));
}

async function readFreshTimedCacheEntry(cache, request) {
  const cached = await cache.match(request);
  if (!cached) return null;

  const cachedMeta = await cache.match(metaRequestFor(request.url));
  if (!cachedMeta) return null;

  const cachedAt = Number(await cachedMeta.text());
  if (!Number.isFinite(cachedAt)) return null;

  return Date.now() - cachedAt <= STATIC_TTL_MS ? cached : null;
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
    return Response.error();
  }
}

async function staticWithTtl(request) {
  const cache = await caches.open(CACHE_VERSION);
  const freshCached = await readFreshTimedCacheEntry(cache, request);
  if (freshCached) return freshCached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      await setTimedCacheEntry(cache, request, response.clone());
    }
    return response;
  } catch {
    const staleCached = await cache.match(request);
    if (staleCached) return staleCached;
    return Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;
  if (requestUrl.searchParams.has(META_MARKER)) return;

  const scopePath = new URL(self.registration.scope).pathname;
  const isHtmlNavigation =
    event.request.mode === 'navigate' ||
    requestUrl.pathname === scopePath ||
    requestUrl.pathname.endsWith('/index.html');

  if (isHtmlNavigation) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(staticWithTtl(event.request));
});
