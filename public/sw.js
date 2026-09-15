const CACHE = 'kueki-shell-v1';
const LANDING_DOCUMENT = '/';
const APP_DOCUMENT = '/app';
// build-sw.ts rewrites both lists. Essential assets are the documents and the code they load;
// without them there is no offline shell. Everything else only degrades the shell's looks.
const ESSENTIAL_ASSETS = [LANDING_DOCUMENT, APP_DOCUMENT];
const OPTIONAL_ASSETS = ['/icon.svg', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest'];
const PRECACHED_PATHS = new Set([...ESSENTIAL_ASSETS, ...OPTIONAL_ASSETS]);

async function cacheEachSeparately(cache, paths) {
  const results = await Promise.allSettled(paths.map((path) => cache.add(path)));
  return paths.filter((path, index) => results[index].status === 'rejected');
}

async function precacheShell() {
  const cache = await caches.open(CACHE);
  const [essentialFailures, optionalFailures] = await Promise.all([
    cacheEachSeparately(cache, ESSENTIAL_ASSETS),
    cacheEachSeparately(cache, OPTIONAL_ASSETS),
  ]);
  if (optionalFailures.length) console.warn('kueki: assets missing from cache', optionalFailures);
  // Installing anyway keeps push and future updates working; one bad path must never leave the
  // app without a service worker. The error is loud because offline reload is now unreliable.
  if (essentialFailures.length)
    console.error('kueki: offline shell incomplete, missing', essentialFailures);
}

self.addEventListener('install', (event) => event.waitUntil(precacheShell()));
self.addEventListener('activate', (event) =>
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => key.startsWith('kueki-shell-') && key !== CACHE)
              .map((key) => caches.delete(key)),
          ),
        ),
      self.clients.claim(),
    ]),
  ),
);
self.addEventListener('message', (event) => {
  if (event.data?.type === 'ACTIVATE') self.skipWaiting();
});

function offlineDocumentFor(pathname) {
  return pathname === '/app' || pathname.startsWith('/app/') ? APP_DOCUMENT : LANDING_DOCUMENT;
}

async function cachedDocument(pathname) {
  const match =
    (await caches.match(offlineDocumentFor(pathname))) || (await caches.match(LANDING_DOCUMENT));
  return match || Response.error();
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.startsWith('/@')
  )
    return;
  if (event.request.mode === 'navigate')
    event.respondWith(fetch(event.request).catch(() => cachedDocument(url.pathname)));
  else if (PRECACHED_PATHS.has(url.pathname))
    event.respondWith(
      caches
        .match(event.request, { ignoreVary: true })
        .then((cached) => cached || fetch(event.request)),
    );
});
self.addEventListener('push', (event) => {
  let payload = { title: 'Check Kueki', body: 'Your baby monitor has an update.', tag: 'kueki' };
  try {
    Object.assign(payload, event.data?.json());
  } catch {}
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: payload.tag,
      requireInteraction: true,
      data: { url: '/app' },
    }),
  );
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      const client = clients.find((client) => new URL(client.url).origin === self.location.origin);
      if (client) {
        await client.focus();
        return;
      }
      await self.clients.openWindow('/app');
    }),
  );
});
