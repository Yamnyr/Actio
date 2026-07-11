const CACHE_NAME = 'actio-cache-v1';

// Installation du Service Worker et activation immédiate
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Nettoyage des anciens caches lors de l'activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Stratégie "Stale-While-Revalidate" (sert le cache et met à jour en arrière-plan)
self.addEventListener('fetch', (event) => {
  // Ne gère que les requêtes GET locales
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        // En cas de panne de réseau et d'absence de cache, renvoyer l'index
        return cachedResponse;
      });

      // Renvoie la réponse du cache immédiatement s'il existe, sinon attend le réseau
      return cachedResponse || fetchPromise;
    })
  );
});
