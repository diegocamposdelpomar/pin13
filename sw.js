/* Guarda la app en el teléfono para que funcione sin internet.
   Al cambiar cualquier archivo, sube VERSION: así los teléfonos descargan la versión nueva. */
const VERSION = 'pin13-1';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/sim/parser.js', 'js/sim/machine.js',
  'js/data/functions.js', 'js/data/lessons-1.js', 'js/data/lessons-2.js', 'js/data/lessons-3.js', 'js/data/resources.js',
  'js/ui/common.js', 'js/ui/board.js', 'js/ui/lab.js', 'js/ui/widgets.js', 'js/ui/app.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).catch(() => {
      if (e.request.mode === 'navigate') return caches.match('index.html');
      return Response.error();
    }))
  );
});
