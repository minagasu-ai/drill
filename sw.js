// オフラインでも開けるよう、アプリ本体を端末に保存する。
// ドリルを更新したら VERSION を上げてアップロードすると、次回起動時に新しい版へ入れ替わる。
const VERSION = 'v3';
const CACHE = 'drill-' + VERSION;
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // ネット優先・失敗したら保存版（更新がすぐ反映され、圏外でも開ける）
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
      return r;
    }).catch(() => caches.match(e.request).then(m => m || caches.match('./index.html')))
  );
});
