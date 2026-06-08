const CACHE_NAME = 'flashstore-v4';
const STATIC_CACHE = 'flashstore-static-v4';
const IMAGE_CACHE = 'flashstore-images-v1';

// Assets to pre-cache on install - Using relative paths for better portability
const PRECACHE_URLS = [
    'index.html',
    'app.css',
    'js/main.js',
    'js/modules/cart.js',
    'js/modules/constants.js',
    'js/modules/countdown.js',
    'js/modules/images.js',
    'js/modules/notifications.js',
    'js/modules/pwa-notifications.js',
    'js/modules/pwa.js',
    'js/modules/renderers.js',
    'js/modules/reveal.js',
    'js/modules/theme.js',
    'js/modules/utils.js',
    'theme-init.js',
    'manifest.json',
    'icon-192.svg',
    'icon-512.svg',
    'offline.html'
];

// Install: pre-cache critical assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

// Activate: clean up ALL old caches (any cache not matching current names)
self.addEventListener('activate', (event) => {
    const CURRENT_CACHES = [STATIC_CACHE, IMAGE_CACHE];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (!CURRENT_CACHES.includes(cache)) {
                        console.log('[SW] Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) return;

    // Handle navigation requests (HTML pages) - Network-first
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(request)
                        .then((cached) => {
                            if (cached) return cached;
                            return caches.match('offline.html');
                        });
                })
        );
        return;
    }

    // Handle image requests (cache-first)
    if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
        event.respondWith(
            caches.match(request)
                .then((cached) => {
                    if (cached) return cached;
                    return fetch(request)
                        .then((response) => {
                            if (response.ok) {
                                const clone = response.clone();
                                caches.open(IMAGE_CACHE).then((cache) => cache.put(request, clone));
                            }
                            return response;
                        })
                        .catch(() => new Response('', { status: 404 }));
                })
        );
        return;
    }

    // Handle static assets (cache-first)
    if (url.pathname.match(/\.(css|js|woff2?|ttf|eot)$/i)) {
        event.respondWith(
            caches.match(request)
                .then((cached) => {
                    if (cached) return cached;
                    return fetch(request)
                        .then((response) => {
                            if (response.ok) {
                                const clone = response.clone();
                                caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
                            }
                            return response;
                        });
                })
        );
        return;
    }

    // Handle CDN resources (stale-while-revalidate)
    if (url.hostname !== location.hostname) {
        event.respondWith(
            caches.open(STATIC_CACHE).then((cache) => {
                return cache.match(request).then((cached) => {
                    const fetchPromise = fetch(request)
                        .then((response) => {
                            if (response.ok) cache.put(request, response.clone());
                            return response;
                        })
                        .catch(() => cached);
                    return cached || fetchPromise;
                });
            })
        );
        return;
    }

    // Default: network-first with cache fallback
    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
                }
                return response;
            })
            .catch(() => caches.match(request))
    );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
    // Allow the page to request cache version info
    if (event.data === 'getVersion') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});

// ── Push Notifications ──
self.addEventListener('push', (event) => {
    let data = { title: 'FlashStore', body: 'Você tem uma nova notificação!', icon: '/icon-192.svg', badge: '/icon-192.svg', tag: 'flashstore-notification', data: { url: '/index.html' } };

    if (event.data) {
        try {
            const payload = event.data.json();
            data = { ...data, ...payload };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon || '/icon-192.svg',
            badge: data.badge || '/icon-192.svg',
            tag: data.tag || 'flashstore-notification',
            data: data.data || { url: '/index.html' },
            vibrate: [100, 50, 100],
            actions: [
                { action: 'open', title: 'Abrir' },
                { action: 'dismiss', title: 'Dispensar' }
            ]
        })
    );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    const url = event.notification.data?.url || '/index.html';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Focus existing window if open
            for (const client of clientList) {
                if (client.url.includes(url) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Open new window if none found
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
    // Analytics or cleanup could go here
});

// ── Periodic Background Sync for flash sales (when supported) ──
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'flash-sale-check') {
        event.waitUntil(
            self.registration.showNotification('⚡ Oferta Relâmpago!', {
                body: 'Novas ofertas disponíveis! Confira antes que acabem.',
                icon: '/icon-192.svg',
                badge: '/icon-192.svg',
                tag: 'flash-sale',
                vibrate: [100, 50, 100],
                data: { url: '/index.html' },
                actions: [
                    { action: 'open', title: 'Ver Ofertas' },
                    { action: 'dismiss', title: 'Depois' }
                ]
            })
        );
    }
});
