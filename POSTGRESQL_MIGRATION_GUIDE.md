# 🚀 PostgreSQL Production Deployment Guide

## ⚠️ Masalah yang Diperbaiki

**Masalah:** Login gagal di produksi karena ketidakcocokan database provider.

**Penyebab:** 
- Schema Prisma dikonfigurasi untuk SQLite
- Docker compose menggunakan MySQL
- VPS produksi menggunakan PostgreSQL
- Prisma Client di-generate untuk SQLite, tidak kompatibel dengan PostgreSQL

**Solusi:** Migrasi penuh ke PostgreSQL untuk semua environment.

---

## 📋 Perubahan yang Dilakukan

### 1. **Prisma Schema** (`prisma/schema.prisma`)
```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

### 2. **Docker Compose** (`docker-compose.production.yml`)
- Changed from MySQL 8.0 to PostgreSQL 16 Alpine
- Updated ports: 3306 → 5432
- Updated environment variables
- Updated health checks
- Updated volumes

### 3. **Dockploy Config** (`dockploy.yml`)
- Updated service name: mysql → postgres
- Updated backup command: mysqldump → pg_dump
- Updated environment variables

### 4. **Dockerfile** (`Dockerfile.production`)
- Changed client: mysql-client → postgresql-client

---

## 🔧 Deployment Steps

### Step 1: Backup Data (Jika Ada Data Lama)

```bash
# Jika masih ada data di database lama, backup dulu
# MySQL backup:
docker exec driver_booking_mysql_prod mysqldump -u driver -pdriver driver > backup_mysql.sql

# Atau SQLite backup:
cp prisma/dev.db backup_dev.db
```

### Step 2: Stop & Remove Old Containers

```bash
# Stop all containers
docker-compose -f docker-compose.production.yml down

# Remove old volumes (HATI-HATI: Ini akan menghapus data!)
docker volume rm driver_booking_mysql_prod
# atau
docker volume prune
```

### Step 3: Setup Environment Variables

```bash
# Buat file .env di VPS Anda
cat > .env << 'EOF'
# PostgreSQL Configuration
POSTGRES_USER=driver
POSTGRES_PASSWORD=YourSecurePassword123!
POSTGRES_DB=driver

# Database URL (will be auto-constructed in docker-compose)
DATABASE_URL=postgresql://driver:YourSecurePassword123!@postgres:5432/driver?schema=public

# Application
NODE_ENV=production
LOG_LEVEL=warn
ADMIN_PASSWORD=YourSecureAdminPassword!

# API
NEXT_PUBLIC_API_URL=https://your-domain.com

# WhatsApp (optional)
WA_API_URL=https://app.whacenter.com/api
WA_API_KEY=your-api-key
WA_PHONE_NUMBER=your-phone

EOF
```

### Step 4: Remove Old Migrations & Create New

```bash
# Hapus migration lama yang untuk SQLite
rm -rf prisma/migrations

# Generate migration baru untuk PostgreSQL
bunx prisma migrate dev --name init

# Atau jika sudah di production, gunakan:
bunx prisma migrate deploy
```

### Step 5: Build & Deploy

```bash
# Build ulang image dengan konfigurasi PostgreSQL
docker-compose -f docker-compose.production.yml build

# Start services
docker-compose -f docker-compose.production.yml up -d

# Check logs
docker-compose -f docker-compose.production.yml logs -f
```

### Step 6: Run Migrations & Seed

```bash
# Jalankan migrations
docker exec driver_booking_app_prod bunx prisma migrate deploy

# Seed initial data (user admin, dll)
docker exec driver_booking_app_prod bunx prisma db seed
```

### Step 7: Verify

```bash
# Check database connection
docker exec driver_booking_app_prod bunx prisma db pull

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@driver.com","password":"admin123"}'

# Check health
curl http://localhost:3000/api/health
```

---

## 🔍 Troubleshooting

### Error: "Can't reach database server"

**Solusi:**
```bash
# Check PostgreSQL container status
docker ps | grep postgres

# Check PostgreSQL logs
docker logs driver_booking_postgres_prod

# Verify DATABASE_URL format
echo $DATABASE_URL
# Should be: postgresql://user:password@postgres:5432/driver?schema=public
```

### Error: "Prisma Client was generated for SQLite"

**Solusi:**
```bash
# Re-generate Prisma Client
docker exec driver_booking_app_prod bunx prisma generate

