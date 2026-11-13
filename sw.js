// Keeps a copy of the app's own files so it opens quickly and works with no signal.
// It only handles requests for this site's files. The figures a user enters are kept separately, by the page itself.
// The network is tried first, so a new version is picked up as soon as the phone is online.
const CACHE = "jr1-money-v6";
const FILES = ["./", "favicon.svg", "site.webmanifest", "icons/icon-192.png",
  "fonts/ibm-plex-sans-latin-400-normal.woff2", "fonts/ibm-plex-sans-latin-500-normal.woff2",
  "fonts/ibm-plex-sans-latin-600-normal.woff2", "fonts/ibm-plex-sans-latin-700-normal.woff2",
  "fonts/ibm-plex-mono-latin-500-normal.woff2", "fonts/ibm-plex-mono-latin-600-normal.woff2"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || caches.match("./")))
  );
});
