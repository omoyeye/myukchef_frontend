/* Added to the app's service worker: shows push notifications and opens the right page when tapped. */
self.addEventListener("push", (event) => {
    let notice = { title: "MYUKCHEF", body: "You have an update.", url: "/" };
    try {
        notice = { ...notice, ...event.data.json() };
    } catch {
        // Show the default text if a message can't be read.
    }
    event.waitUntil(self.registration.showNotification(notice.title, {
        body: notice.body,
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        data: { url: notice.url },
    }));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    // Only ever opens a page on this site.
    const target = new URL(event.notification.data?.url || "/", self.location.origin);
    const url = target.origin === self.location.origin ? target.href : self.location.origin;
    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
            const open = windows.find((w) => w.url === url && "focus" in w);
            return open ? open.focus() : self.clients.openWindow(url);
        }),
    );
});
