"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, X } from "lucide-react";
import { hasCookieConsent } from "@/components/cookie-consent";

const PUSH_NOTIFICATION_DISMISSED_KEY = "si-lamin-push-notif-dismissed";
const PUSH_NOTIFICATION_TOKEN_KEY = "si-lamin-fcm-token";

/**
 * PushNotificationProvider
 * 
 * Auto-registers FCM tokens when push notifications are enabled.
 * Shows a permission prompt to the user if not yet granted.
 * Listens for foreground messages and shows toast + browser notification.
 */
export function PushNotificationProvider() {
  const { token: authToken, user, isAuthenticated } = useAuthStore();
  const registeredRef = useRef(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  // Check if push notifications are enabled by admin
  const checkPushStatus = useCallback(async () => {
    if (!authToken || !isAuthenticated) return false;
    try {
      const res = await api("/push-notification/status", {}, authToken);
      return res.isActive === true;
    } catch {
      return false;
    }
  }, [authToken, isAuthenticated]);

  // Actually register the FCM token
  const doRegisterToken = useCallback(async () => {
    try {
      // Dynamically import Firebase to avoid SSR issues
      const { requestNotificationPermission, onForegroundMessage } = await import("@/lib/firebase");
      
      const fcmToken = await requestNotificationPermission();
      if (!fcmToken) {
        console.log("Could not get FCM token");
        return;
      }

      // Save token locally to detect changes
      const previousToken = localStorage.getItem(PUSH_NOTIFICATION_TOKEN_KEY);
      if (previousToken === fcmToken && registeredRef.current) {
        return; // Already registered this exact token
      }

      // Register with backend
      await api("/push-notification/token", {
        method: "POST",
        body: JSON.stringify({
          token: fcmToken,
          device: navigator.userAgent.substring(0, 200),
        }),
      }, authToken!);

      localStorage.setItem(PUSH_NOTIFICATION_TOKEN_KEY, fcmToken);
      registeredRef.current = true;
      console.log("FCM token registered successfully");

      // Setup foreground message listener
      onForegroundMessage((payload: unknown) => {
        const data = payload as {
          notification?: { title?: string; body?: string };
          data?: { title?: string; body?: string; url?: string };
        };

        const title = data?.notification?.title || data?.data?.title || "SI-LAMIN";
        const body = data?.notification?.body || data?.data?.body || "Notifikasi baru";

        // Show toast
        toast(title, {
          description: body,
          duration: 8000,
          action: data?.data?.url
            ? {
                label: "Lihat",
                onClick: () => { window.location.href = data.data!.url!; },
              }
            : undefined,
        });
      });

    } catch (error) {
      console.error("Failed to register FCM token:", error);
      // Don't show error to user - fail silently
    }
  }, [authToken]);

  // Register FCM token with the backend
  const registerFCMToken = useCallback(async () => {
    if (!authToken || !isAuthenticated || !user || registeredRef.current) return;
    
    try {
      // Check browser support
      if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
        console.log("Push notifications not supported in this browser");
        return;
      }

      // Check cookie consent
      if (!hasCookieConsent()) {
        console.log("Cookie consent not given, skipping FCM registration");
        return;
      }

      // Check current permission
      if (Notification.permission === "denied") {
        console.log("Notification permission denied by user");
        return;
      }

      if (Notification.permission !== "granted") {
        // Check if user dismissed the prompt before
        const dismissed = localStorage.getItem(PUSH_NOTIFICATION_DISMISSED_KEY);
        if (dismissed) {
          const dismissedDate = new Date(dismissed);
          const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceDismissed < 7) {
            return; // Don't show prompt again within 7 days
          }
        }
        
        // Show custom prompt instead of immediately requesting permission
        setShowPrompt(true);
        return;
      }

      // Permission already granted - register the token
      await doRegisterToken();
    } catch (error) {
      console.error("Failed to setup push notifications:", error);
    }
  }, [authToken, isAuthenticated, user, doRegisterToken]);

  // Handle user accepting notification permission
  const handleAcceptNotification = async () => {
    setShowPrompt(false);
    localStorage.removeItem(PUSH_NOTIFICATION_DISMISSED_KEY);
    
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        await doRegisterToken();
        toast.success("Notifikasi push berhasil diaktifkan!");
      } else {
        toast.info("Izin notifikasi ditolak. Anda bisa mengaktifkannya di pengaturan browser.");
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  // Handle user dismissing the prompt
  const handleDismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem(PUSH_NOTIFICATION_DISMISSED_KEY, new Date().toISOString());
  };

  // Main effect - check status and register
  useEffect(() => {
    if (!authToken || !isAuthenticated || !user) return;

    const timer = setTimeout(async () => {
      const enabled = await checkPushStatus();
      setPushEnabled(enabled);
      if (enabled) {
        await registerFCMToken();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [authToken, isAuthenticated, user, checkPushStatus, registerFCMToken]);

  // Notification Permission Prompt
  if (showPrompt && pushEnabled) {
    return (
      <div className="fixed top-4 right-4 z-100 animate-in slide-in-from-right duration-500 max-w-sm">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 shrink-0">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                Aktifkan Notifikasi?
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Dapatkan notifikasi push untuk pesanan baru, update status perjalanan, dan informasi penting lainnya.
              </p>
            </div>
            <button onClick={handleDismissPrompt} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3 ml-13">
            <Button size="sm" onClick={handleAcceptNotification} className="text-xs h-8">
              <Bell className="h-3.5 w-3.5 mr-1.5" />
              Aktifkan
            </Button>
            <Button size="sm" variant="outline" onClick={handleDismissPrompt} className="text-xs h-8">
              <BellOff className="h-3.5 w-3.5 mr-1.5" />
              Nanti Saja
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
