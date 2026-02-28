# 🚀 WhatsApp Admin Settings - Quick Reference

## Access WhatsApp Settings
**URL**: `http://localhost:3000/admin/whatsapp`  
**Role Required**: Admin  
**Button Location**: Admin Dashboard → WhatsApp (green button)

## Three Main Sections

### 1️⃣ Configuration Tab
**Purpose**: Set up WhatsApp API credentials

| Field | Required | Example |
|-------|----------|---------|
| Device ID | ✅ Yes | `e6683d05a9bfa0f2ca6087857cff17ed` |
| API URL | ✅ Yes | `https://app.whacenter.com/api` |
| Active | ✅ Yes | Toggle on/off |

### 2️⃣ Routes/Groups Tab
**Purpose**: Manage WhatsApp groups for notifications

| Field | Required | Example |
|-------|----------|---------|
| Route Name | ✅ Yes | `Driver Notifications` |
| Group ID | ✅ Yes | `WAGDriver` |
| Description | ❌ No | Group for driver messages |
| Status | ✅ Yes | Active/Inactive |

**Actions**: Add, Edit, Delete routes

### 3️⃣ Message Templates Tab
**Purpose**: Create notification message templates

| Field | Required | Example |
|-------|----------|---------|
| Template Name | ✅ Yes | `New Booking Alert` |
| Type | ✅ Yes | BOOKING, ACCEPTED, COMPLETED, etc. |
| Content | ✅ Yes | Message with {placeholders} |
| Active | ✅ Yes | Active/Inactive |

**Actions**: Add, Edit, Delete templates

## Available Placeholders for Templates

```
{pickupLocation}     → Pickup location
{destination}        → Destination location  
{bookingTime}        → Booking time
{driverName}         → Driver name
{employeeName}       → Employee name
{vehiclePlateNo}     → Vehicle plate number
{appUrl}             → Application URL
{status}             → Booking status
{cancellationReason} → Reason for cancellation
{completedTime}      → When job was completed
```

## Pre-built Template Examples

### New Booking (Type: BOOKING)
```
🚗 Pesanan Driver Baru Masuk!

📍 Jemput: {pickupLocation}
📍 Tujuan: {destination}
⏰ Waktu: {bookingTime}

Segera cek aplikasi: {appUrl}
```

### Driver Accepted (Type: ACCEPTED)
```
✅ Pesanan Diterima!

Driver: {driverName}
Kendaraan: {vehiclePlateNo}

Pantau perjalanan: {appUrl}
```

### Trip Completed (Type: COMPLETED)
```
✓ Perjalanan Selesai!

Terima kasih telah menggunakan layanan kami.
Hubungi kami untuk feedback.
```

## Database Tables

### WhatsAppConfig
Single record storing API configuration
```sql
SELECT id, deviceId, apiUrl, isActive FROM "WhatsAppConfig";
```

### WhatsAppRoute
List of message routes/groups
```sql
SELECT name, groupId, description, isActive FROM "WhatsAppRoute";
```

### WhatsAppTemplate
List of message templates
```sql
SELECT name, type, content, isActive FROM "WhatsAppTemplate";
```

## API Endpoints (for developers)

### Get/Save Configuration
```
GET  /api/whatsapp/config
POST /api/whatsapp/config
```

### Routes Management
```
GET    /api/whatsapp/routes
POST   /api/whatsapp/routes (create)
PUT    /api/whatsapp/routes/:id (update)
DELETE /api/whatsapp/routes/:id (delete)
```

### Templates Management
```
GET    /api/whatsapp/templates
POST   /api/whatsapp/templates (create)
PUT    /api/whatsapp/templates/:id (update)
DELETE /api/whatsapp/templates/:id (delete)
```

## Common Tasks

### Add a new WhatsApp route
1. Go to "Routes/Groups" tab
2. Fill in Route Name and Group ID
3. Click "Add Route"
4. New route appears in list below

### Create notification template
1. Go to "Message Templates" tab
2. Fill in Template Name
3. Select Template Type
4. Write message using {placeholders}
5. Click "Add Template"

### Edit existing template
1. Find template in list
2. Click edit icon (pencil)
3. Modify content
4. Click "Update Template"

### Delete route/template
1. Find item in list
2. Click delete icon (trash)
3. Confirm deletion

## Security

- ✅ Admin-only access
- ✅ JWT token authentication
- ✅ All operations validated server-side
- ✅ No sensitive data in client logs

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't access page | Check if you have Admin role |
| Device ID rejected | Verify ID is correct from WACenter |
| Routes not saving | Check if groupId is valid |
| Messages not sending | Verify configuration is Active and Device ID is set |
| Placeholders not replacing | Use exact names with curly braces: `{name}` |

## Integration Code Example

```typescript
// Send WhatsApp using stored configuration
import { api } from '@/lib/api';
import { sendWhatsAppGroupNotification } from '@/lib/whatsapp-notification';

const config = await api('/whatsapp/config', {}, token);
const routes = await api('/whatsapp/routes', {}, token);

const driverRoute = routes.find(r => r.name === 'Driver Notifications');

if (config && driverRoute) {
  await sendWhatsAppGroupNotification(
    'New booking message here',
    driverRoute.groupId,
    config.deviceId
  );
}
```

## Files Modified/Created

**New Files:**
- `src/app/api/whatsapp/` (all routes)
- `src/app/(protected)/admin/whatsapp/page.tsx`
- `src/components/admin/admin-whatsapp-settings.tsx`
- `src/lib/whatsapp-templates.ts`
- `prisma/migrations/20260228000000_add_whatsapp_config/`

**Modified Files:**
- `src/components/admin/admin-dashboard.tsx` (added WhatsApp button)
- `prisma/schema.prisma` (added 3 models)

**Documentation:**
- `WHATSAPP_ADMIN_SETTINGS.md`
- `WHATSAPP_ADMIN_IMPLEMENTATION.md`
- `WHATSAPP_SETTINGS_SETUP.sh`

## Next Steps

1. ✅ Run migrations: `npx prisma migrate dev`
2. ✅ Access admin panel: `/admin/whatsapp`
3. ✅ Configure Device ID
4. ✅ Add message routes
5. ✅ Create message templates
6. ✅ Use in booking notifications

---

**Version**: 1.0  
**Last Updated**: Feb 28, 2026  
**Status**: ✅ Ready to Use
