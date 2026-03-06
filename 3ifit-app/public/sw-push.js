/* Push notification handler - loaded by service worker via importScripts */
self.addEventListener("push", function (event) {
  var data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(data.title || "3iFit", {
      body: data.body || "",
      icon: data.icon || "/icons/icon-192.png",
    })
  );
});
