const CACHE_NAME = 'neovolt-sec-v2';
const DYNAMIC_CACHE = 'neovolt-dynamic-v2';

// Static assets to cache immediately upon installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/src/main.tsx',
  '/src/index.css'
];

// Install Event - Pre-cache core assets & activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching app shell & static assets');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Pre-cache partial error:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - Clear old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            console.log('[ServiceWorker] Deleting legacy cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Hybrid Network-First / Stale-While-Revalidate Caching Strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests for standard caching, but intercept offline API POSTs gracefully
  if (request.method !== 'GET') {
    if (url.pathname.startsWith('/api/cloud-sync')) {
      event.respondWith(
        fetch(request).catch(() => {
          // Return synthetic JSON response when offline so app save flow handles it cleanly
          return new Response(
            JSON.stringify({
              success: true,
              offlineQueued: true,
              message: 'Sin conexión a internet. Guardado en la cola local para sincronización con Firebase al volver en línea.',
              timestamp: new Date().toISOString()
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
      );
    }
    return;
  }

  // Handle SPA Navigation requests (HTML) -> Network First with Cache Fallback
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/', responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          console.log('[ServiceWorker] Offline detected for navigation. Serving cached HTML fallback.');
          const cachedHtml = await caches.match('/index.html') || await caches.match('/');
          if (cachedHtml) return cachedHtml;

          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8"><title>NEOVOLT - Modo Sin Conexión</title></head><body style="background:#0f172a;color:#fff;font-family:sans-serif;text-align:center;padding:50px;"><h2>⚡ NEOVOLT SEC - Modo Offline Active</h2><p>Estás utilizando la aplicación sin conexión a internet. Todos los datos ingresados se guardarán localmente.</p></body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // Handle Static Assets (JS, CSS, SVGs, Fonts, Images) -> Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, reliance on cachedResponse
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Background Sync Event Listener
self.addEventListener('sync', (event) => {
  if (event.tag === 'firebase-cloud-sync' || event.tag === 'online-recovery') {
    console.log('[ServiceWorker] Sync event triggered:', event.tag);
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'FIREBASE_SYNC_REQUEST',
            source: 'SERVICE_WORKER_SYNC',
            timestamp: new Date().toISOString()
          });
        });
      })
    );
  }
});

// Message Listener from Client Window
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'CHECK_ONLINE_SYNC') {
    // Notify clients to flush pending queue
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'FIREBASE_SYNC_REQUEST',
          source: 'CLIENT_CHECK',
          timestamp: new Date().toISOString()
        });
      });
    });
  }
});
