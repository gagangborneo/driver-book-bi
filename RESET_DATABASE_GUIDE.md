# Database Reset & Production Seeding Guide

## Situasi:
Anda ingin menghapus semua data production dan menjalankan seeder ulang dari awal.

---

## Method 1: Using Prisma CLI (RECOMMENDED)

### Step 1: Reset Database Schema
```bash
# Ini akan drop semua tables dan recreate dari migrations
bun run db:reset
```
**Note:** Command ini akan menanyakan konfirmasi karena destructive.

### Step 2: Generate Prisma Client
```bash
bun run db:generate
```

### Step 3: Run Production Seeder
```bash
# Pertama kali tanpa --force (untuk pengecekan)
bun ./prisma/seed-production.ts

# Atau dengan --force (untuk update existing data)
bun ./prisma/seed-production.ts --force
```

---

## Method 2: Manual MySQL Commands

### Backup terlebih dahulu:
```bash
mysqldump -u driver -p driver > backup_$(date +%Y%m%d_%H%M%S).sql
Enter password: [masukkan password]
```

### Drop & Recreate Database:
```bash
mysql -u driver -p

# Masukkan password, kemudian:
DROP DATABASE driver;
CREATE DATABASE driver;
EXIT;
```

### Recreate Schema:
```bash
bun run db:push
```

### Seed Data:
```bash
bun ./prisma/seed-production.ts --force
```

---

## Method 3: Using Shell Script (AUTOMATED)

```bash
chmod +x reset-and-seed.sh
./reset-and-seed.sh
```

Script ini akan:
1. ✅ Backup database otomatis
2. ✅ Reset schema menggunakan Prisma
3. ✅ Run production seeder
4. ✅ Verify hasil

---

## Method 4: Keep Migrations, Only Clear Data (SAFEST)

Jika ingin keep migration history tapi clear semua data:

```bash
mysql -u driver -p driver << EOF
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE GPSWaypoint;
TRUNCATE TABLE Booking;
TRUNCATE TABLE LogBook;
TRUNCATE TABLE Vehicle;
TRUNCATE TABLE WhatsAppTemplate;
TRUNCATE TABLE WhatsAppRoute;
TRUNCATE TABLE WhatsAppConfig;
TRUNCATE TABLE User;
SET FOREIGN_KEY_CHECKS = 1;
EOF
```

Kemudian seed:
```bash
bun ./prisma/seed-production.ts --force
```

---

## Verification After Seeding

### Check Admin User Created:
```bash
mysql -u driver -p driver << EOF
SELECT id, email, name, role FROM User WHERE role = 'ADMIN';
EOF
```

### Check Test Data:
```bash
mysql -u driver -p driver << EOF
SELECT COUNT(*) as total_users FROM User;
SELECT COUNT(*) as total_vehicles FROM Vehicle;
SELECT COUNT(*) as total_bookings FROM Booking;
EOF
```

---

## Troubleshooting

### Error: "Foreign key constraint fails"
- Pastikan disable FOREIGN_KEY_CHECKS sebelum truncate
- Atau gunakan `bun run db:reset` (Prisma handle ini otomatis)

### Error: "Unique constraint failed"
- Database belum benar-benar kosong
- Gunakan Method 2 atau Method 3 untuk reset total

### Error: "Database connection refused"
- Check `DATABASE_URL` di `.env.local`
- Pastikan MySQL server running: `mysql -u driver -p -e "SELECT 1;"`

### Admin User tidak ter-seed:
- Pastikan `.env.local` ada ADMIN_PASSWORD variable (optional, ada default)
- Re-run: `bun ./prisma/seed-production.ts --force`

---

## Production vs Development

### Development:
```bash
# Lebih agresif, bisa reset kapan saja
bun run db:reset
bun ./prisma/seed.ts
```

### Production:
```bash
# Hati-hati, selalu backup terlebih dahulu
mysqldump -u driver -p driver > backup.sql
bun ./prisma/seed-production.ts --force
```

---

## Data Created After Seeding

| Item | Count | Details |
|------|-------|---------|
| Admin User | 1 | Email: admin@bi.go.id |
| Employees | 2 | Test employee users |
| Drivers | 2 | Test driver users |
| Vehicles | 2 | B 1234 ABC, B 5678 DEF |
| Bookings | 5 | Various status (PENDING, APPROVED, etc) |
| WhatsApp Config | 1 | Default WhatsApp configuration |
| WhatsApp Templates | 3 | BOOKING, COMPLETED, CANCELLED |

---

## Quick Reference Commands

```bash
# Full reset (recommended way)
bun run db:reset && bun ./prisma/seed-production.ts --force

# Or use the automated script
./reset-and-seed.sh

# Query verification
mysql -u driver -p driver -e "SELECT COUNT(*) as users FROM User; SELECT COUNT(*) as vehicles FROM Vehicle;"
```
