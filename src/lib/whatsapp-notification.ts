/**
 * WhatsApp Notification Utility
 * Handles sending notifications to WhatsApp groups via WACenter API
 */

interface SendWhatsAppGroupParams {
  message: string;
  group?: string;
  deviceId?: string;
}

/**
 * Send notification to WhatsApp group
 * @param message - The message to send
 * @param group - Group identifier (default: 'WAGDriver')
 * @param deviceId - Device ID for WACenter API (from env)
 */
export async function sendWhatsAppGroupNotification(
  message: string,
  group: string = 'WAGDriver',
  deviceId: string = process.env.WHATSAPP_DEVICE_ID || 'e6683d05a9bfa0f2ca6087857cff17ed'
): Promise<boolean> {
  try {
    const encodedMessage = encodeURIComponent(message);
    const url = `https://app.whacenter.com/api/sendGroup?group=${group}&message=${encodedMessage}&device_id=${deviceId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`WhatsApp notification error: ${response.status} ${response.statusText}`);
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
 * Build booking notification message
 */
export function buildBookingNotificationMessage(
  pickupLocation: string,
  destination: string,
  bookingTime: string,
  appUrl: string = 'https://lamin-bpp.web.id/'
): string {
  return `🚗 Pesanan Driver Baru Masuk!

📍 Jemput: ${pickupLocation}
📍 Tujuan: ${destination}
⏰ Waktu: ${bookingTime}

Segera cek aplikasi: ${appUrl}`;
}

/**
 * Send notification to individual WhatsApp number
 * @param phoneNumber - Phone number with country code (e.g., 628125144744)
 * @param message - The message to send
 * @param deviceId - Device ID for WACenter API (from env)
 */
export async function sendWhatsAppToNumber(
  phoneNumber: string,
  message: string,
  deviceId: string = process.env.WHATSAPP_DEVICE_ID || 'e6683d05a9bfa0f2ca6087857cff17ed'
): Promise<boolean> {
  try {
    const encodedMessage = encodeURIComponent(message);
    const url = `https://app.whacenter.com/api/send?device_id=${deviceId}&number=${phoneNumber}&message=${encodedMessage}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`WhatsApp individual message error: ${response.status} ${response.statusText}`);
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
  bookingTime: string
): Promise<boolean> {
  const message = buildBookingNotificationMessage(pickupLocation, destination, bookingTime);
  return sendWhatsAppGroupNotification(message);
}

/**
 * Build booking accepted message
 */
export function buildBookingAcceptedMessage(
  driverName: string,
  appUrl: string = 'https://lamin-bpp.web.id/'
): string {
  return `✅ Pesanan Diterima!

Driver: ${driverName}

Periksa aplikasi untuk memantau perjalanan: ${appUrl}`;
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

  const message = buildBookingAcceptedMessage(driverName);
  return sendWhatsAppToNumber(phoneNumber, message);
}

/**
 * Build booking completed message
 */
export function buildBookingCompletedMessage(
  driverName: string,
  pickupLocation: string,
  destination: string,
  appUrl: string = 'https://lamin-bpp.web.id/'
): string {
  return `✅ Perjalanan Selesai!

Driver: ${driverName}

📍 Dari: ${pickupLocation}
📍 Ke: ${destination}

Silakan berikan rating di aplikasi: ${appUrl}`;
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

  const message = buildBookingCompletedMessage(driverName, pickupLocation, destination);
  return sendWhatsAppToNumber(phoneNumber, message);
}

/**
 * Send journey completion notification to WhatsApp group
 */
export async function notifyJourneyCompleted(
  driverName: string,
  pickupLocation: string,
  destination: string
): Promise<boolean> {
  const message = `🎉 Perjalanan Selesai!

Driver: ${driverName}
📍 Dari: ${pickupLocation}
📍 Ke: ${destination}`;
  
  return sendWhatsAppGroupNotification(message);
}
