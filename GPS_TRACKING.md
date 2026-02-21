# GPS Tracking Feature Documentation

## Overview
Fitur GPS tracking telah ditambahkan ke aplikasi driver booking. Driver akan merekam titik GPS mereka setiap kali mengupdate status perjalanan (DEPARTED, ARRIVED, RETURNING, COMPLETED). Detail perjalanan juga akan menampilkan visualisasi map interaktif dengan semua titik GPS yang tersimpan.

## Fitur Utama

### 1. **Recording GPS Waypoints**
- Driver secara otomatis merekam lokasi GPS mereka ketika mengupdate status perjalanan
- Lokasi direkam dengan precision (latitude, longitude, accuracy)
- Data tersimpan di database dengan timestamp

### 2. **Interactive Leaflet Map**
- Visualisasi interaktif menggunakan Leaflet dan OpenStreetMap
- Menampilkan:
  - 📍 **Pickup Location** (Marker biru)
  - 🚩 **Destination** (Marker hijau)
  - 🚗 **Current Location** (Marker merah)
  - 📍 **GPS Waypoints** (Marker kecil abu-abu)
  - 🛣️ **Route Path** (Garis oranye menghubungkan semua waypoint)

### 3. **Location Details Page**
- Tab "Rute Perjalanan GPS" di halaman detail perjalanan
- Hanya muncul untuk status: DEPARTED, ARRIVED, RETURNING, COMPLETED
- Menampilkan jumlah titik GPS yang terekam
- Loading state ketika mengambil data

## Technical Implementation

### Database Schema
```prisma
model GPSWaypoint {
  id        String   @id @default(cuid())
  bookingId String
  latitude  Float
  longitude Float
  accuracy  Float?
  timestamp DateTime @default(now())
  createdAt DateTime @default(now())

  booking Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@index([bookingId])
  @@index([timestamp])
}
```

### API Endpoints

#### POST /api/gps
**Record GPS waypoint**
```json
Request:
{
  "bookingId": "string",
  "latitude": number,
  "longitude": number,
  "accuracy": number (optional)
}

Response:
{
  "waypoint": {
    "id": "string",
    "bookingId": "string",
    "latitude": number,
    "longitude": number,
    "accuracy": number,
    "timestamp": "ISO8601",
    "createdAt": "ISO8601"
  }
}
```

#### GET /api/gps?bookingId={id}
**Fetch all GPS waypoints for a booking**
```json
Response:
{
  "waypoints": [
    {
      "id": "string",
      "bookingId": "string",
      "latitude": number,
      "longitude": number,
      "accuracy": number,
      "timestamp": "ISO8601",
      "createdAt": "ISO8601"
    }
  ]
}
```

### Components

#### 1. GPSMap Component (`src/components/shared/gps-map.tsx`)
- React component untuk visualisasi Leaflet map
- Props:
  - `waypoints`: Array of GPS waypoints
  - `pickup`: Pickup location coordinates & name
  - `destination`: Destination coordinates & name
  - `currentLocation`: Current driver location
  - `height`: Custom height (default: h-96)

#### 2. Updated TravelDetailCard
- Menampilkan GPS map ketika perjalanan dalam progress
- Auto-load waypoints dari API
- Progress indicator selama loading

#### 3. Driver Dashboard Enhancement
- Otomatis merekam GPS location saat update status
- Menggunakan browser Geolocation API
- Fallback graceful jika GPS tidak tersedia

## Usage Flow

### For Drivers
1. Driver menerima booking dan mengklik tombol "Berangkat"
2. Browser meminta izin akses GPS (jika belum diberikan)
3. Lokasi GPS direkam dan dikirim ke server
4. Status perjalanan diupdate ke DEPARTED
5. Proses berulang untuk ARRIVED, RETURNING, COMPLETED

### For Employees/Admins
1. Buka detail perjalanan dari riwayat
2. Scroll ke bagian "Rute Perjalanan GPS"
3. Lihat map interaktif dengan route yang diambil driver
4. Hover marker untuk melihat timestamp

## Security & Permissions

- **GPS Recording**: Hanya driver yang assigned dapat merekam GPS
- **View GPS Data**: Driver dan employee (pembuat booking) dapat melihat GPS data
- **Admin Access**: Admin dapat melihat semua GPS data

## Browser Requirements

- Geolocation API support (modern browsers)
- GPS permission dari user
- JavaScript enabled

## Error Handling

- Jika GPS tidak tersedia: Proses status update tetap berlanjut
- Jika permintaan GPS ditolak: Hanya status yang diupdate, GPS tidak direkam
- Jika error loading waypoints: Tampilkan pesan "Belum ada data GPS"

## Future Enhancements

- [ ] Real-time GPS tracking (live tracking)
- [ ] Speed indicator dari GPS waypoints
- [ ] Route optimization suggestions
- [ ] Geofencing untuk pemberhentian otomatis
- [ ] Export route sebagai GPX file
- [ ] Heatmap visualization untuk area populer

## Dependency Packages

- `leaflet@^1.9.4` - Map library
- `react-leaflet@^5.0.0` - React wrapper untuk Leaflet
- `@types/leaflet@^1.9.21` - TypeScript typings

## Migration

Run migration untuk membuat GPSWaypoint table:
```bash
bunx prisma migrate dev --name add_gps_waypoints
```
