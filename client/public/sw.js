self.addEventListener('push', function(event) {
  if (!event.data) {
    console.log('[Service Worker] Push event had no data.');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[Service Worker] Push received:', data);

    const title = data.title || 'PrintExpress Alert';
    const options = {
      body: data.body || 'Your order status has been updated!',
      icon: '/next.svg',
      badge: '/next.svg',
      tag: 'order-status',
      data: {
        url: data.url || '/dashboard'
      }
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('[Service Worker] Error parsing push data:', error);
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      // Focus existing open dashboard tab
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes('/dashboard') && 'focus' in client) {
          client.navigate(event.notification.data.url);
          return client.focus();
        }
      }
      // Or open a new tab
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});
