// 梦海 PWA Service Worker — 离线缓存
const CACHE = 'dreamsea-v1';
const ASSETS = [
  '/',
  '/index.html',
];

self.addEventListener('install', (e: any) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', (e: any) => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
