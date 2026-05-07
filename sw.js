const CACHE_NAME = 'linguaai-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/admin.html',
  '/css/style.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/chat.js',
  '/js/theme.js',
  '/js/hamburger.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
