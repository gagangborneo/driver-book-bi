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
  
  const supported = await isSupported();
  if (!supported) {
    console.warn("Firebase Messaging is not supported in this browser");
    return null;
  }
  
  if (!messaging) {
    messaging = getMessaging(app);
  }
  return messaging;
}

// Request notification permission and get FCM token
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    const messagingInstance = await getFirebaseMessaging();
    if (!messagingInstance) return null;

    // Register service worker first
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    
    const token = await getToken(messagingInstance, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "",
      serviceWorkerRegistration: registration,
    });

    console.log("FCM Token:", token);
    return token;
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
  });
}

export { app };
