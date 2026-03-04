// Push Notification Service using Firebase Cloud Messaging
import admin from "@/lib/firebase-admin";
import { db } from "@/lib/db";

// Types for notification templates
export type NotificationType = "NEW_BOOKING" | "BOOKING_ACCEPTED" | "BOOKING_COMPLETED";

interface NotificationData {
  employee_name?: string;
  driver_name?: string;
  pickup?: string;
  destination?: string;
  time?: string;
  booking_id?: string;
}

// Replace placeholders in template string
function replacePlaceholders(template: string, data: NotificationData): string {
  let result = template;
  if (data.employee_name) result = result.replace(/{employee_name}/g, data.employee_name);
  if (data.driver_name) result = result.replace(/{driver_name}/g, data.driver_name);
  if (data.pickup) result = result.replace(/{pickup}/g, data.pickup);
  if (data.destination) result = result.replace(/{destination}/g, data.destination);
  if (data.time) result = result.replace(/{time}/g, data.time);
  if (data.booking_id) result = result.replace(/{booking_id}/g, data.booking_id);
  return result;
}

// Check if push notification is enabled
export async function isPushNotificationEnabled(): Promise<boolean> {
  try {
    const config = await db.pushNotificationConfig.findFirst();
    return config?.isActive ?? false;
  } catch {
    return false;
  }
}

// Get notification template by type
async function getTemplate(type: NotificationType) {
  try {
    const template = await db.pushNotificationTemplate.findFirst({
      where: { type, isActive: true },
    });
    return template;
  } catch {
    return null;
  }
}

// Default templates (fallback)
const DEFAULT_TEMPLATES: Record<NotificationType, { title: string; body: string }> = {
  NEW_BOOKING: {
    title: "📋 Pesanan Baru!",
    body: "{employee_name} memesan perjalanan dari {pickup} ke {destination} pukul {time}. Segera terima pesanan!",
  },
  BOOKING_ACCEPTED: {
    title: "✅ Driver Menerima Pesanan",
    body: "Driver {driver_name} telah menerima pesanan perjalanan Anda dari {pickup} ke {destination}.",
  },
  BOOKING_COMPLETED: {
    title: "🏁 Perjalanan Selesai",
    body: "Perjalanan Anda dari {pickup} ke {destination} bersama {driver_name} telah selesai. Silakan beri rating perjalanan Anda.",
  },
};

// Send push notification to specific user tokens
async function sendToTokens(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: number; failure: number; invalidTokens: string[] }> {
  if (tokens.length === 0) {
    return { success: 0, failure: 0, invalidTokens: [] };
  }

  const invalidTokens: string[] = [];
  let successCount = 0;
  let failureCount = 0;

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        title,
        body,
        click_action: data?.url || "/",
        tag: data?.tag || "si-lamin-notification",
      },
      webpush: {
        notification: {
          title,
          body,
          icon: "/logo-si-lamin.png",
          badge: "/favicon.png",
          vibrate: [200, 100, 200] as unknown as number[],
        },
        fcmOptions: {
          link: data?.url || "/",
        },
      },
    };

    // Send to each token individually to track which ones fail
    for (const token of tokens) {
      try {
        await admin.messaging().send({
          ...message,
          token,
        });
        successCount++;
      } catch (error: unknown) {
        failureCount++;
        const errorCode = (error as { code?: string })?.code;
        // Check if token is invalid/expired
        if (
          errorCode === "messaging/invalid-registration-token" ||
          errorCode === "messaging/registration-token-not-registered"
        ) {
          invalidTokens.push(token);
        }
        console.error(`Failed to send to token ${token.substring(0, 20)}...:`, errorCode);
      }
    }

    // Clean up invalid tokens
    if (invalidTokens.length > 0) {
      await db.fCMToken.deleteMany({
        where: { token: { in: invalidTokens } },
      });
      console.log(`Cleaned up ${invalidTokens.length} invalid FCM tokens`);
    }
  } catch (error) {
    console.error("Error sending push notifications:", error);
  }

  return { success: successCount, failure: failureCount, invalidTokens };
}

