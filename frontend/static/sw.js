// Service worker de AYNI (PWA): la app abre sin conexión.
// Estrategia: red primero y, si no hay señal, lo último guardado en caché.
// Los DATOS viven en localStorage y se sincronizan con la API: /api nunca se guarda en caché.
const CACHE = 'ayni-v2';
const SHELL = ['/', '/index.html', '/logo.jpg', '/icon-192.png', '/avatar-default.png', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copia = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copia));
        }
        return response;
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match('/index.html')))
  );
});
