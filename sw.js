let staticCacheName = 'restaurant-static-v1';
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(staticCacheName).then(function(cache) {
            return cache.addAll([
                '/',
                'index.html',
                'restaurant.html',
                'css/styles.css',
                'js/dbhelper.js',
                'js/main.js',
                'js/restaurant_info.js',
                'img/',
                'data/restaurants.json',
            ]);
        })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(cacheName) {
                    return cacheName.startsWith('restaurant-') && cacheName != staticCacheName;
                }).map(function(cacheName) {
                    return caches.delete(cacheName);
                })    
            );
        })
    );
});

self.addEventListener('fetch', function(event){
    // console.log(event.request);
    event.respondWith(
        caches.match(event.request).then(function(response) {
            if (response) {
                console.log('Found ', event.request.url, ' in cache');
                return response;
            }
            console.log('Network request for ', event.request.url);
            return fetch(event.request).then(function(response) {
                if (response.status === 404) {
                    console.log(response.status);
                    return;
                }
                return caches.open(staticCacheName).then(function(cache) {
                    return response;
                })
            })
        }).catch(function(error) {
            console.log('Error, ', error);
            return;
        })
    );
});

self.addEventListener('message', function(event) {
    if (event.data.action === 'skipWaiting') {
       self.skipWaiting();
    }
});