// Firebase Client SDK Configuration
import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDr4Q1P3UE2G5LZzTVTKGSPUOPZ7PKSCac",
  authDomain: "driver-bi.firebaseapp.com",
  projectId: "driver-bi",
  storageBucket: "driver-bi.firebasestorage.app",
  messagingSenderId: "122328066785",
  appId: "1:122328066785:web:09e820d2af86f74d22a5a0",
  measurementId: "G-VHZE44FERT",
};

// Initialize Firebase App (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Get messaging instance (only in browser)
let messaging: Messaging | null = null;

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;
  
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn("Firebase Messaging is not supported in this browser");
      return null;
    }
    
    if (!messaging) {
      messaging = getMessaging(app);
    }
    return messaging;
  } catch (error) {
    console.warn("Failed to initialize Firebase Messaging:", error);
    return null;
  }
}

// Request notification permission and get FCM token
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    if (typeof window === "undefined") return null;
    
    // Check if Notification API is available
    if (!("Notification" in window)) {
      console.warn("Notification API not available");
      return null;
    }

    // Request permission if not already granted
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }
    
    if (permission !== "granted") {
      console.log("Notification permission:", permission);
      return null;
    }

    const messagingInstance = await getFirebaseMessaging();
    if (!messagingInstance) return null;

    // Register the Firebase messaging service worker
    let registration: ServiceWorkerRegistration;
    try {
      registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
    } catch (swError) {
      console.error("Service worker registration failed:", swError);
      return null;
    }

    // Get the VAPID key
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn("NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set. FCM token cannot be generated.");
      return null;
    }
    
    const token = await getToken(messagingInstance, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log("FCM Token obtained successfully");
      return token;
    } else {
      console.warn("No FCM token available");
      return null;
    }
  } catch (error) {
    console.error("Error getting notification permission:", error);
    return null;
  }
}

// Listen for foreground messages
export function onForegroundMessage(callback: (payload: unknown) => void) {
  getFirebaseMessaging().then((messagingInstance) => {
    if (messagingInstance) {
      onMessage(messagingInstance, (payload) => {
        console.log("Foreground message received:", payload);
        callback(payload);
      });
    }
  }).catch((error) => {
    console.warn("Failed to setup foreground message listener:", error);
  });
}

export { app };
