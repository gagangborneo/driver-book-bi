"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { requestNotificationPermission, onForegroundMessage } from "@/lib/firebase";
import { api } from "@/lib/api";
import { toast } from "sonner";

/**
 * PushNotificationProvider
 * 
 * Place this component in the protected layout to auto-register
 * FCM tokens when push notifications are enabled.
 * It checks push notification status, requests permission,
 * registers FCM token, and listens for foreground messages.
 */
export function PushNotificationProvider() {
  const { token: authToken, user, isAuthenticated } = useAuthStore();
  const registeredRef = useRef(false);
  const fcmTokenRef = useRef<string | null>(null);

  const registerToken = useCallback(async () => {
    if (!authToken || !isAuthenticated || !user || registeredRef.current) return;

    try {
      // Check if push notifications are enabled
      const statusRes = await api("/push-notification/status", {}, authToken);
      if (!statusRes.isActive) {
        return; // Push notifications disabled by admin
      }

      // Check browser support
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        return;
      }

      // Request permission and get FCM token
      const fcmToken = await requestNotificationPermission();
      if (!fcmToken) {
        return; // User denied or error
      }

      fcmTokenRef.current = fcmToken;

      // Register token with backend
      await api("/push-notification/token", {
        method: "POST",
        body: JSON.stringify({
          token: fcmToken,
          device: `${navigator.userAgent.substring(0, 100)}`,
        }),
      }, authToken);

      registeredRef.current = true;
      console.log("FCM token registered successfully");
    } catch (error) {
      console.error("Failed to register FCM token:", error);
    }
  }, [authToken, isAuthenticated, user]);

  // Register on mount / auth change
  useEffect(() => {
    // Small delay to ensure auth is ready
    const timer = setTimeout(() => {
      registerToken();
    }, 2000);

    return () => clearTimeout(timer);
  }, [registerToken]);

  // Listen for foreground messages
  useEffect(() => {
    if (!isAuthenticated) return;

    onForegroundMessage((payload: unknown) => {
      const data = payload as {
        notification?: { title?: string; body?: string };
        data?: { title?: string; body?: string; url?: string };
      };

      const title = data?.notification?.title || data?.data?.title || "SI-LAMIN";
      const body = data?.notification?.body || data?.data?.body || "Notifikasi baru";

      // Show toast notification for foreground messages
      toast(title, {
        description: body,
        duration: 8000,
        action: data?.data?.url
          ? {
              label: "Lihat",
              onClick: () => {
                window.location.href = data.data!.url!;
              },
            }
          : undefined,
      });

      // Also show browser notification if page is visible but user might miss toast
      if (document.visibilityState === "visible" && Notification.permission === "granted") {
        const notification = new Notification(title, {
          body,
          icon: "/logo-si-lamin.png",
          badge: "/favicon.png",
          tag: "si-lamin-foreground",
        });

        notification.onclick = () => {
          window.focus();
          if (data?.data?.url) {
            window.location.href = data.data.url;
          }
          notification.close();
        };
      }
    });
  }, [isAuthenticated]);

  return null;
}
