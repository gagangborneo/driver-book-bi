# 📱 Booking System Update - WhatsApp Notification & Multi-Driver Selection

## Overview
Sistem booking telah diubah dari single driver assignment menjadi multi-driver notification system dengan first-come-first-serve approach. Semua driver dengan status AVAILABLE akan menerima notifikasi, dan driver pertama yang merespons akan mendapatkan pemesanan.

Ketika driver menerima booking, notifikasi juga langsung dikirim ke WhatsApp nomor employee yang memesan.

## Perubahan Utama

### 1. WhatsApp Group & Individual Notification
**File**: `src/lib/whatsapp-notification.ts`

#### A. Group Notification (Ke Driver)
- Mengirim notifikasi otomatis ke WhatsApp grup driver setelah booking dibuat
- API Endpoint: `POST https://app.whacenter.com/api/sendGroup`
- Fungsi: `notifyNewBooking(pickupLocation, destination, bookingTime)`

**Format pesan:**
```
🚗 Pesanan Driver Baru Masuk!

📍 Jemput: [Lokasi Jemput]
📍 Tujuan: [Lokasi Tujuan]
⏰ Waktu: [Waktu Pemesanan]

Segera cek aplikasi: https://book-driver-bi.vercel.app
```

#### B. Individual Notification (Ke Employee)
- Mengirim notifikasi ke WhatsApp nomor employee saat driver menerima booking
- API Endpoint: `GET https://app.whacenter.com/api/send`
- Fungsi: `notifyBookingAccepted(phoneNumber, driverName)`

**Format pesan:**
```
✅ Pesanan Diterima!

Driver: [Nama Driver]

Periksa aplikasi untuk memantau perjalanan: https://book-driver-bi.vercel.app
```
⏰ Waktu: [Waktu Pemesanan]

Segera cek aplikasi: https://book-driver-bi.vercel.app
```

### 2. Booking Creation Flow (POST /api/bookings)
**Perubahan:**
- Booking dibuat dengan `driverId = null` (tidak assign driver)
- `vehicleId = null` (belum ada vehicle)
- Status tetap `PENDING`
- Cek driver berdasarkan `driverStatus === AVAILABLE` (bukan random selection)
- WhatsApp notification dikirim otomatis setelah booking dibuat

**Error handling:**
- Jika tidak ada driver available: "Tidak ada driver yang tersedia saat ini. Silakan coba beberapa saat lagi."

### 3. Driver Discovery (GET /api/bookings)
**Perubahan untuk DRIVER role:**
- Menampilkan **pending bookings tanpa driver** (driverId = null) jika driver punya status AVAILABLE
- Tetap menampilkan bookings yang di-assign ke driver
- Driver hanya bisa lihat unassigned bookings jika status = AVAILABLE

```typescript
whereClause.OR = [
  { status: PENDING, driverId: null }, // available untuk driver AVAILABLE
  { driverId: userId }, // bookings assigned ke driver
];
```

### 4. Driver Accepting Booking (PUT /api/bookings/[id])
**Fitur baru:**
- Driver bisa accept unassigned pending booking (driverId = null)
- Syarat: Driver harus punya status AVAILABLE
- Saat accept:
  - Set `driverId = currentUserId`
  - Set `vehicleId` dari pilihan driver
  - Status berubah dari PENDING ke APPROVED
  - Vehicle status berubah ke IN_USE
  - **WhatsApp notification dikirim ke nomor employee yang memesan**

**Validation:**
```typescript
if (currentBooking.status === PENDING && newStatus === APPROVED && currentBooking.driverId === null) {
  if (currentUser.driverStatus !== 'AVAILABLE') {
    return error: 'Anda harus status AVAILABLE untuk menerima pesanan'
  }
  // Accept dan set driverId
}
```

**WhatsApp Notification Flow:**
```
Driver accept booking (PUT /api/bookings/[id])
    ⬇️
Fetch employee phone number
    ⬇️
Send WhatsApp: "✅ Pesanan Diterima! Driver: [Nama Driver]"
    ⬇️
Employee menerima notifikasi di WhatsApp
```

## UI/UX Changes

### Employee Dashboard
**Pesan Success:**
- Sebelum: "Pemesanan driver telah dikirim. Driver akan ditentukan secara otomatis."
- Sesudah: "Notifikasi telah dikirim ke semua driver yang tersedia. Driver tercepat akan menerima pesanan Anda."

### Driver Dashboard
**Accept Modal:**
- Title: "Terima Pesanan Driver"
- Description: "Konfirmasi pesanan dan pilih kendaraan untuk perjalanan ini"

**Success Message:**
- Sebelum: "Pesanan telah disetujui dan kendaraan telah ditentukan"
- Sesudah: "Anda telah mengkonfirmasi pesanan. Status pesanan telah menjadi APPROVED."

**Pending Bookings List:**
- Menambahkan badge "Open" pada bookings yang belum ada driver (driverId = null)
- Border highlight hijau untuk unassigned bookings
- Menampilkan employee info untuk setiap penawaran

## Database Changes
Tidak ada perubahan schema. Menggunakan field yang sudah ada:
- `driverId` (nullable) - untuk multi-driver selection
- `driverStatus` - untuk filter available drivers
- Status PENDING - untuk initial state
- Status APPROVED - untuk confirmed booking

## API Contracts

### POST /api/bookings
**Request:**
```json
{
  "pickupLocation": "string",
  "destination": "string",
  "bookingDate": "ISO8601",
  "bookingTime": "HH:mm",
  "notes": "string (optional)"
}
```

**Response (200):**
```json
{
  "booking": {
    "id": "string",
    "driverId": null,
    "vehicleId": null,
    "status": "PENDING",
    ...
  },
  "message": "Pesanan driver telah dibuat. Notifikasi telah dikirim ke driver yang tersedia."
}
```

### PUT /api/bookings/[id]
**Driver Accept Booking:**
```json
{
  "status": "APPROVED",
  "vehicleId": "string"
}
```

## Workflow Summary

1. **Karyawan memesan** → POST /api/bookings
   - Booking dibuat dengan driverId = null
   - WhatsApp notification dikirim ke grup driver

2. **Driver menerima notifikasi** → Masuk ke app
   - GET /api/bookings menampilkan pending open bookings
   - Driver melihat detail booking

3. **Driver accept first** → PUT /api/bookings/[id]
   - Set status = APPROVED
   - Set driverId = driver id
   - Other drivers tidak bisa lagi access booking ini

4. **Booking progresses** → Status flow: APPROVED → DEPARTED → ARRIVED → RETURNING → COMPLETED

## Error Scenarios

1. **No available drivers**: "Tidak ada driver yang tersedia saat ini. Silakan coba beberapa saat lagi."

2. **Driver not AVAILABLE**: "Anda harus status AVAILABLE untuk menerima pesanan"

3. **WhatsApp API fails**: Booking tetap dibuat, WhatsApp error hanya di log (non-critical)

## Testing Notes

- Test dengan multiple drivers online dengan status AVAILABLE
- Verify WhatsApp notification diterima saat booking dibuat
- Test race condition: 2 drivers accept bersamaan (database constraint melindungi)
- Verify driver status = OFFLINE/ON_TRIP tidak bisa accept booking
