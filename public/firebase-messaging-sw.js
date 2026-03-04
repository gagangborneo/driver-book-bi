// Firebase Cloud Messaging Service Worker
// This file MUST be at the root of /public for Firebase Messaging to work

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDr4Q1P3UE2G5LZzTVTKGSPUOPZ7PKSCac",
  authDomain: "driver-bi.firebaseapp.com",
  projectId: "driver-bi",
  storageBucket: "driver-bi.firebasestorage.app",
  messagingSenderId: "122328066785",
  appId: "1:122328066785:web:09e820d2af86f74d22a5a0",
  measurementId: "G-VHZE44FERT",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background message:", payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || "SI-LAMIN";
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || "Notifikasi baru dari SI-LAMIN",
    icon: "/logo-si-lamin.png",
    badge: "/favicon.png",
    vibrate: [200, 100, 200],
    data: {
      url: payload.data?.url || "/",
      ...payload.data,
    },
    tag: payload.data?.tag || "si-lamin-notification",
    renotify: true,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  const url = event.notification.data?.url || "/";
  
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open a new window
      return clients.openWindow(url);
    })
  );
});
