# 📲 WhatsApp Settings Admin Panel

## Overview

The WhatsApp Settings admin panel provides a comprehensive interface to manage WhatsApp API configuration, message routes/groups, and message templates.

## Features

### 1. **Configuration Tab** 🔧
Manage WhatsApp API credentials and settings:

- **Device ID**: Unique identifier for WACenter API (e.g., `e6683d05a9bfa0f2ca6087857cff17ed`)
- **API URL**: WhatsApp API endpoint (default: `https://app.whacenter.com/api`)
- **Status**: Enable/disable WhatsApp integration
- **Environment Variable**: Option to set via `WHATSAPP_DEVICE_ID` env var

### 2. **Routes/Groups Tab** 📱
Configure WhatsApp groups for notifications:

**Fields:**
- **Route Name**: Friendly name (e.g., "Driver Group")
- **Group ID**: WhatsApp group identifier (e.g., "WAGDriver")
- **Description**: Optional notes about the group
- **Status**: Active/Inactive toggle

**Common Routes:**
- `WAGDriver` - Driver notifications group
- `WAGManagement` - Management group
- `WAGAll` - General announcements

### 3. **Message Templates Tab** 📝
Create and manage notification templates:

**Fields:**
- **Template Name**: Unique identifier (e.g., "New Booking Notification")
- **Template Type**: Category (Booking, Accepted, Completed, Cancelled, Reminder, Other)
- **Message Content**: Template text with placeholders
- **Status**: Active/Inactive toggle

**Supported Placeholders:**
- `{pickupLocation}` - Pickup location
- `{destination}` - Destination location
- `{bookingTime}` - Booking time
- `{driverName}` - Driver name
- `{employeeName}` - Employee name
- `{vehicletNo}` - Vehicle plate number
- `{appUrl}` - Application URL
- `{status}` - Booking status

## API Endpoints

### Configuration
```
GET  /api/whatsapp/config      - Get current config
POST /api/whatsapp/config      - Create/update config
```

### Routes
```
GET    /api/whatsapp/routes      - List all routes
POST   /api/whatsapp/routes      - Create new route
PUT    /api/whatsapp/routes/:id  - Update route
DELETE /api/whatsapp/routes/:id  - Delete route
```

### Templates
```
GET    /api/whatsapp/templates      - List all templates
POST   /api/whatsapp/templates      - Create new template
PUT    /api/whatsapp/templates/:id  - Update template
DELETE /api/whatsapp/templates/:id  - Delete template
```

## Database Schema

### WhatsAppConfig
Stores single WhatsApp API configuration:
```sql
{
  id: String (Primary Key)
  deviceId: String (Unique)
  apiUrl: String
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

### WhatsAppRoute
Stores message routes (groups):
```sql
{
  id: String (Primary Key)
  name: String (Unique)
  groupId: String
  description: String (Optional)
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

### WhatsAppTemplate
Stores message templates:
```sql
{
  id: String (Primary Key)
  name: String (Unique)
  type: String (BOOKING, ACCEPTED, COMPLETED, CANCELLED, REMINDER, OTHER)
  content: String
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

## Setup Steps

### 1. Configure Device ID
1. Open Admin Panel → WhatsApp
2. Go to "Configuration" tab
3. Enter your WACenter Device ID
4. Click "Save Configuration"

### 2. Add Routes/Groups
1. Go to "Routes/Groups" tab
2. Enter Route Name (e.g., "Driver Notifications")
3. Enter Group ID from WhatsApp (e.g., "WAGDriver")
4. Click "Add Route"

### 3. Create Message Templates
1. Go to "Message Templates" tab
2. Enter Template Name (e.g., "New Booking")
3. Select Template Type (e.g., "Booking New")
4. Write message with placeholders
5. Click "Add Template"

## Example Templates

### New Booking Notification
```
🚗 Pesanan Driver Baru Masuk!

📍 Jemput: {pickupLocation}
📍 Tujuan: {destination}
⏰ Waktu: {bookingTime}
👤 Pengguna: {employeeName}

Segera cek aplikasi: {appUrl}
```

### Booking Accepted
```
✅ Pesanan Diterima!

Driver: {driverName}
Kendaraan: {vehiclePlateNo}

Periksa aplikasi untuk memantau perjalanan: {appUrl}
```

### Trip Completed
```
✓ Perjalanan Selesai!

Driver: {driverName}
Lokasi Akhir: {destination}
Status: {status}

Terima kasih telah menggunakan layanan kami.
```

## Usage in Code

### Import and Use
```typescript
import { api } from '@/lib/api';

// Get config
const config = await api('/whatsapp/config', {}, token);

// Get routes
const routes = await api('/whatsapp/routes', {}, token);

// Get templates
const templates = await api('/whatsapp/templates', {}, token);
```

### Sending Messages with Templates
```typescript
import { sendWhatsAppGroupNotification } from '@/lib/whatsapp-notification';

// Send to group using route
const message = `🚗 Pesanan Driver Baru Masuk!

📍 Jemput: Pusat BI
📍 Tujuan: Bandara Soekarno-Hatta
⏰ Waktu: 09:00

Segera cek aplikasi: https://driver-book-bi.vercel.app`;

await sendWhatsAppGroupNotification(message, 'WAGDriver', 'e6683d05a9bfa0f2ca6087857cff17ed');
```

## Security

- ✅ Admin-only access (requires ADMIN role)
- ✅ JWT token validation
- ✅ Device ID encryption recommended (for production)
- ✅ Rate limiting recommended for API endpoints

## Troubleshooting

### Messages not sending?

1. **Check Device ID**: Verify Device ID is correct in Configuration tab
2. **Check Group ID**: Ensure Group ID exists in WhatsApp
3. **Check API URL**: Verify WACenter API URL is accessible
4. **Check Status**: Ensure WhatsApp integration is Active
5. **Check Message**: Verify message content is not empty

### Routes not appearing?

1. Go to "Routes/Groups" tab
2. Verify route status is "Active"
3. Try clicking "Edit" to verify data

### Template placeholders not working?

- Use exact placeholder names: `{pickupLocation}`, `{destination}`, etc.
- All placeholders are case-sensitive
- Invalid placeholders are ignored

## Best Practices

1. **Use Descriptive Names**: Make route and template names clear
2. **Test Templates**: Test message content before production use
3. **Use Emojis**: Improve notification visibility with emojis
4. **Keep Concise**: WhatsApp has character limits
5. **Update Templates**: Regularly update templates based on user feedback

## Environment Variables

```bash
# Optional - Override in UI, but can also set via env
WHATSAPP_DEVICE_ID=e6683d05a9bfa0f2ca6087857cff17ed

# If using custom API
WHATSAPP_API_URL=https://app.whacenter.com/api
```

## Related Documentation

- [WhatsApp Integration Guide](../WHATSAPP_INTEGRATION.md)
- [WACenter API Documentation](https://app.whacenter.com/docs)
- [Notification System](../notification-system.md)
