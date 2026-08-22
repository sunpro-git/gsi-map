/* ===========================================================
 *  Service Worker — オフライン対応
 *
 *   - アプリ本体（HTML/CSS/JS と MapLibre）をキャッシュして、通信が無くても起動できるようにする
 *   - 一度表示した地理院タイルをキャッシュし、次からは通信なしで表示する
 *   - 住所・標高の応答もキャッシュし、オフライン時は前回の結果を返す
 *
 *  タイルの事前ダウンロードはページ側（js/offline.js）が同じキャッシュに書き込む。
 * =========================================================== */
'use strict';

// 内容を更新したらここを上げる。古いキャッシュは activate で削除される
const VERSION    = 'v2';
// アプリ本体のキャッシュ名だけはビルドごとに変える（build.py が中身から自動で書き込む）。
// 地図タイルのキャッシュは VERSION のままにして、更新のたびに消えないようにする。
const APP_BUILD  = '24810f0d';
const APP_CACHE  = 'gsimap-app-' + APP_BUILD;
const TILE_CACHE = 'gsimap-tiles-' + VERSION;
const API_CACHE  = 'gsimap-api-' + VERSION;

/** アプリ本体。dist（1ファイル版）では一部が存在しないので、失敗は無視する */
const SHELL = [
  './',
  './index.html',
  './css/style.css',
  './js/config.js',
  './js/google.js',
  './js/route.js',
  './js/drive.js',
  './js/track.js',
  './js/offline.js',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/apple-touch-icon.png',
  'https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js',
  'https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css',
];

const isTile = url =>
  url.hostname === 'cyberjapandata.gsi.go.jp' && url.pathname.startsWith('/xyz/');

const isGsiApi = url =>
  url.hostname === 'msearch.gsi.go.jp'
  || url.hostname === 'mreversegeocoder.gsi.go.jp'
  || url.hostname === 'cyberjapandata2.gsi.go.jp'
  || url.hostname === 'maps.gsi.go.jp';

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(APP_CACHE);
    // 1 つでも失敗すると addAll は全部失敗するので、個別に取得する
    await Promise.allSettled(SHELL.map(async u => {
      const res = await fetch(u, { cache:'reload' });
      if (res.ok) await cache.put(u, res);
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = [APP_CACHE, TILE_CACHE, API_CACHE];
    for (const name of await caches.keys())
      if (name.startsWith('gsimap-') && !keep.includes(name)) await caches.delete(name);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 地図タイル：キャッシュ優先（オフラインでも即表示）
  if (isTile(url)){
    event.respondWith((async () => {
      const cache = await caches.open(TILE_CACHE);
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch (e){
        return new Response('', { status:504, statusText:'offline' });
      }
    })());
    return;
  }

  // 住所・標高・地名検索：通信を優先し、失敗したら前回の応答を返す
  if (isGsiApi(url)){
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok){
          const cache = await caches.open(API_CACHE);
          cache.put(req, res.clone());
        }
        return res;
      } catch (e){
        const hit = await caches.match(req);
        if (hit) return hit;
        throw e;
      }
    })());
    return;
  }

  // アプリ本体：通信を優先（更新を取り込む）し、失敗したらキャッシュ
  if (url.origin === self.location.origin
      || url.hostname === 'unpkg.com'){
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok){
          const cache = await caches.open(APP_CACHE);
          cache.put(req, res.clone());
        }
        return res;
      } catch (e){
        const hit = await caches.match(req) || await caches.match('./index.html');
        if (hit) return hit;
        throw e;
      }
    })());
  }
  // それ以外（Google など）は通さずそのまま
});
