// CHECKLIST END — service worker (v5.0, 22/10/2026)
// Objetivo: o app abre mesmo sem internet. Estratégia "rede primeiro, cache
// como reserva": sempre tenta baixar a versão nova; se a rede falhar, serve a
// última cópia boa. Nunca prende o fiscal numa versão velha.
var CACHE = 'checks-end-v1';
var ARQUIVOS = ['./', './index.html', './mapa.html'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(ARQUIVOS.map(function (u) { return c.add(u).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;                      // POST pro backend nunca passa por aqui
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;       // Apps Script, tiles de mapa, CDN: direto
  e.respondWith(
    fetch(req).then(function (resp) {
      if (resp && resp.ok) { var cp = resp.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); }); }
      return resp;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (hit) {
        return hit || caches.match('./index.html');
      });
    })
  );
});
