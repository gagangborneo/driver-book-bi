/**
 * WhatsApp Notification Utility
 * Handles sending notifications to WhatsApp groups via WACenter API
 * Templates are fetched from the database (admin-editable).
 * Falls back to hardcoded defaults if no DB template is found.
 */

import { db } from '@/lib/db';
import { formatTemplate } from '@/lib/whatsapp-templates';

/**
 * Get WhatsApp configuration from database
 */
async function getWhatsAppConfig() {
  try {
    const config = await db.whatsAppConfig.findFirst();
    if (!config || !config.isActive) {
      console.warn('WhatsApp is not configured or not active');
      return null;
    }
    return config;
  } catch (error) {
    console.error('Error fetching WhatsApp config:', error);
    return null;
  }
}

/**
 * Send notification to WhatsApp group
 * @param message - The message to send
 * @param group - Group identifier (default: 'WAGDriver')
 * @param deviceId - Device ID for WACenter API (optional, will use DB config if not provided)
 */
export async function sendWhatsAppGroupNotification(
  message: string,
  group: string = 'WAGDriver',
  deviceId?: string
): Promise<boolean> {
  try {
    // Use provided device ID, or fetch from database config
    let finalDeviceId = deviceId;
    
    if (!finalDeviceId) {
      const config = await getWhatsAppConfig();
      if (!config) {
        console.error('WhatsApp configuration not available');
        return false;
      }
      finalDeviceId = config.deviceId;
    }

    const encodedMessage = encodeURIComponent(message);
    const url = `https://app.whacenter.com/api/sendGroup?group=${group}&message=${encodedMessage}&device_id=${finalDeviceId}`;

    console.log('Sending WhatsApp notification to group:', group);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`WhatsApp notification error: ${response.status} ${response.statusText}`);
      console.error('URL:', url);
      return false;
    }

    const data = await response.json();
    console.log('WhatsApp notification sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
    return false;
  }
}

/**
 * Format phone number to international format for wa.me/ link
 * e.g., 085175446620 -> 6285175446620
 */
function formatPhoneForWaLink(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Fetch an active WhatsApp template from the database by type.
 * Returns null if not found or inactive.
 */
async function getWhatsAppTemplate(type: string): Promise<string | null> {
  try {
    const template = await db.whatsAppTemplate.findFirst({
      where: { type, isActive: true },
    });
    return template?.content || null;
  } catch (error) {
    console.error(`Error fetching WhatsApp template (${type}):`, error);
    return null;
  }
}

// ─── Default hardcoded templates (fallback when no DB template exists) ───

const DEFAULT_TEMPLATES = {
  BOOKING: `🚗 Pesanan Driver Baru Masuk!

📍 Jemput: {pickupLocation}
📍 Tujuan: {destination}
⏰ Waktu: {bookingTime}
👤 Pemesan: {employeeName}
📞 HP: {employeePhone} ({waLink})

Segera cek aplikasi: {appUrl}`,

  ACCEPTED: `✅ Pesanan Diterima!

Driver: {driverName}

Periksa aplikasi untuk memantau perjalanan: {appUrl}`,

  COMPLETED: `✅ Perjalanan Selesai!

Driver: {driverName}

📍 Dari: {pickupLocation}
📍 Ke: {destination}

Silakan berikan rating di aplikasi: {appUrl}`,

  JOURNEY_COMPLETED: `🎉 Perjalanan Selesai!

Driver: {driverName}
📍 Dari: {pickupLocation}
📍 Ke: {destination}`,
};

/**
 * Build booking notification message (uses DB template or default)
 */
export async function buildBookingNotificationMessage(
  pickupLocation: string,
  destination: string,
  bookingTime: string,
  employeeName?: string,
  employeePhone?: string,
  appUrl: string = 'https://lamin-bpp.web.id/'
): Promise<string> {
  const waLink = employeePhone ? `https://wa.me/${formatPhoneForWaLink(employeePhone)}` : '-';

  const variables: Record<string, string> = {
    pickupLocation,
    destination,
    bookingTime,
    employeeName: employeeName || '-',
    employeePhone: employeePhone || '-',
    waLink,
    appUrl,
  };

  const dbTemplate = await getWhatsAppTemplate('BOOKING');
  const template = dbTemplate || DEFAULT_TEMPLATES.BOOKING;
  return formatTemplate(template, variables);
}

/**
 * Send notification to individual WhatsApp number
 * @param phoneNumber - Phone number with country code (e.g., 628125144744)
 * @param message - The message to send
 * @param deviceId - Device ID for WACenter API (optional, will use DB config if not provided)
 */
export async function sendWhatsAppToNumber(
  phoneNumber: string,
  message: string,
  deviceId?: string
): Promise<boolean> {
  try {
    // Use provided device ID, or fetch from database config
    let finalDeviceId = deviceId;
    
    if (!finalDeviceId) {
      const config = await getWhatsAppConfig();
      if (!config) {
        console.error('WhatsApp configuration not available');
        return false;
      }
      finalDeviceId = config.deviceId;
    }

    const encodedMessage = encodeURIComponent(message);
    const url = `https://app.whacenter.com/api/send?device_id=${finalDeviceId}&number=${phoneNumber}&message=${encodedMessage}`;

    console.log('Sending WhatsApp message to individual:', phoneNumber);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`WhatsApp individual message error: ${response.status} ${response.statusText}`);
      console.error('URL:', url);
      return false;
    }

    const data = await response.json();
    console.log('WhatsApp message sent to individual successfully:', data);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message to individual:', error);
    return false;
  }
}

