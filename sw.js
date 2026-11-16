const CACHE_NAME = 'daily-mindsum-v21';
const CORE_ASSETS = [
  './',
  './index.html',
  './styles/main.css',
  './assets/icon.svg',
  './assets/favicon-64.png',
  './assets/apple-touch-icon.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './manifest.webmanifest',
  './js/app.js',
  './js/i18n.js',
  './js/mascot-3d.js',
  './js/ui-fx.js',
  './js/storage.js',
  './js/firebase-config.js',
  './js/firebase-service.js',
  './js/push-service.js',
  './js/data/content.js',
  './js/data/eagle-art.js',
  './js/data/spot-diff-art.js',
  './js/data/seed-tracker.js',
  './js/data/bank-market-math.js',
  './js/data/bank-history.js',
  './js/data/bank-words-eagle.js',
  './js/data/bank-puzzles.js',
  './js/data/bank-vocab.js',
  './js/games/engine.js',
  './js/games/extra-games.js',
  './js/games/spot-diff-game.js',
  './js/games/brain-age-games.js',
  './js/games/academy-games.js',
  './data/daily-news.json'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        // Bypass browser HTTP disk cache (e.g. GitHub Pages max-age=600) so fresh JS/CSS is always stored
        return Promise.all(
          CORE_ASSETS.map(function (assetUrl) {
            return fetch(new Request(assetUrl, { cache: 'reload' })).then(function (res) {
              if (res && res.ok) {
                return cache.put(assetUrl, res);
              }
            });
          })
        );
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        const oldKeys = keys.filter(function (k) {
          return k !== CACHE_NAME;
        });
        return Promise.all(
          oldKeys.map(function (k) {
            return caches.delete(k);
          })
        ).then(function () {
          return oldKeys.length > 0;
        });
      })
      .then(function (hadOldCaches) {
        return self.clients.claim().then(function () {
          if (!hadOldCaches) return;
          return self.clients.matchAll({ type: 'window' }).then(function (windowClients) {
            windowClients.forEach(function (client) {
              if (client && typeof client.navigate === 'function') {
                client.navigate(client.url).catch(function () {});
              }
            });
          });
        });
      })
  );
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Network-first (revalidating with server, instant offline fallback) so deployments appear immediately!
  event.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then(function (res) {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(function (c) {
            c.put(req, clone);
          });
        }
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (exact) {
          return exact || caches.match(req, { ignoreSearch: true });
        });
      })
  );
});

self.addEventListener('push', function (event) {
  let payload = {
    title: '🫖 每日腦點心 · Daily MindSum',
    body: '喵～今日嘅四道醒神腦點心已經準備好，入嚟嘆茶動腦筋啦！',
    url: './',
    tag: 'daily-mindsum-reminder'
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      if (parsed && typeof parsed === 'object') {
        payload = {
          title: String(parsed.title || payload.title).slice(0, 80),
          body: String(parsed.body || payload.body).slice(0, 200),
          url: './',
          tag: String(parsed.tag || payload.tag).slice(0, 40)
        };
      }
    } catch (e) {
      // fallback to default message
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: './assets/icon-192.png',
      badge: './assets/favicon-64.png',
      tag: payload.tag,
      renotify: false,
      data: { url: payload.url },
      actions: [
        { action: 'play', title: '🥢 開始嘆茶 / Play' },
        { action: 'optout', title: '🔕 關閉提醒 / Opt Out' }
      ]
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const isOptOut = event.action === 'optout';
  const targetRel = isOptOut ? './?optout_reminder=1' : './';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client && 'focus' in client) {
          if (isOptOut && typeof client.navigate === 'function') {
            return client.navigate(targetRel).then(function () {
              return client.focus();
            });
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetRel);
      }
    })
  );
});
