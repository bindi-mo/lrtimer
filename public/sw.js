// Debug Service Worker for LR Timer (temporary)
// This minimal SW logs install/activate/push and shows a basic notification.

self.addEventListener('install', (event) => {
  console.log('[sw-debug] install');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[sw-debug] activate');
  self.clients.claim();
});

self.addEventListener('push', (event) => {
  console.log('[sw-debug] push event received', event);
  let payload = '';
  try {
    payload = event.data ? (event.data.text ? event.data.text() : event.data.json()) : '';
  } catch (e) {
    payload = '[sw-debug] failed to parse payload';
  }
  const title = 'LR Timer (debug)';
  const options = {
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
    tag: 'lrtimer-debug',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  console.log('[sw-debug] notificationclick', event.notification && event.notification.data);
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

self.addEventListener('fetch', (event) => {
  // pass-through fetch behavior to avoid interfering with app
  return;
});

// Push イベントハンドラ：サーバから送られた Push を受け取り、通知を表示
self.addEventListener('push', (event) => {
  console.log('[sw] push event received', event);
  let data = {};
  try {
    if (event.data) {
      try {
        data = event.data.json();
      } catch (e) {
        // event.data.text() は Promise-like in some browsers
        if (event.data.text) {
          data = { body: event.data.text() };
        } else {
          data = { body: String(event.data) };
        }
      }
    }
  } catch (e) {
    data = { body: event.data ? event.data.text() : '通知が届きました' };
  }
  console.log('[sw] push payload', data);
  const title = data.title || 'LR Timer';
  const options = {
    body: data.body || 'タイマーの通知です',
    data: data,
    // icon: '/icons/icon-192.png', // optional
    tag: data.tag || 'lrtimer-notification',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// 通知クリックでクライアントをフォーカスまたは新規タブで開く
self.addEventListener('notificationclick', (event) => {
  console.log('[sw] notificationclick', event.notification && event.notification.data);
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
