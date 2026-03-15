/* ================================================
   Lingvora — Service Worker
   Кэширует index.html для работы офлайн и
   поддержки "Добавить на главный экран".
================================================ */

const CACHE_NAME = 'lingvora-v2';
const ASSETS = ['./index.html', './sw.js'];

// Установка — кэшируем основные файлы
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Активация — удаляем старые кэши
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — сначала кэш, затем сеть
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  // Не перехватываем запросы к внешним API (перевод должен идти в сеть)
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(resp => {
        // Кэшируем новые ресурсы с нашего origin
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        return resp;
      });
    }).catch(() => caches.match('./index.html'))
  );
});
