# Production Migration Scripts - README

Dokumentasi lengkap untuk semua scripts yang digunakan dalam production deployment.

## 📁 File Structure

```
scripts/
├── pre-migration.sh           # Pre-deployment validation
├── apply-migration.sh         # Apply migrations
├── rollback-migration.sh      # Emergency rollback
└── monitor-migration.sh       # Monitoring dashboard

prisma/
├── schema.prisma              # Database schema
├── seed.ts                    # Development seed
└── seed-production.ts         # Production seed

docker/
├── Dockerfile.production      # Production Docker image
├── docker-compose.production.yml
└── dockploy.yml              # Dockploy configuration

documentation/
├── PRISMA_PRODUCTION_GUIDE.md # Complete guide
├── DEPLOYMENT_GUIDE.sh        # Step-by-step guide
└── DEPLOYMENT_CHECKLIST.md    # Checklist
```

## 🚀 Quick Commands

```bash
# 1. Pre-deployment checks
npm run migration:pre

# 2. Apply migrations with seeding
npm run migration:apply:prod:seed

# 3. Build and start services
npm run docker:build:tag
npm run production:start

# 4. Monitor
npm run production:logs
npm run production:monitor

# 5. Emergency rollback (if needed)
npm run migration:rollback -- <backup-file>
```

## 📝 Scripts Details

### 1. `pre-migration.sh`
**Tujuan:** Validasi sebelum deployment

**Fungsi:**
- ✅ Validasi environment variables
- ✅ Test database connection
- ✅ Create automatic backup
- ✅ Validate Prisma schema
- ✅ Check migration status

**Usage:**
```bash
npm run migration:pre
bash ./scripts/pre-migration.sh
```

**Output:**
```
✅ Environment loaded from .env.production
✅ All required environment variables are set
✅ Database connection successful
✅ Database 'driver' exists
✅ Backup created: .backups/backup_pre_migration_20260301_010000.sql
✅ Prisma schema is valid
✅ All pre-migration checks passed!
```

---

### 2. `apply-migration.sh`
**Tujuan:** Apply migrations ke database

**Fungsi:**
- ✅ Load environment variables
- ✅ Validate schema
- ✅ Apply pending migrations
- ✅ Generate Prisma Client
- ✅ Optional: Seed database
- ✅ Verify success

**Usage:**
```bash
# Standard migration
npm run migration:apply

# With seeding
npm run migration:apply:seed

# Production mode
npm run migration:apply:prod

# Production with seeding
npm run migration:apply:prod:seed

# Manual
bash ./scripts/apply-migration.sh
bash ./scripts/apply-migration.sh --with-seed
bash ./scripts/apply-migration.sh --production --with-seed
```

**Options:**
- `--with-seed` - Run database seeding after migration
- `--production` - Require confirmation for production

**Output:**
```
✅ Starting migration at Fri Mar 01 10:00:00 UTC 2026
✅ Environment loaded
✅ Schema validation passed
✅ Migrations applied successfully
✅ Prisma Client generated
✅ Production seeding completed
✅ Migration completed successfully!
```

---

### 3. `rollback-migration.sh`
**Tujuan:** Roll back ke backup sebelumnya (EMERGENCY)

**Fungsi:**
- ⚠️ Restore database from backup
- ⚠️ Reset Prisma migration state
- ⚠️ Restart application container
- ⚠️ Verify rollback success

**Usage:**
```bash
# List available backups
npm run migration:rollback -- --list
bash ./scripts/rollback-migration.sh --list

# Rollback ke specific backup
npm run migration:rollback -- backup_pre_migration_20260301_010000.sql
bash ./scripts/rollback-migration.sh backup_pre_migration_20260301_010000.sql
```

**Requires Confirmation:**
```
⚠️  ROLLBACK WARNING
This action will:
  1. Restore database from: .backups/backup_pre_migration_20260301_010000.sql
  2. Reset all Prisma migrations
  3. Potentially lose recent data

THIS ACTION CANNOT BE UNDONE!

Type 'yes-rollback' to confirm:
```

---

### 4. `monitor-migration.sh`
**Tujuan:** Monitor migration status dan database health

**Fungsi:**
- 📊 Prisma migration status
- 📊 Database connection
- 📊 Database size
- 📊 Table sizes
- 📊 Active connections
- 📊 Migration history
- 📊 Error checking
- 📊 Health check

**Usage:**
```bash
npm run migration:monitor
npm run production:monitor
bash ./scripts/monitor-migration.sh
```

