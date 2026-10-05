/* sw-marketing.js
   Service Worker base para Web Push de Comanda / Marketing.
   Este archivo no envía notificaciones por sí mismo: recibe los Push
   enviados por el servidor y los muestra en el dispositivo.
*/

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", event => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {
      title: "Tuttovinilos · Marketing",
      body: event.data ? event.data.text() : "Tienes un recordatorio pendiente."
    };
  }

  const title = data.title || "Tuttovinilos · Marketing";
  const options = {
    body: data.body || "Tienes un recordatorio pendiente.",
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-192.png",
    tag: data.tag || "comanda-marketing",
    renotify: true,
    data: {
      url: data.url || "/marketing.html",
      id: data.id || null
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  const targetUrl = event.notification?.data?.url || "/marketing.html";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then(clientList => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
