// debug-sw.js - minimal debug Service Worker
self.addEventListener('install', (event) => {
  console.log('[debug-sw] install');
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  console.log('[debug-sw] activate');
  self.clients.claim();
});
self.addEventListener('push', (event) => {
  console.log('[debug-sw] push event received', event);
  let payload = '';
  try {
    if (event.data) {
      if (event.data.json) payload = event.data.json();
      else if (event.data.text) payload = event.data.text();
      else payload = event.data;
    }
  } catch (e) {
    payload = '[debug-sw] failed to parse payload';
  }
  const title = payload?.title || 'LR Timer (debug)';
  const options = {
    body: payload?.body || (typeof payload === 'string' ? payload : JSON.stringify(payload)),
    tag: 'lrtimer-debug',
    data: payload,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
self.addEventListener('notificationclick', (event) => {
  console.log('[debug-sw] notificationclick', event.notification && event.notification.data);
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
// no fetch handling - pass-through
