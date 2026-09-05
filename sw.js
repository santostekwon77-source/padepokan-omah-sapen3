// Service Worker - Padepokan Omah Sapen
// Strategi: NETWORK-FIRST untuk semua file utama (index.html, dsb)
// Artinya: setiap kali HP online, aplikasi SELALU mengambil versi terbaru dari server dulu.
// Cache hanya dipakai sebagai cadangan kalau HP sedang offline.
// Dengan ini, kamu tidak perlu lagi mengubah nomor versi manual tiap kali update materi.

const CACHE_NAME = 'padepokan-omah-sapen-cache-v1';
const OFFLINE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

// Saat install: siapkan cache awal, lalu langsung aktif tanpa menunggu tab lama ditutup
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS).catch(() => {
        // kalau ada file yang belum ada (misal ikon beda nama), jangan sampai install gagal total
      });
    })
  );
});

// Saat activate: hapus cache versi lama & langsung ambil alih semua tab yang terbuka
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Saat fetch: NETWORK-FIRST
// 1. Coba ambil dari internet dulu (supaya materi terbaru selalu didapat)
// 2. Kalau berhasil, simpan salinan terbaru ke cache
// 3. Kalau gagal (HP offline), baru pakai cache sebagai cadangan
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match('./index.html');
        });
      })
  );
});
