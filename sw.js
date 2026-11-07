// 前川課勉強会用 過去問ドリル — オフライン用の仕組み
// 端末に保存した版ですぐ開き、通信は「初回」と「更新があったとき」だけにする。
// ドリルを更新したら VERSION を上げてアップロードする。ブラウザがこの小さなファイル（数KB）の変化を見つけると、
// 新しい版を裏でまとめて保存し直し、次に開いたときから新しい版になる。
const VERSION = 'v5';
const CACHE = 'drill-' + VERSION;
const FILES = ['./index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(FILES.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k.startsWith('drill-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // ページ本体は保存版を使う（毎回12MBをダウンロードしない）
    e.respondWith(caches.match('./index.html').then(m => m || fetch(req)));
    return;
  }
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(m => m || fetch(req).then(r => {
      if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return r;
    }))
  );
});
