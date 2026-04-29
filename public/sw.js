/* Minimal service worker for installability + basic offline shell. */
const CACHE = "capsule-static-v1";
const ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/capsule-icon.png",
  "/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.map((k) => (k === CACHE ? null : caches.delete(k)))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Same-origin only.
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
          return resp;
        })
        .catch(() => caches.match("/"));
    }),
  );
});

// Web Push notification display.
self.addEventListener("push", (event) => {
  let data = null;
  try {
    data = event.data ? event.data.json() : null;
  } catch {
    data = null;
  }
  if (!data) return;

  const actions = Array.isArray(data.actions) ? data.actions : [];
  const scheduledFor = data.scheduledFor;
  const medicationId = data.medicationId;
  const baseUrl = "/dashboard";
  const mk = (action) =>
    `${baseUrl}?notif=1&action=${encodeURIComponent(action)}&medicationId=${encodeURIComponent(
      medicationId,
    )}&scheduledFor=${encodeURIComponent(String(scheduledFor))}`;

  event.waitUntil(
    self.registration.showNotification(data.title || "Capsule", {
      body: data.body || "",
      lang: data.lang || "ar",
      icon: data.icon || "/icons/icon-192.png",
      badge: data.badge || "/icons/icon-192.png",
      actions: actions,
      data: {
        url: baseUrl,
        actionUrls: {
          taken: mk("taken"),
          missed: mk("missed"),
          snooze15: mk("snooze15"),
        },
      },
      requireInteraction: true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const url =
    (event.action && data.actionUrls && data.actionUrls[event.action]) ||
    data.url ||
    "/dashboard";
  event.waitUntil(self.clients.openWindow(url));
});

