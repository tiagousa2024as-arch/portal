self.addEventListener("push", function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {}
  var titulo = data.title || "Primeira Geração";
  var corpo = data.body || "";
  event.waitUntil(self.registration.showNotification(titulo, {
    body: corpo,
    lang: "pt-BR",
    tag: data.tag || "portal",
    data: { url: data.url || "/" }
  }));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (lista) {
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].url.indexOf(self.location.origin) === 0 && "focus" in lista[i]) return lista[i].focus();
    }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