// 1. Notify all available drivers about a new booking
export async function pushNotifyNewBooking(data: NotificationData): Promise<void> {
  const enabled = await isPushNotificationEnabled();
  if (!enabled) return;

  const template = await getTemplate("NEW_BOOKING");
  const title = template
    ? replacePlaceholders(template.title, data)
    : replacePlaceholders(DEFAULT_TEMPLATES.NEW_BOOKING.title, data);
  const body = template
    ? replacePlaceholders(template.body, data)
    : replacePlaceholders(DEFAULT_TEMPLATES.NEW_BOOKING.body, data);

  // Get FCM tokens for all available drivers
  const availableDriverTokens = await db.fCMToken.findMany({
    where: {
      user: {
        role: "DRIVER",
        isActive: true,
        driverStatus: "AVAILABLE",
      },
    },
    select: { token: true },
  });

  const tokens = availableDriverTokens.map((t) => t.token);
  
  if (tokens.length > 0) {
    const result = await sendToTokens(tokens, title, body, {
      type: "NEW_BOOKING",
      url: "/driver",
      booking_id: data.booking_id || "",
      tag: "new-booking",
    });
    console.log(`Push notification NEW_BOOKING sent: ${result.success} success, ${result.failure} failed`);
  }
}

// 2. Notify employee that driver accepted booking
export async function pushNotifyBookingAccepted(
  employeeId: string,
  data: NotificationData
): Promise<void> {
  const enabled = await isPushNotificationEnabled();
  if (!enabled) return;

  const template = await getTemplate("BOOKING_ACCEPTED");
  const title = template
    ? replacePlaceholders(template.title, data)
    : replacePlaceholders(DEFAULT_TEMPLATES.BOOKING_ACCEPTED.title, data);
  const body = template
    ? replacePlaceholders(template.body, data)
    : replacePlaceholders(DEFAULT_TEMPLATES.BOOKING_ACCEPTED.body, data);

  // Get FCM tokens for the employee
  const employeeTokens = await db.fCMToken.findMany({
    where: { userId: employeeId },
    select: { token: true },
  });

  const tokens = employeeTokens.map((t) => t.token);

  if (tokens.length > 0) {
    const result = await sendToTokens(tokens, title, body, {
      type: "BOOKING_ACCEPTED",
      url: "/employee",
      booking_id: data.booking_id || "",
      tag: "booking-accepted",
    });
    console.log(`Push notification BOOKING_ACCEPTED sent to employee: ${result.success} success, ${result.failure} failed`);
  }
}

// 3. Notify employee that trip is completed
export async function pushNotifyBookingCompleted(
  employeeId: string,
  data: NotificationData
): Promise<void> {
  const enabled = await isPushNotificationEnabled();
  if (!enabled) return;

  const template = await getTemplate("BOOKING_COMPLETED");
  const title = template
    ? replacePlaceholders(template.title, data)
    : replacePlaceholders(DEFAULT_TEMPLATES.BOOKING_COMPLETED.title, data);
  const body = template
    ? replacePlaceholders(template.body, data)
    : replacePlaceholders(DEFAULT_TEMPLATES.BOOKING_COMPLETED.body, data);

  // Get FCM tokens for the employee
  const employeeTokens = await db.fCMToken.findMany({
    where: { userId: employeeId },
    select: { token: true },
  });

  const tokens = employeeTokens.map((t) => t.token);

  if (tokens.length > 0) {
    const result = await sendToTokens(tokens, title, body, {
      type: "BOOKING_COMPLETED",
      url: "/employee",
      booking_id: data.booking_id || "",
      tag: "booking-completed",
    });
    console.log(`Push notification BOOKING_COMPLETED sent to employee: ${result.success} success, ${result.failure} failed`);
  }
}
