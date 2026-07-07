/// <reference lib="webworker" />

const CACHE_NAME = "palier-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/icon.svg",
];

// Install — pre-cache shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network-first with cache fallback for navigation
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // For navigation requests (HTML pages): network-first
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  // For static assets: cache-first
  if (request.url.includes("/_next/static/") || request.url.includes("/icon")) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      }))
    );
    return;
  }
});

// Push notification handler
self.addEventListener("push", (event) => {
  let data = { title: "Palier", body: "Nouvelle notification", icon: "/icon.svg" };
  try {
    data = event.data?.json() ?? data;
  } catch {
    data.body = event.data?.text() ?? data.body;
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/icon.svg",
      badge: "/icon.svg",
      data: data.url ? { url: data.url } : undefined,
      vibrate: [200, 100, 200],
    })
  );
});

// Notification click — open the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(url));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
