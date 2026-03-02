# SQLite Migration Complete ✅

## Summary
Local development environment telah berhasil dimigrasikan dari **MySQL** ke **SQLite**.

### Changes Made:
1. ✅ Updated `prisma/schema.prisma`:
   - Provider: `postgresql` → `sqlite`
   
2. ✅ Updated `.env` dan `.env.local`:
   - `DATABASE_URL="file:./prisma/dev.db"`
   
3. ✅ Created new migration for SQLite:
   - `prisma/migrations/20260301024904_init/migration.sql`
   
4. ✅ Seeded database dengan:
   - 1 Admin User (`admin@bi.go.id`)
   - 2 Employees (Budi Santoso, Siti Rahayu)
   - 2 Drivers (Joko Susanto, Dedi Kurniawan)
   - 2 Vehicles (B 1234 ABC, B 5678 DEF)
   - 5 Bookings (berbagai status)
   - WhatsApp Config & Templates

---

## Database File
```
prisma/dev.db (~100KB SQLite database)
```

---

## Environment Configuration

### `.env` (Default)
```dotenv
DATABASE_URL="file:./prisma/dev.db"
```

### `.env.local` (Local Override)
```dotenv
DATABASE_URL="file:./prisma/dev.db"
```

---

## Running Development

### Start Development Server:
```bash
bun run dev
```

### Access Admin Panel:
- URL: `http://localhost:3000/admin`
- Email: `admin@bi.go.id`
- Password: `ChangeMe@123` (default)

---

## Reset Database

### Full Reset (Migrations + Seed):
```bash
bun run db:reset
```

###  Only Reset Data (Keep Schema):
```bash
# Clear all data but keep tables
sqlite3 prisma/dev.db << EOF
DELETE FROM GPSWaypoint;
DELETE FROM Booking;
DELETE FROM LogBook;
DELETE FROM Vehicle;
DELETE FROM WhatsAppTemplate;
DELETE FROM WhatsAppRoute;
DELETE FROM WhatsAppConfig;
DELETE FROM User;
EOF

# Re-seed
bun ./prisma/seed-production.ts --force
```

### Fresh Database Setup:
```bash
rm prisma/dev.db
bun run db:migrate -- --name init
bun ./prisma/seed-production.ts --force
```

---

## Verify Seeding

### Check Data via Prisma:
```bash
bun run db:seed
```

### Check Data via SQLite CLI:
```bash
sqlite3 prisma/dev.db << EOF
SELECT 'Users:' as '';
SELECT COUNT(*) FROM User;
SELECT 'Vehicles:' as '';
SELECT COUNT(*) FROM Vehicle;
SELECT 'Bookings:' as '';
SELECT COUNT(*) FROM Booking;
EOF
```

---

## Advantages of SQLite for Development
- ✅ No external database server needed
- ✅ Single file database (easy backup/sharing)
- ✅ Zero configuration
- ✅ Fast development iteration
- ✅ All data in `prisma/dev.db` (can be gitignored)

---

## Notes
- Production database configuration remains unchanged (MySQL at 202.74.74.69)
- SQLite is used only for local development
- Can switch back to PostgreSQL/MySQL by changing `prisma/schema.prisma`
- All migrations are version-controlled in `prisma/migrations/`

---

Generated: March 1, 2026
