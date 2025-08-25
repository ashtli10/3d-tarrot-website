/* Service Worker for 3D Tarot PWA */
const VERSION = 'v3'; // mobile performance & centered zoom improvements
const CORE_CACHE = `core-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/model.glb',
  '/manifest.webmanifest',
  '/scripts/app.js',
  '/scripts/register-sw.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => ![CORE_CACHE, RUNTIME_CACHE].includes(k)).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Listen for precache optional message
self.addEventListener('message', (event) => {
  if (event.data?.type === 'PRECACHE_OPTIONAL') {
    caches.open(RUNTIME_CACHE).then(cache => {
      event.data.urls.forEach(url => cache.add(url).catch(()=>{}));
    });
  }
});

// Network-first for the model (to allow updates), cache-first for core & CDN libs
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return; // Only cache GET

  // Always try network first for the model to allow updates
  if (url.pathname.endsWith('/model.glb')) {
    event.respondWith(networkThenCache(event.request));
    return;
  }

  // Cache-first for core assets & same-origin static
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request).then(resp => {
        const copy = resp.clone();
        caches.open(RUNTIME_CACHE).then(cache => cache.put(event.request, copy));
        return resp;
      }))
    );
    return;
  }

  // Stale-while-revalidate for third-party (e.g., model-viewer CDN)
  event.respondWith(staleWhileRevalidate(event.request));
});

async function networkThenCache(request){
  try {
    const fresh = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, fresh.clone());
    return fresh;
  } catch (err){
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function staleWhileRevalidate(request){
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const networkPromise = fetch(request).then(resp => {
    cache.put(request, resp.clone());
    return resp;
  }).catch(()=>cached);
  return cached || networkPromise;
}
