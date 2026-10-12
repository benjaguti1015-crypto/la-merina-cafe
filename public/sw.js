// Service worker solo para avisos push (no cachea nada).
self.addEventListener("push", (event) => {
  const d = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(d.titulo || "La Merina Café", {
      body: d.texto || "",
      icon: "/icon-192.png",
      badge: "/favicon.png",
      data: { url: d.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data.url;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
      const abierta = ventanas.find((v) => v.url.includes(url));
      return abierta ? abierta.focus() : self.clients.openWindow(url);
    }),
  );
});
