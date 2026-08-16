/**
 * MINEXUS TV — Service Worker
 * Caches the static app shell only (HTML/CSS/JS/icons).
 * Live movie data & video streams are NEVER cached — they always hit the network fresh.
 */

const CACHE_NAME = 'minexus-tv-shell-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/firebase-init.js',
  '/js/db.js',
  '/js/cinemeta-api.js',
  '/js/app.js',
  '/manifest.json',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept API calls, Firebase, or streaming/embed requests — always live network
  const bypassHosts = ['strem.io', 'firebaseio.com', 'googleapis.com', 'gstatic.com',
    'kriss424did.com', 'vidsrc.to', 'autoembed.cc', 'vidlink.pro', '2embed.cc', 'metahub.space'];
  if (bypassHosts.some((h) => url.hostname.includes(h))) return;

  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => cached);
    })
  );
});
