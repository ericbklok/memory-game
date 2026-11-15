const CACHE_NAME = 'daily-mindsum-v8';
const CORE_ASSETS = [
  './',
  './index.html',
  './styles/main.css',
  './assets/icon.svg',
  './manifest.webmanifest',
  './js/app.js',
  './js/i18n.js',
  './js/mascot-3d.js',
  './js/ui-fx.js',
  './js/storage.js',
  './js/firebase-config.js',
  './js/firebase-service.js',
  './js/data/content.js',
  './js/data/seed-tracker.js',
  './js/data/bank-market-math.js',
  './js/data/bank-history.js',
  './js/data/bank-words-eagle.js',
  './js/data/bank-puzzles.js',
  './js/data/bank-vocab.js',
  './js/games/engine.js',
  './js/games/extra-games.js',
  './data/daily-news.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for daily news JSON so fresh stories appear immediately when online
  if (url.pathname.endsWith('/daily-news.json')) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Stale-while-revalidate for fast PWA startup
  event.respondWith(
    caches.match(req).then(cached => {
      const fetched = fetch(req)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetched;
    })
  );
});
