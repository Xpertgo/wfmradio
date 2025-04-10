// Service Worker for World FM Radio
const CACHE_NAME = 'world-fm-radio-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/js/all.min.js',
    'https://via.placeholder.com/96x96', // Placeholder icon for notifications
    'https://via.placeholder.com/128x128', // Placeholder artwork for media session
    'https://via.placeholder.com/64x64' // Placeholder icons for notification actions
];

// Install event: Cache essential files
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching files');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
            .catch(err => console.error('Service Worker: Cache failed', err))
    );
});

// Activate event: Clean up old caches and claim clients
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
        .catch(err => console.error('Service Worker: Activation failed', err))
    );
});

// Fetch event: Serve cached content when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    console.log('Service Worker: Serving from cache', event.request.url);
                    return response;
                }
                return fetch(event.request).catch(() => {
                    console.log('Service Worker: Network unavailable, serving offline page');
                    return caches.match('/index.html');
                });
            })
    );
});

// Notification click event: Handle user interactions with notifications
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const action = event.action;
    console.log('Service Worker: Notification clicked with action:', action);

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            // Focus existing window or open a new one
            const url = '/';
            let clientFound = false;

            for (const client of clientList) {
                if (client.url === url && 'focus' in client) {
                    client.focus();
                    clientFound = true;
                    break;
                }
            }

            if (!clientFound && clients.openWindow) {
                return clients.openWindow(url);
            }

            // Send message to client based on action
            if (clientList.length > 0) {
                const client = clientList[0];
                switch (action) {
                    case 'play':
                    case 'pause':
                    case 'previous':
                    case 'next':
                        client.postMessage({ action });
                        break;
                    default:
                        console.log('Service Worker: No specific action, just focusing app');
                        break;
                }
            }
        }).catch(err => console.error('Service Worker: Notification click handling failed', err))
    );
});

// Push event: Handle push notifications (optional future enhancement)
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push received');
    const data = event.data ? event.data.json() : { title: 'World FM Radio', body: 'New update available!' };
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: 'https://via.placeholder.com/96x96',
            badge: 'https://via.placeholder.com/96x96'
        })
    );
});

// Background sync event: Handle reconnection attempts (optional future enhancement)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-radio') {
        console.log('Service Worker: Background sync triggered');
        event.waitUntil(
            // Placeholder for syncing logic, e.g., retrying failed station fetches
            Promise.resolve().then(() => console.log('Service Worker: Sync completed'))
        );
    }
});