/**
 * Send booking notification to WhatsApp group
 */
export async function notifyNewBooking(
  pickupLocation: string,
  destination: string,
  bookingTime: string,
  employeeName?: string,
  employeePhone?: string
): Promise<boolean> {
  const message = await buildBookingNotificationMessage(pickupLocation, destination, bookingTime, employeeName, employeePhone);
  return sendWhatsAppGroupNotification(message);
}

/**
 * Build booking accepted message (uses DB template or default)
 */
export async function buildBookingAcceptedMessage(
  driverName: string,
  appUrl: string = 'https://lamin-bpp.web.id/'
): Promise<string> {
  const variables: Record<string, string> = { driverName, appUrl };
  const dbTemplate = await getWhatsAppTemplate('ACCEPTED');
  const template = dbTemplate || DEFAULT_TEMPLATES.ACCEPTED;
  return formatTemplate(template, variables);
}

/**
 * Send booking accepted notification to employee
 */
export async function notifyBookingAccepted(
  phoneNumber: string,
  driverName: string
): Promise<boolean> {
  if (!phoneNumber) {
    console.warn('Employee phone number not available, skipping WhatsApp notification');
    return false;
  }

  const message = await buildBookingAcceptedMessage(driverName);
  return sendWhatsAppToNumber(phoneNumber, message);
}

/**
 * Build booking completed message (uses DB template or default)
 */
export async function buildBookingCompletedMessage(
  driverName: string,
  pickupLocation: string,
  destination: string,
  appUrl: string = 'https://lamin-bpp.web.id/'
): Promise<string> {
  const variables: Record<string, string> = { driverName, pickupLocation, destination, appUrl };
  const dbTemplate = await getWhatsAppTemplate('COMPLETED');
  const template = dbTemplate || DEFAULT_TEMPLATES.COMPLETED;
  return formatTemplate(template, variables);
}

/**
 * Send booking completed notification to employee
 */
export async function notifyBookingCompleted(
  phoneNumber: string,
  driverName: string,
  pickupLocation: string,
  destination: string
): Promise<boolean> {
  if (!phoneNumber) {
    console.warn('Employee phone number not available, skipping WhatsApp notification');
    return false;
  }

  const message = await buildBookingCompletedMessage(driverName, pickupLocation, destination);
  return sendWhatsAppToNumber(phoneNumber, message);
}

/**
 * Send journey completion notification to WhatsApp group (uses DB template or default)
 */
export async function notifyJourneyCompleted(
  driverName: string,
  pickupLocation: string,
  destination: string
): Promise<boolean> {
  const variables: Record<string, string> = { driverName, pickupLocation, destination };
  const dbTemplate = await getWhatsAppTemplate('JOURNEY_COMPLETED');
  const template = dbTemplate || DEFAULT_TEMPLATES.JOURNEY_COMPLETED;
  const message = formatTemplate(template, variables);
  return sendWhatsAppGroupNotification(message);
}
