const staticCacheName = 'mws-static';
const contentImgsCache = 'mws-static-img';
const pageCacheName = 'mws-dynamic';
const filesToCache = [
    'css/styles.min.css',
    'js/dbhelper.min.js',
    'js/main.js',
    'js/responsive_helper.js',
    'js/restaurant_info.js',
    'index.html',
    'restaurant.html'
];
const allCaches = [
    staticCacheName,
    contentImgsCache,
    pageCacheName
];


self.addEventListener('install', function(event) {
    console.log('Attempting to install service worker and cache static assets');
    event.waitUntil(
        caches.open(staticCacheName)
            .then(function(cache) {
                return cache.addAll(filesToCache);
            }).catch((error)=> console.log('caches open: ',error))
    );

});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(cacheName) {
                    return cacheName.startsWith('mws-static') &&
                        !allCaches.includes(cacheName);
                }).map(function(cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.open(pageCacheName).then(function(cache) {
            return fetch(event.request).then(function(response) {
                cache.put(event.request, response.clone());
                return response;
            });
        })
    );
});
