# 📲 WhatsApp Integration Guide

## Konfigurasi WhatsApp Notification

### Environment Variables (Required)
```bash
# Optional: Custom device ID (default sudah ada di code)
WHATSAPP_DEVICE_ID=e6683d05a9bfa0f2ca6087857cff17ed
```

### API Configuration

#### Group Messages (Ke Driver Group)
- **Service**: WACenter API
- **Endpoint**: `https://app.whacenter.com/api/sendGroup`
- **Method**: POST
- **Group**: WAGDriver (default group untuk notifikasi driver)
- **Device ID**: e6683d05a9bfa0f2ca6087857cff17ed

**Query Parameters:**
```
?group=WAGDriver
&message=<URL_ENCODED_MESSAGE>
&device_id=e6683d05a9bfa0f2ca6087857cff17ed
```

#### Individual Messages (Ke Employee)
- **Service**: WACenter API
- **Endpoint**: `https://app.whacenter.com/api/send`
- **Method**: GET
- **Device ID**: e6683d05a9bfa0f2ca6087857cff17ed

**Query Parameters:**
```
?device_id=e6683d05a9bfa0f2ca6087857cff17ed
&number=<PHONE_NUMBER_WITH_COUNTRY_CODE>
&message=<URL_ENCODED_MESSAGE>
```

**Contoh:**
```
https://app.whacenter.com/api/send?device_id=e6683d05a9bfa0f2ca6087857cff17ed&number=628125144744&message=Pesanan%20diterima
```

## Implementasi di Aplikasi

### 1. Import Utility
```typescript
import { notifyNewBooking, notifyBookingAccepted } from '@/lib/whatsapp-notification';
```

### 2. Penggunaan Dasar

#### Group Message - Notifikasi Booking Baru
```typescript
// Auto-format dengan detail booking ke driver group
await notifyNewBooking(
  'Kantor BI Jakarta',    // pickupLocation
  'Bandara Soekarno-Hatta', // destination
  '09:00'                  // bookingTime
);
```

#### Individual Message - Notifikasi Booking Diterima
```typescript
// Kirim notifikasi ke employee saat driver accept booking
await notifyBookingAccepted(
  '628125144744',    // Employee phone (country code included)
  'Budi Santoso'     // Driver name
);
```

### 3. Custom Message
```typescript
import { sendWhatsAppGroupNotification } from '@/lib/whatsapp-notification';

const customMessage = 'Laporan harian driver tersedia';
await sendWhatsAppGroupNotification(customMessage);
```

## Message Format

### Booking Notification (Group - Ke Driver)
```
🚗 Pesanan Driver Baru Masuk!

📍 Jemput: Lokasi Jemput
📍 Tujuan: Lokasi Tujuan
⏰ Waktu: HH:mm

Segera cek aplikasi: https://book-driver-bi.vercel.app
```

### Booking Accepted Notification (Individual - Ke Employee)
```
✅ Pesanan Diterima!

Driver: [Nama Driver]

Periksa aplikasi untuk memantau perjalanan: https://book-driver-bi.vercel.app
```

### Kustomisasi Message
Edit format di functions berikut di `src/lib/whatsapp-notification.ts`:
- `buildBookingNotificationMessage()` - untuk booking baru ke grup
- `buildBookingAcceptedMessage()` - untuk notifikasi diterima ke employee

## Error Handling

### Non-Critical Failures
WhatsApp API failures tidak akan menghentikan proses booking:
```typescript
try {
  await notifyNewBooking(...);
} catch (whatsappError) {
  console.error('WhatsApp notification failed:', whatsappError);
  // Booking tetap dibuat meskipun notifikasi gagal
}
```

### Retry Logic
Saat ini tidak ada retry logic. Untuk implementasi di production:
```typescript
// Bisa tambahkan exponential backoff retry
for (let i = 0; i < maxRetries; i++) {
  try {
    return await sendWhatsAppGroupNotification(message);
  } catch (error) {
    if (i === maxRetries - 1) throw error;
    await sleep(1000 * Math.pow(2, i));
  }
}
```

## Monitoring & Debugging

### Log Messages
Semua notifikasi tercatat di console:
```
WhatsApp notification sent successfully: { ... }
WhatsApp notification error: 403 Forbidden
```

### Tests
```bash
curl -X POST "https://app.whacenter.com/api/sendGroup?group=WAGDriver&message=Test&device_id=..."
```

## Troubleshooting

### Notifikasi Tidak Terkirim
1. Cek connection ke WACenter API
2. Verify device_id masih aktif di WACenter account
3. Pastikan group 'WAGDriver' ada dan device terdaftar
4. Check logs untuk error messages

### Message Encoding Issues
URL encoding sudah handle di library:
```typescript
const encodedMessage = encodeURIComponent(message);
```

### Rate Limiting
WACenter mungkin ada rate limit. Monitor response 429.

## Peningkatan Masa Depan

1. **Message Queue**: Implement message queue untuk guaranteed delivery
2. **Analytics**: Track notifikasi metrics (sent, delivered, read)
3. **Personalization**: Include driver name/vehicle info di message
4. **Multiple Groups**: Support different groups untuk different scenarios
5. **Template System**: Predefined message templates untuk consistency
