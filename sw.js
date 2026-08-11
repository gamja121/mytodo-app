const CACHE_NAME = 'ag-pwa-cache-offline-schedule-v4';
const TODO_CACHE_KEY = '/__offline_todo_snapshot__.json';
const PRECACHE_ASSETS = [
    './',
    './index.html',
    './sw.js',
    './fresh.html',
    './manifest.json',
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
    
    // todo.json은 네트워크 우선이며, 성공 응답을 고정 키로 보관해
    // 쿼리 문자열이 달라져도 오프라인에서 마지막 정상본을 반환한다.
    if (url.pathname.endsWith('todo.json')) {
        event.respondWith(
            fetch(event.request, { cache: 'no-store' })
                .then(response => {
                    if (response && response.status === 200) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(TODO_CACHE_KEY, copy));
                    }
                    return response;
                })
                .catch(async () => {
                    const cached = await caches.match(TODO_CACHE_KEY);
                    return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
                })
        );
        return;
    }

    // 나머지 API 요청은 서버가 필요하므로 네트워크 전용이다.
    if (url.pathname.startsWith('/api/')) {
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
