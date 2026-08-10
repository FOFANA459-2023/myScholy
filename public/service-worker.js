// Kill switch. This site does not use a service worker, but an older
// deployment may have registered one at this path (create-react-app's
// default). Browsers re-fetch the registered script from the network on
// navigation (bypassing the worker), so any browser still running a stale
// worker picks this up, which unregisters it, clears every cache it left
// behind, and reloads the open tabs onto the live site.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const windows = await self.clients.matchAll({ type: "window" });
      windows.forEach((client) => client.navigate(client.url));
    })(),
  );
});
