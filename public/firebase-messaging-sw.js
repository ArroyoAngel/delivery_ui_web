// Service Worker para Firebase Cloud Messaging (background notifications)
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// La config se pasa desde el cliente al registrar el SW vía postMessage,
// pero FCM compat también la lee del manifest si está disponible.
// Por simplicidad la definimos aquí — en producción usar una variable de entorno
// inyectada en el build o recibirla vía postMessage.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebase.initializeApp(event.data.config);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const { title, body } = payload.notification ?? {};
      self.registration.showNotification(title ?? 'YaYa Eats', {
        body: body ?? '',
        icon: '/icons/Icon-192.png',
        badge: '/icons/Icon-192.png',
        data: payload.data ?? {},
      });
    });
  }
});
