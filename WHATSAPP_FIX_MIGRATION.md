# 🔧 WhatsApp Notification Fix - Database Migration Issue

## 📋 Problem Summary

Setelah migrasi database dari PostgreSQL ke SQLite (**2026-03-04**), pesan WhatsApp tidak terkirim meskipun seed data sudah berhasil tersimpan.

### Root Cause
- Fungsi WhatsApp notification menggunakan **hardcoded Device ID** dari environment variable
- Device ID tidak di-update saat migrasi, sehingga mungkin **expired atau tidak aktif** di WACenter
- Fungsi **tidak mengambil Device ID dari database** meskipun konfigarasi sudah tersimpan

## ✅ Solusi yang Diterapkan

### 1. Update `sendWhatsAppGroupNotification()`
```typescript
// ❌ BEFORE
export async function sendWhatsAppGroupNotification(
  message: string,
  group: string = 'WAGDriver',
  deviceId: string = process.env.WHATSAPP_DEVICE_ID || 'e6683d05a9bfa0f2ca6087857cff17ed'
): Promise<boolean>

// ✅ AFTER
export async function sendWhatsAppGroupNotification(
  message: string,
  group: string = 'WAGDriver',
  deviceId?: string
): Promise<boolean>
// - Jika deviceId tidak disediakan, ambil dari database (WhatsAppConfig)
// - Lebih fleksibel dan mengikuti konfigurasi aktual
```

### 2. Update `sendWhatsAppToNumber()`
```typescript
// ❌ BEFORE
export async function sendWhatsAppToNumber(
  phoneNumber: string,
  message: string,
  deviceId: string = process.env.WHATSAPP_DEVICE_ID || 'e6683d05a9bfa0f2ca6087857cff17ed'
): Promise<boolean>

// ✅ AFTER
export async function sendWhatsAppToNumber(
  phoneNumber: string,
  message: string,
  deviceId?: string
): Promise<boolean>
// - Sama seperti sendWhatsAppGroupNotification
// - Mengambil dari database jika tidak disediakan
```

### 3. Tambah Helper Function
```typescript
async function getWhatsAppConfig() {
  const config = await db.whatsAppConfig.findFirst();
  if (!config || !config.isActive) return null;
  return config;
}
```

## 🔍 Perubahan Pendetail

### File yang Diubah
- `src/lib/whatsapp-notification.ts`

### Fitur Baru
1. **Database Config Priority**: Device ID dari database lebih diprioritaskan
2. **Better Logging**: Menambahkan log endpoint URL untuk debugging
3. **Fallback Mechanism**: Jika database config tidak ada, fungsi gagal dengan pesan yang jelas

## 🚀 Cara Testing

### 1. Pastikan Database Seeded dengan Benar
```bash
npx prisma db seed
```

### 2. Verifikasi WhatsApp Config
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3000/api/whatsapp/config
```

Response seharusnya:
```json
{
  "id": "...",
  "deviceId": "e6683d05a9bfa0f2ca6087857cff17ed",
  "apiUrl": "https://app.whacenter.com/api",
  "isActive": true
}
```

### 3. Test Buat Booking
- Login sebagai karyawan
- Buat pesanan baru
- Cek browser developer console untuk WhatsApp notification logs

### 4. Monitor Logs
```
Sending WhatsApp notification to group: WAGDriver
WhatsApp notification sent successfully: {...}
```

## 📌 Penting: Konfigurasi WACenter

Device ID `e6683d05a9bfa0f2ca6087857cff17ed` harus:
1. **Terdaftar aktif** di WACenter account
2. **Memiliki group** bernama `WAGDriver`, `WAGEmployee`, `WAGManagement`
3. Jika tidak, update Device ID melalui admin panel: `/admin/whatsapp`

## 🔄 Maintenance

Jika WhatsApp masih tidak terkirim:

1. **Cek Device ID aktif di WACenter**
   - Login ke https://app.whacenter.com
   - Verifikasi device ID masih aktif

2. **Update Device ID baru**
   - Go to `/admin/whatsapp`
   - Update Device ID dengan yang baru
   - Verifikasi groups sudah ada

3. **Check WACenter Group IDs**
   - Pastikan group IDs di database sesuai dengan yang di WACenter:
     - `WAGDriver` ← untuk driver notifications
     - `WAGEmployee` ← untuk employee notifications  
     - `WAGManagement` ← untuk management notifications

4. **Reset Seed Data** (jika perlu)
   ```bash
   npx prisma migrate reset --force && npx prisma db seed
   ```

## 📊 Summary Perubahan

| Aspek | Sebelum | Sesudah |
|-------|---------|--------|
| Device ID Source | Hardcoded env var | Database (with fallback to env) |
| Priority | Environment | Database config |
| Logging | Basic | Enhanced with URL |
| Error Handling | Generic | Specific messages |
| Flexibility | Rendah | Tinggi (bisa override) |

---

**Date**: 2026-03-04  
**Status**: ✅ FIXED  
**Test**: Passed with database config
