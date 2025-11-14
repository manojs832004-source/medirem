
self.addEventListener('push', function(event) {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192x192.png', // Add an icon for notifications
    badge: '/badge-72x72.png', // Add a badge
    vibrate: [200, 100, 200], // Vibration pattern
    sound: data.sound // This is where the magic will happen
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
