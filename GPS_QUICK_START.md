# GPS Tracking Quick Start Guide

## 🎯 Overview

GPS tracking feature memungkinkan driver untuk secara otomatis merekam titik lokasi mereka selama perjalanan, dan menampilkan rute perjalanan di peta interaktif.

## ✨ Key Features

- 📍 **Auto GPS Recording**: Lokasi direkam otomatis saat update status perjalanan
- 🗺️ **Interactive Map**: Visualisasi rute dengan marker dan polyline
- 👥 **Role-Based Access**: Driver dan employee dapat melihat data GPS
- 📊 **Waypoint History**: Menyimpan semua titik GPS dengan timestamp

## 🚀 How It Works

### For Drivers

1. **Ketika mengklik tombol "Berangkat" (DEPARTED)**:
   ```
   Driver clicks button
   ↓
   Browser meminta izin GPS
   ↓
   Lokasi dicatat
   ↓
   Status update dikirim ke server
   ↓
   GPS waypoint tersimpan
   ```

2. **Browser akan menampilkan popup**:
   - "Allow GPS access?" - Click "Allow" untuk memberikan izin
   - Lokasi akan dicatat otomatis

3. **Proses berulang** untuk setiap status update:
   - DEPARTED → record GPS
   - ARRIVED → record GPS
   - RETURNING → record GPS
   - COMPLETED → record GPS

### For Employees & Admins

1. **Buka riwayat perjalanan** (History)
2. **Klik detail perjalanan** yang sudah dimulai/selesai
3. **Scroll ke "Rute Perjalanan GPS"**
4. **Lihat peta interaktif** dengan:
   - 🔵 Titik penjemputan (biru)
   - 🟢 Titik tujuan (hijau)
   - ⚫ Semua titik GPS yang direkam (abu-abu)
   - 🟠 Garis rute menghubungkan semua titik

## 🗺️ Map Elements

| Element | Icon | Color | Meaning |
|---------|------|-------|---------|
| Pickup | 📍 | Biru | Lokasi penjemputan |
| Destination | 🚩 | Hijau | Lokasi tujuan |
| Current | 🚗 | Merah | Lokasi terakhir driver |
| Waypoint | ⚫ | Abu-abu | Titik GPS tercatat |
| Route | 🛣️ | Oranye | Garis penghubung |

## 💡 Tips

### GPS Recording Best Practices

✅ **DO**:
- Berikan izin GPS ketika diminta
- Pastikan GPS enabled di device
- Buat perjalanan dengan GPS aktif
- Periksa peta setelah selesai

❌ **DON'T**:
- Menolak akses GPS (recording tidak akan terjadi)
- Matikan GPS selama perjalanan
- Jalankan di area tanpa akses GPS
- Close browser tab saat navigasi

### Troubleshooting

**Problema: "Belum ada data GPS"**
- Pastikan GPS aktif di device
- Reload halaman dan coba lagi
- Jika masih tidak muncul, perjalanan mungkin tidak punya waypoint

**Problema: Map tidak muncul**
- Tunggu loading spinner selesai
- Refresh page
- Cek browser console untuk error messages

**Problema: GPS tidak terekam**
- Browser popup minta izin GPS - klik "Allow"
- Jika sudah memilih "Block", clear browser permissions
  - Chrome: Settings → Privacy → Site Settings → Location
  - Firefox: Preferences → Privacy → Permissions → Location

## 📱 Device Support

| Device | Support | Notes |
|--------|---------|-------|
| Android | ✅ | Pastikan GPS enabled |
| iPhone | ✅ | Location Services harus on |
| Desktop Chrome | ✅ | Memerlukan HTTPS |
| Desktop Firefox | ✅ | Memerlukan HTTPS |
| iPad/Tablet | ✅ | Jika ada GPS hardware |

## 🔐 Privacy & Security

- Hanya driver yang ditugaskan dapat merekam GPS
- Hanya driver dan pembuat booking dapat melihat data GPS
- GPS data encrypted dalam database
- Automatic cleanup ketika booking dihapus

## 📊 Data Points Recorded

Setiap GPS waypoint menyimpan:
- **Latitude**: Garis lintang presisi tinggi
- **Longitude**: Garis bujur presisi tinggi
- **Accuracy**: Akurasi GPS dalam meter
- **Timestamp**: Waktu pasti kapan direkam
- **Booking ID**: Identitas perjalanan

Example:
```json
{
  "latitude": -6.1751,
  "longitude": 106.8250,
  "accuracy": 15.5,
  "timestamp": "2026-02-20T05:30:22.000Z"
}
```

## 🎮 Map Interaction

### Desktop
- **Scroll**: Zoom in/out
- **Click & drag**: Pan around
- **Click marker**: View details
- **Hover**: See timestamps

### Mobile
- **Pinch**: Zoom in/out
- **Drag**: Pan around
- **Tap marker**: View details
- **Tap & hold**: Get tooltip

## 📈 Analytics & Insights

Data yang tersimpan bisa digunakan untuk:
- 📍 Verify driver location truth
- 🚗 Calculate actual distance traveled
- ⏱️ Analyze journey duration
- 🛣️ Route optimization
- 🚦 Traffic pattern analysis

## 🐛 Known Limitations

1. **First waypoint tidak selalu tercatat** jika:
   - GPS memerlukan waktu untuk lock
   - GPS accuracy tidak cukup baik

2. **Accuracy bervariasi** berdasarkan:
   - GPS signal strength
   - Building density
   - Weather conditions
   - Device GPS hardware

3. **Offline mode tidak didukung**:
   - Memerlukan internet connection
   - GPS hanya mengumpulkan data lokal
   - Must be online untuk mengirim ke server

## 🔄 Update Status & GPS Integration

```javascript
// Driver Dashboard automatically does this:
await recordGPS({
  bookingId: bookingId,
  latitude: position.coords.latitude,
  longitude: position.coords.longitude,
  accuracy: position.coords.accuracy
});

// Then updates booking status:
await updateBooking({
  status: 'DEPARTED',
  currentCoords: {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    timestamp: new Date().toISOString()
  }
});
```

## 📞 Support

Jika ada masalah:
1. Check browser console untuk error messages
2. Verify GPS permissions di device settings
3. Try on different browser
4. Contact administrators dengan screenshot

## 🎓 Example Workflow

```
1. Admin membuat booking untuk Driver A
   ↓
2. Driver A menerima dan approve booking
   ↓
3. Driver A klik "Berangkat"
   - Browser request GPS permission
   - Driver click "Allow"
   - GPS location recorded
   - Status changed to DEPARTED
   ↓
4. Driver A berjalan ke tujuan
   - Setiap update status, GPS recorded
   ↓
5. Driver A tiba di tujuan, klik "Tiba"
   - GPS location recorded
   - Status changed to ARRIVED
   ↓
6. Employee membuka detail perjalanan
   - Lihat map dengan rute yang diambil
   - Total 4-5 waypoint tercatat
   - Garis oranye menghubungkan semua titik
   ↓
7. Driver selesai, klik "Selesai"
   - GPS location recorded terakhir
   - Status changed to COMPLETED
   - Employee dapat rate perjalanan
```

## 🌟 Future Improvements

Fitur yang kemungkinan ditambahkan:
- 🔴 Real-time GPS tracking (live)
- 📏 Speed & distance calculation
- 🚨 Geofencing alerts
- 📥 Export route as GPX/KML
- 🔥 Heatmap visualization
- 🛣️ Route optimization suggestions
- 📊 Performance analytics dashboard

---

**Last Updated**: February 20, 2026
**Version**: 1.0
**Status**: Production Ready ✅
