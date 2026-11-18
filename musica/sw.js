/* Guarda Onda en el teléfono para que abra sin internet. La música no pasa por aquí:
   vive en IndexedDB. Al cambiar cualquier archivo, sube VERSION para que los teléfonos se actualicen. */
const VERSION = 'onda-4';
const FILES = [
  './', 'index.html', 'app.css', 'manifest.webmanifest',
  'js/db.js', 'js/tags.js', 'js/demo.js', 'js/player.js', 'js/app.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('onda-') && k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(VERSION).then((c) => c.match(e.request, { ignoreSearch: true })).then((hit) => hit || fetch(e.request).catch(() => {
      if (e.request.mode === 'navigate') return caches.match('index.html');
      return Response.error();
    }))
  );
});