**Output:**
```
═══════════════════════════════════════════════════════════════
📊 Migration Monitoring Dashboard
═══════════════════════════════════════════════════════════════

1️⃣  PRISMA MIGRATION STATUS
───────────────────────────────────────────────────────────────
Prisma Migrate 0.0.1

database : MySQL database 'driver' at '202.74.74.69:3306'

3 migrations found in prisma/migrations

✓ 20260219224356_init
✓ 20260220002006_add_rating_to_booking
✓ 20260220035022_add_gps_waypoints

[Database is up to date]

2️⃣  DATABASE CONNECTION
───────────────────────────────────────────────────────────────
✅ Connection successful
...
```

---

## 🌱 Seeding

### Development Seeding
```bash
npm run prisma:seed
```
**Creates:**
- 7 users (Admin, Employees, Drivers)
- 3 vehicles
- 2 sample bookings
- WhatsApp configuration
- WhatsApp templates

**Note:** Overwrites existing data (gunakan di development saja)

### Production Seeding
```bash
npm run prisma:seed:production
```
**Creates (only if empty):**
- Admin user (jika tidak ada)
- Default vehicles (jika table kosong)
- WhatsApp config (jika belum ada)
- WhatsApp templates (jika belum ada)

**Features:**
- ✅ Won't overwrite existing data
- ✅ Safe untuk production
- ✅ Idempotent (aman dijalankan berkali-kali)

### Force Reseed
```bash
npm run prisma:seed:production:force
```
**⚠️ HATI-HATI:** Akan update semua seeding data bahkan jika sudah ada.
Gunakan hanya dopo backup!

---

## 📊 Monitoring Endpoint

Akses monitoring dashboard:
```bash
npm run production:monitor
```

Atau manual:
```bash
bash ./scripts/monitor-migration.sh
```

Monitor real-time logs:
```bash
npm run production:logs

# Atau manual
docker-compose -f docker-compose.production.yml logs -f app
```

---

## 🔙 Disaster Recovery Procedures

### Full Rollback Procedure
```bash
# 1. List available backups
npm run migration:rollback -- --list

# 2. Stop services
npm run production:stop

# 3. Restore database
npm run migration:rollback -- <backup-file>

# 4. Restart services
npm run production:start

# 5. Verify
npm run production:health
npm run production:monitor
```

### Manual Database Restore
```bash
# List tables
mysql -h 202.74.74.69 -u driver -p driver -e "USE driver; SHOW TABLES;"

# Restore from backup
mysql -h 202.74.74.69 -u driver -p driver driver < .backups/backup_file.sql

# Verify
mysql -h 202.74.74.69 -u driver -p driver -e "USE driver; SELECT COUNT(*) FROM user;"
```

---

## 🐛 Troubleshooting

### Migration Hung or Stuck
```bash
# Check active processes
mysql -h 202.74.74.69 -u driver -p driver -e "SHOW PROCESSLIST;"

# Kill process (if needed)
mysql -h 202.74.74.69 -u driver -p driver -e "KILL <process_id>;"
```

### Prisma Client Out of Sync
```bash
# Regenerate
npm run prisma:generate

# Or with force
npx prisma generate --force
```

### Database Connection Issues
```bash
# Test connection
mysql -h 202.74.74.69 -u driver -p driver -e "SELECT 1"

# Check database size
mysql -h 202.74.74.69 -u driver -p driver -e "SELECT SUM(data_length + index_length) FROM information_schema.tables WHERE table_schema='driver';"
```

### Check Logs
```bash
# Application logs
npm run production:logs

# Migration logs
cat migration_*.log

# Docker logs
docker logs driver_booking_app_prod
docker logs driver_booking_mysql_prod
```

---

## 📌 Best Practices

✅ **Always:**
- Create backup BEFORE migration
- Run pre-migration checks first
- Test on staging before production
- Monitor logs after deployment
- Keep 30 days of backups

❌ **Never:**
- Edit migration files after deployed
- Run `prisma migrate reset --force` in production
- Delete backup files without archiving
- Skip pre-migration validation
- Ignore error messages

---

## 🔒 Security Notes

### Credentials Management
- Store credentials in `.env.production` (not in version control)
- Use strong passwords for database
- Rotate credentials regularly
- Never commit credentials to git

### Database Backups
- Store backups securely
- Encrypt sensitive backups
- Keep off-site copies
- Test restore procedures

### Access Control
- Limit database access by IP
- Use different users for different environments
- Enable database logging/auditing
- Monitor access patterns

---

## 📞 Support

Jika ada masalah:
1. Baca ` PRISMA_PRODUCTION_GUIDE.md` untuk detail lengkap
2. Check logs dengan `npm run production:logs`
3. Run `npm run production:monitor` untuk dashboard
4. Refer ke `DEPLOYMENT_CHECKLIST.md` untuk checklist

---

**Last Updated:** March 1, 2026
**Version:** 1.0.0
**Maintained By:** DevOps Team
