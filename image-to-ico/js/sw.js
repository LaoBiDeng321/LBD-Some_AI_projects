// Service Worker 实现离线功能

const CACHE_NAME = 'ico-converter-cache-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js'
];

// 安装Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('缓存打开成功');
                return cache.addAll(ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// 激活Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('删除旧缓存:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// 处理请求
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // 如果缓存中有响应，则返回缓存的响应
                if (response) {
                    return response;
                }
                
                // 否则，发送网络请求
                return fetch(event.request)
                    .then((networkResponse) => {
                        // 如果响应有效，将其添加到缓存中
                        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        // 如果网络请求失败，尝试返回离线页面
                        if (event.request.mode === 'navigate') {
                            return caches.match('/');
                        }
                    });
            })
    );
});