# Rebuild container
docker-compose -f docker-compose.production.yml build app
docker-compose -f docker-compose.production.yml up -d app
```

### Error: "Migration failed"

**Solusi:**
```bash
# Reset database (HATI-HATI: Menghapus semua data!)
docker exec driver_booking_postgres_prod psql -U driver -d driver -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Re-run migrations
docker exec driver_booking_app_prod bunx prisma migrate deploy
docker exec driver_booking_app_prod bunx prisma db seed
```

### Login Masih Gagal

**Cek:**
1. **Database Connection:** Apakah app bisa connect ke database?
   ```bash
   docker exec driver_booking_app_prod bunx prisma db pull
   ```

2. **Prisma Client:** Apakah generated untuk PostgreSQL?
   ```bash
   docker exec driver_booking_app_prod cat node_modules/.prisma/client/schema.prisma | grep provider
   # Should show: provider = "postgresql"
   ```

3. **User Exists:** Apakah ada user di database?
   ```bash
   docker exec driver_booking_postgres_prod psql -U driver -d driver -c "SELECT id, email, role FROM \"User\";"
   ```

4. **Password Hash:** Apakah password ter-hash dengan benar?
   ```bash
   # Test manual login dengan bcrypt
   docker exec driver_booking_app_prod node -e "
   const bcrypt = require('bcrypt');
   const hash = '$2b$10$...'; // Copy hash dari database
   console.log(bcrypt.compareSync('admin123', hash));
   "
   ```

---

## 📊 Verification Checklist

- [ ] PostgreSQL container running
- [ ] App container running
- [ ] Database migrations applied
- [ ] Initial data seeded
- [ ] Admin user exists
- [ ] Login endpoint works
- [ ] Health check passes
- [ ] GPS tracking works (if used)
- [ ] WhatsApp notifications work (if configured)

---

## 🔐 Security Notes

1. **Change default passwords** in production:
   - POSTGRES_PASSWORD
   - ADMIN_PASSWORD

2. **Use strong passwords** (min 12 characters, mixed case, numbers, symbols)

3. **Restrict database access:**
   ```yaml
   # In docker-compose.production.yml
   postgres:
     ports:
       - "127.0.0.1:5432:5432"  # Only localhost can access
   ```

4. **Enable SSL for PostgreSQL** (recommended for production)

5. **Regular backups:**
   ```bash
   # Add to crontab
   0 2 * * * PGPASSWORD=your-password pg_dump -h localhost -U driver driver > /backups/daily_$(date +\%Y\%m\%d).sql
   ```

---

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_USER` | Database username | `driver` |
| `POSTGRES_PASSWORD` | Database password | `SecurePass123!` |
| `POSTGRES_DB` | Database name | `driver` |
| `DATABASE_URL` | Full connection string | `postgresql://driver:pass@postgres:5432/driver?schema=public` |
| `ADMIN_PASSWORD` | Default admin password | `Admin@123` |
| `NEXT_PUBLIC_API_URL` | Public API URL | `https://yourdomain.com` |

---

## 🆘 Need Help?

Jika masih ada masalah:

1. Check container logs:
   ```bash
   docker-compose -f docker-compose.production.yml logs -f app
   docker-compose -f docker-compose.production.yml logs -f postgres
   ```

2. Check network connectivity:
   ```bash
   docker exec driver_booking_app_prod ping postgres
   ```

3. Test database directly:
   ```bash
   docker exec -it driver_booking_postgres_prod psql -U driver -d driver
   ```

4. Rebuild everything:
   ```bash
   docker-compose -f docker-compose.production.yml down -v
   docker-compose -f docker-compose.production.yml build --no-cache
   docker-compose -f docker-compose.production.yml up -d
   ```

---

## ✅ Success Indicators

Setelah deployment berhasil, Anda harus bisa:

1. ✅ Login dengan admin account
2. ✅ Create booking baru
3. ✅ Assign driver ke booking
4. ✅ Track GPS location (jika enabled)
5. ✅ Receive WhatsApp notifications (jika configured)

**Test login:**
```bash
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@driver.com",
    "password": "admin123"
  }'
```

Expected response:
```json
{
  "user": {
    "id": "...",
    "email": "admin@driver.com",
    "role": "ADMIN",
    "name": "Administrator"
  },
  "token": "eyJ..."
}
```

---

## 📚 Additional Resources

- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [Docker PostgreSQL Image](https://hub.docker.com/_/postgres)
- [Dockploy Documentation](https://dockploy.io)

---

**Last Updated:** March 2, 2026
**Version:** 1.0.0
