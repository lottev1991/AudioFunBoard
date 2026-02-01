importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

const VERSION = 'v1.0.0';
const STATIC_ASSETS = [
    'https://code.jquery.com/jquery-4.0.0.min.js',
    'https://code.jquery.com/ui/1.14.2/jquery-ui.min.js',
    'https://code.jquery.com/ui/1.14.2/themes/base/images/ui-icons_777777_256x240.png',
    'https://cdnjs.cloudflare.com/ajax/libs/jqueryui-touch-punch/0.2.3/jquery.ui.touch-punch.min.js',
    './',
    './js/app.js',
    './css/style.css',
    './favicon.png',
    './favicon-192x192.png',
    './favicon.ico',
    './index.php',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(`static-assets-${VERSION}`).then((cache) => cache.addAll(STATIC_ASSETS))
    );
});


if (workbox) {
    console.log(`Workbox is loaded 🎉`);

    workbox.routing.registerRoute(
        ({ request }) => request.destination === 'script' || request.destination === 'style',
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: 'static-resources',
        })
    );

    workbox.routing.registerRoute(
        ({ request }) => request.destination === 'document',
        new workbox.strategies.NetworkFirst({
            cacheName: 'php-pages',
        })
    );
    workbox.routing.registerRoute(
        ({ url }) => url.origin === 'https://code.jquery.com' && request.destination === 'image' || url.href.includes('jquery'),
        new workbox.strategies.CacheFirst({
            cacheName: 'jquery-cdn-cache',
            plugins: [
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200],
                }),
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 5,
                    maxAgeSeconds: 60 * 60 * 24 * 365,
                }),
            ],
        })
    );

    workbox.routing.registerRoute(
        ({ request }) => request.destination === 'audio',
        new workbox.strategies.CacheFirst({
            cacheName: 'audio-cache',
            plugins: [
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [200],
                }),
                new workbox.rangeRequests.RangeRequestsPlugin(),
            ],
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 50,
                    maxAgeSeconds: 30 * 24 * 60 * 60,
                }),
            ],
        })
    );
}