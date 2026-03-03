// 📖 WhatsApp Template Utility - Usage Examples

// ============================================
// 1. BASIC TEMPLATE FORMATTING
// ============================================

import { formatTemplate } from '@/lib/whatsapp-templates';

// Example 1: Simple replacement
const message1 = formatTemplate(
  'Hello {name}, your booking is at {time}',
  { name: 'John', time: '09:00 AM' }
);
// Output: "Hello John, your booking is at 09:00 AM"

// Example 2: Multiple replacements
const message2 = formatTemplate(
  `🚗 Pesanan dari {employeeName}
📍 Dari: {pickupLocation}
📍 Ke: {destination}
⏰ Waktu: {bookingTime}`,
  {
    employeeName: 'Budi Santoso',
    pickupLocation: 'Kantor BI',
    destination: 'Bandara Soekarno-Hatta',
    bookingTime: '09:00',
  }
);
// Output: Formatted message with all replacements

// ============================================
// 2. GET TEMPLATE FROM DATABASE AND FORMAT
// ============================================

import { getFormattedTemplate } from '@/lib/whatsapp-templates';
import { api } from '@/lib/api';

async function sendBookingNotification(token: string, bookingData: any) {
  try {
    // Fetch templates from database
    const templates = await api('/whatsapp/templates', {}, token);

    // Get and format template
    const message = getFormattedTemplate(
      'New Booking',  // template name
      {
        employeeName: bookingData.employeeName,
        pickupLocation: bookingData.pickupLocation,
        destination: bookingData.destination,
        bookingTime: bookingData.bookingTime,
        appUrl: 'https://lamin-bpp.web.id'
      },
      templates
    );

    if (message) {
      // Send via WhatsApp
      const config = await api('/whatsapp/config', {}, token);
      if (config) {
        await sendWhatsAppGroupNotification(message, 'WAGDriver', config.deviceId);
      }
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// ============================================
// 3. VALIDATE TEMPLATE VARIABLES
// ============================================

import { validateTemplateVariables, extractTemplateVariables } from '@/lib/whatsapp-templates';

// Check if all required variables are provided
const templateContent = 'Pesanan dari {employeeName} ke {destination} pada {bookingTime}';
const providedVars = { employeeName: 'John', destination: 'Airport' };

const validation = validateTemplateVariables(templateContent, providedVars);
console.log(validation);
// Output: { isValid: false, missing: ['bookingTime'] }

// Extract placeholder names from template
const placeholders = extractTemplateVariables(templateContent);
console.log(placeholders);
// Output: ['employeeName', 'destination', 'bookingTime']

// ============================================
// 4. USE PRE-BUILT TEMPLATES
// ============================================

import { BOOKING_TEMPLATES } from '@/lib/whatsapp-templates';

// New booking notification
const newBookingMsg = formatTemplate(BOOKING_TEMPLATES.NEW_BOOKING, {
  pickupLocation: 'Kantor Pusat',
  destination: 'Bandara CGK',
  bookingTime: '14:30',
  employeeName: 'Rina Wijaya',
  appUrl: 'https://lamin-bpp.web.id'
});

// Booking accepted notification
const acceptedMsg = formatTemplate(BOOKING_TEMPLATES.BOOKING_ACCEPTED, {
  driverName: 'Budi Santoso',
  vehiclePlateNo: 'B 1234 ABC',
  status: 'ON_TRIP',
  appUrl: 'https://lamin-bpp.web.id'
});

// ============================================
// 5. COMPLETE REAL-WORLD EXAMPLE
// ============================================

import { sendWhatsAppGroupNotification } from '@/lib/whatsapp-notification';

async function handleNewBooking(
  bookingData: {
    id: string;
    employeeName: string;
    pickupLocation: string;
    destination: string;
    bookingTime: string;
  },
  token: string
) {
  try {
    // Step 1: Get config and routes
    const [config, routes, templates] = await Promise.all([
      api('/whatsapp/config', {}, token),
      api('/whatsapp/routes', {}, token),
      api('/whatsapp/templates', {}, token),
    ]);

    // Step 2: Validate configuration
    if (!config || !config.isActive) {
      console.log('WhatsApp not configured');
      return;
    }

    // Step 3: Get driver route
    const driverRoute = routes.find(r => r.name === 'Driver Notifications');
    if (!driverRoute) {
      console.log('Driver route not configured');
      return;
    }

    // Step 4: Format message
    const message = getFormattedTemplate(
      'New Booking',
      {
        employeeName: bookingData.employeeName,
        pickupLocation: bookingData.pickupLocation,
        destination: bookingData.destination,
        bookingTime: bookingData.bookingTime,
        appUrl: 'https://lamin-bpp.web.id'
      },
      templates
    );

    if (!message) {
      console.log('Template not found');
      return;
    }

    // Step 5: Send notification
    const success = await sendWhatsAppGroupNotification(
      message,
      driverRoute.groupId,
      config.deviceId
    );

    if (success) {
      console.log(`✅ Notification sent for booking ${bookingData.id}`);
    } else {
      console.error(`❌ Failed to send notification for booking ${bookingData.id}`);
    }
  } catch (error) {
    console.error('Error in handleNewBooking:', error);
  }
}

// Usage:
// handleNewBooking({
//   id: '123',
//   employeeName: 'John Doe',
//   pickupLocation: 'Office',
//   destination: 'Airport',
//   bookingTime: '09:00'
// }, token);

// ============================================
// 6. BUILD CUSTOM MESSAGE DYNAMICALLY
// ============================================

function buildCustomMessage(
  template: string,
  booking: any,
  config: any
): string {
  // Step 1: Extract required variables
  const required = extractTemplateVariables(template);

  // Step 2: Build variables object from booking data
  const variables: { [key: string]: string } = {
    employeeName: booking.employee.name,
    pickupLocation: booking.pickupLocation,
    destination: booking.destination,
    bookingTime: booking.bookingTime,
    driverName: booking.driver?.name || 'Driver',
    vehiclePlateNo: booking.vehicle?.plateNumber || 'TBD',
    appUrl: 'https://lamin-bpp.web.id',
    status: booking.status,
    completedTime: new Date(booking.completedAt).toLocaleString('id-ID'),
  };

  // Step 3: Validate all required vars are available
  const missing = required.filter(key => !(key in variables));
  if (missing.length > 0) {
    console.warn(`Missing variables: ${missing.join(', ')}`);
  }

  // Step 4: Format and return
  return formatTemplate(template, variables);
}

// ============================================
// 7. BATCH NOTIFICATIONS
// ============================================

async function sendBatchNotifications(
  bookings: any[],
  token: string
) {
  const config = await api('/whatsapp/config', {}, token);
  const routes = await api('/whatsapp/routes', {}, token);
  const templates = await api('/whatsapp/templates', {}, token);

  if (!config || !config.isActive) {
    console.log('WhatsApp not configured');
    return;
  }

  const driverRoute = routes.find(r => r.name === 'Driver Notifications');
  if (!driverRoute) {
    console.log('Driver route not configured');
    return;
  }

  // Send notifications for each booking
  const results = await Promise.all(
    bookings.map(async (booking) => {
      try {
        const message = getFormattedTemplate(
          'New Booking',
          {
            employeeName: booking.employeeName,
            pickupLocation: booking.pickupLocation,
            destination: booking.destination,
            bookingTime: booking.bookingTime,
            appUrl: 'https://lamin-bpp.web.id'
          },
          templates
        );

        if (!message) return { booking: booking.id, success: false };

        const success = await sendWhatsAppGroupNotification(
          message,
          driverRoute.groupId,
          config.deviceId
        );

        return { booking: booking.id, success };
      } catch (error) {
        console.error(`Error sending notification for ${booking.id}:`, error);
        return { booking: booking.id, success: false };
      }
    })
  );

  // Log results
  const sent = results.filter(r => r.success).length;
  console.log(`📊 Sent ${sent}/${results.length} notifications`);

  return results;
}

// ============================================
// 8. ERROR HANDLING PATTERNS
// ============================================

async function safeFormatAndSend(
  template: string,
  variables: { [key: string]: any },
  groupId: string,
  deviceId: string
) {
  try {
    // Validate variables
    const validation = validateTemplateVariables(template, variables);
    if (!validation.isValid) {
      throw new Error(`Missing variables: ${validation.missing.join(', ')}`);
    }

    // Format message
    const message = formatTemplate(template, variables);

    // Validate message length (WhatsApp limit ~4096 chars)
    if (message.length > 4096) {
      throw new Error('Message exceeds WhatsApp character limit');
    }

    // Send
    return await sendWhatsAppGroupNotification(message, groupId, deviceId);
  } catch (error) {
    console.error('Error:', error);
    // Log to monitoring system
    // sendToSentry(error);
    return false;
  }
}

// ============================================
// 9. TEMPLATE VARIABLE HINTS
// ============================================

// Common variable names to use in templates:
const COMMON_VARIABLES = {
  // User info
  employeeName: 'String - Name of employee who made booking',
  driverName: 'String - Name of assigned driver',
  
  // Location info
  pickupLocation: 'String - Where to pick up',
  destination: 'String - Final destination',
  
  // Time info
  bookingTime: 'String - Scheduled booking time',
  completedTime: 'String - When booking was completed',
  
  // Vehicle info
  vehiclePlateNo: 'String - Vehicle registration number',
  
  // Status/Other
  appUrl: 'String - Link to application',
  status: 'String - Current booking status',
  cancellationReason: 'String - Why booking was cancelled',
};

// Export interface for TypeScript
export interface BookingNotificationVariables {
  employeeName?: string;
  driverName?: string;
  pickupLocation?: string;
  destination?: string;
  bookingTime?: string;
  completedTime?: string;
  vehiclePlateNo?: string;
  appUrl?: string;
  status?: string;
  cancellationReason?: string;
}

// ============================================
// 10. TESTING TEMPLATES LOCALLY
// ============================================

// Test function to verify templates work
function testTemplate(template: string, variables: BookingNotificationVariables) {
  console.log('=== Template Test ===');
  console.log('Original:', template);
  console.log('Variables:', variables);

  const validation = validateTemplateVariables(template, variables);
  console.log('Valid:', validation.isValid);
  if (!validation.isValid) {
    console.log('Missing:', validation.missing);
  }

  const result = formatTemplate(template, variables);
  console.log('\nFormatted Result:');
  console.log(result);
  console.log('\nLength:', result.length);

  return result;
}

// Usage:
// testTemplate(
//   'Booking from {employeeName} to {destination}',
//   { employeeName: 'John', destination: 'Airport' }
// );
