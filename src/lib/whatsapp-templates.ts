/**
 * WhatsApp Template Utility
 * Handles message template parsing and variable substitution
 */

interface TemplateVariables {
  [key: string]: string | number;
}

/**
 * Replace placeholders in template with actual values
 * @param template - Message template with placeholders
 * @param variables - Object with variable values
 * @returns - Formatted message
 * 
 * @example
 * const message = formatTemplate(
 *   'Pesanan dari {employeeName} ke {destination}',
 *   { employeeName: 'John', destination: 'Airport' }
 * );
 */
export function formatTemplate(
  template: string,
  variables: TemplateVariables
): string {
  let message = template;

  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    message = message.replace(new RegExp(placeholder, 'g'), String(value));
  });

  return message;
}

/**
 * Get template and format with variables
 * @param templateName - Name of the template
 * @param variables - Variables to replace in template
 * @param templates - Array of available templates
 * @returns - Formatted message or null if template not found
 */
export function getFormattedTemplate(
  templateName: string,
  variables: TemplateVariables,
  templates: Array<{ name: string; content: string }>
): string | null {
  const template = templates.find((t) => t.name === templateName);
  if (!template) {
    console.warn(`Template "${templateName}" not found`);
    return null;
  }

  return formatTemplate(template.content, variables);
}

/**
 * Validate template has required variables
 * @param template - Message template
 * @returns - Array of required placeholder names
 */
export function extractTemplateVariables(template: string): string[] {
  const matches = template.match(/{([^}]+)}/g) || [];
  return matches.map((match) => match.replace(/[{}]/g, ''));
}

/**
 * Check if all required variables are provided
 * @param template - Message template
 * @param variables - Provided variables
 * @returns - Object with status and missing variables
 */
export function validateTemplateVariables(
  template: string,
  variables: TemplateVariables
): { isValid: boolean; missing: string[] } {
  const required = extractTemplateVariables(template);
  const missing = required.filter((key) => !(key in variables));

  return {
    isValid: missing.length === 0,
    missing,
  };
}

/**
 * Create message from template type
 * Common booking notifications
 */
export const BOOKING_TEMPLATES = {
  NEW_BOOKING: `🚗 Pesanan Driver Baru Masuk!

📍 Jemput: {pickupLocation}
📍 Tujuan: {destination}
⏰ Waktu: {bookingTime}
👤 Pengguna: {employeeName}

Segera cek aplikasi: {appUrl}`,

  BOOKING_ACCEPTED: `✅ Pesanan Diterima!

Driver: {driverName}
Kendaraan: {vehiclePlateNo}

Status: {status}
Periksa aplikasi untuk memantau perjalanan: {appUrl}`,

  BOOKING_COMPLETED: `✓ Perjalanan Selesai!

Driver: {driverName}
Lokasi Akhir: {destination}
Waktu Selesai: {completedTime}

Terima kasih telah menggunakan layanan kami.`,

  BOOKING_CANCELLED: `❌ Pesanan Dibatalkan

Alasan: {cancellationReason}
Waktu: {cancelledTime}

Silakan hubungi admin jika ada pertanyaan.`,

  REMINDER: `⏰ Pengingat Pesanan

Pesanan Anda dijadwalkan:
📍 Dari: {pickupLocation}
📍 Ke: {destination}
⏰ Waktu: {bookingTime}

Harap siap tepat waktu. Hubungi kami jika ada perubahan.`,
};
