const CACHE_NAME = 'ag-pwa-cache-v17-replan-zero-chapters';
const PRECACHE_ASSETS = [
    './',
    './index.html',
    './sw.js',
    './fresh.html',
    './manifest.json',
    './novel.js',
    './novel.css'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // API 요청 및 todo.json은 네트워크에서만 즉시 로드 (캐시 우회)
    if (url.pathname.startsWith('/api/') || url.pathname.endsWith('todo.json')) {
        event.respondWith(fetch(event.request, { cache: 'no-store' }).catch(() => {
            return new Response('Offline', { status: 503, statusText: 'Offline' });
        }));
        return;
    }
    
    // 정적 파일은 Network First with Cache Fallback 전략 적용
    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});
