// Push notification handler for 찰칵AI
// This file is automatically bundled into the service worker by next-pwa

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = {
      title: "찰칵AI",
      body: event.data.text(),
      url: "/",
    };
  }

  const title = data.title || "찰칵AI";
  const options = {
    body: data.body || "알림이 도착했습니다",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    data: { url: data.url || "/" },
    vibrate: [200, 100, 200],
    tag: "chalcak-notification",
    renotify: true,
    actions: [
      { action: "open", title: "확인하기" },
      { action: "close", title: "닫기" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  if (event.action === "close") return;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new tab
      return clients.openWindow(url);
    })
  );
});
