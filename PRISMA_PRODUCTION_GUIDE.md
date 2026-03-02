# Prisma Migration & Seeding - Production Deployment Guide

## 📋 Daftar Isi
1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Environment Configuration](#environment-configuration)
4. [Migration Strategy](#migration-strategy)
5. [Seeding Strategy](#seeding-strategy)
6. [Docker Setup](#docker-setup)
7. [Dockploy Integration](#dockploy-integration)
8. [Monitoring & Rollback](#monitoring--rollback)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Production deployment memerlukan strategi yang hati-hati untuk:
- ✅ Zero-downtime deployments
- ✅ Data integrity
- ✅ Easy rollback jika ada masalah
- ✅ Audit trail untuk setiap perubahan
- ✅ Database backup sebelum migration

---

## Pre-Deployment Checklist

### ☑️ Sebelum Deploy ke Production

```bash
# 1. Backup database production
mysqldump -h 202.74.74.69 -u driver -p driver > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Test migration di staging environment
npm run prisma:migrate:test

# 3. Review migration files
ls -la prisma/migrations/

# 4. Verify semua migration file valid
npx prisma validate

# 5. Check status database
npx prisma migrate status

# 6. Review seed data
cat prisma/seed.ts
```

---

## Environment Configuration

### Development (.env.development)
```env
# Development MySQL
DATABASE_URL="mysql://driver:driver@localhost:3306/driver_dev"
NODE_ENV="development"
LOG_LEVEL="debug"
ENABLE_SEEDING="true"
```

### Staging (.env.staging)
```env
# Staging MySQL
DATABASE_URL="mysql://driver:driver@staging-db.example.com:3306/driver_staging"
NODE_ENV="staging"
LOG_LEVEL="info"
ENABLE_SEEDING="false"
PRISMA_SKIP_VALIDATION_WARNINGS="true"
```

### Production (.env.production)
```env
# Production MySQL - Secure!
DATABASE_URL="mysql://driver:driver@202.74.74.69:3306/driver"
NODE_ENV="production"
LOG_LEVEL="warn"
ENABLE_SEEDING="false"
PRISMA_SKIP_VALIDATION_WARNINGS="true"
DATABASE_BACKUP_ENABLED="true"
```

---

## Migration Strategy

### 1. Membuat Migration File Baru

```bash
# Setiap kali ada perubahan schema
npx prisma migrate dev --name add_feature_description

# Contoh:
npx prisma migrate dev --name add_user_status_field
npx prisma migrate dev --name create_booking_ratings_table
```

### 2. Review Migration File

Setelah membuat migration, review file di:
```
prisma/migrations/[timestamp]_[name]/migration.sql
```

Pastikan:
- ✅ SQL syntax benar
- ✅ Tidak ada data loss
- ✅ Index sudah ditambahkan jika perlu
- ✅ Foreign keys proper

### 3. Pre-Migration Checks

```bash
#!/bin/bash
# scripts/pre-migration.sh

set -e

echo "🔍 Pre-Migration Checks..."

# 1. Backup database
echo "📦 Backing up database..."
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME > ".backups/$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"

# 2. Validate schema
echo "🔎 Validating schema..."
npx prisma validate

# 3. Check migration status
echo "📊 Current migration status:"
npx prisma migrate status

# 4. List pending migrations
echo "⏳ Pending migrations:"
npx prisma migrate resolve --preview

echo "✅ Pre-migration checks passed!"
```

### 4. Apply Migration (Production)

```bash
#!/bin/bash
# scripts/apply-migration-production.sh

set -e

# Load environment
source .env.production

echo "🚀 Applying migration to PRODUCTION..."
echo "Database: $DATABASE_URL"
echo "Press ENTER to continue or CTRL+C to cancel..."
read

# Create backup before migration
BACKUP_FILE="backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql"
echo "📦 Creating backup: $BACKUP_FILE"
mysqldump -h 202.74.74.69 -u driver -p$DB_PASSWORD driver > ".backups/$BACKUP_FILE"

# Log migration start
echo "[$(date)] Migration started" >> migration.log

# Apply migration
echo "⏳ Applying migrations..."
npx prisma migrate deploy

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Log migration completion
echo "[$(date)] Migration completed successfully" >> migration.log

echo "✅ Production migration completed!"
```

---

## Seeding Strategy

### 1. Production Seeding Best Practices

```typescript
// prisma/seed-production.ts
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedProduction() {
  console.log('🌱 Starting production seeding...');

  try {
    // 1. Seed critical data only (don't overwrite existing data)
    await seedAdminUser();
    await seedDefaultVehicles();
    await seedWhatsAppConfig();

    console.log('✅ Production seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function seedAdminUser() {
  const adminExists = await prisma.user.findUnique({
    where: { email: 'admin@bi.go.id' },
  });

  if (!adminExists) {
    console.log('👤 Creating admin user...');
    await prisma.user.create({
      data: {
        email: 'admin@bi.go.id',
        name: 'Admin',
        phone: '082112345678',
        password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'ChangeMe@123', 10),
        role: UserRole.ADMIN,
        isActive: true,
      },
    });
    console.log('✅ Admin user created');
  } else {
    console.log('⏭️  Admin user already exists, skipping...');
  }
}

async function seedDefaultVehicles() {
  const vehicleCount = await prisma.vehicle.count();

  if (vehicleCount === 0) {
    console.log('🚗 Creating default vehicles...');
    // Add default vehicles only if table is empty
    await prisma.vehicle.createMany({
      data: [
        {
          licensePlate: 'B 1234 ABC',
          name: 'Vehicle 1',
          brand: 'Toyota',
          model: 'Avanza',
          type: 'MPV',
          status: 'AVAILABLE',
        },
      ],
    });
    console.log('✅ Vehicles created');
  } else {
    console.log('⏭️  Vehicles already exist, skipping...');
  }
}

async function seedWhatsAppConfig() {
  const configExists = await prisma.whatsappConfig.findFirst();

  if (!configExists) {
    console.log('📱 Creating WhatsApp configuration...');
    await prisma.whatsappConfig.create({
      data: {
        apiUrl: process.env.WA_API_URL || 'https://app.whacenter.com/api/send',
        apiKey: process.env.WA_API_KEY || '',
        phoneNumber: process.env.WA_PHONE_NUMBER || '',
        isActive: true,
      },
    });
    console.log('✅ WhatsApp config created');
  } else {
    console.log('⏭️  WhatsApp config already exists, skipping...');
  }
}

seedProduction();
```

### 2. Seed Script di package.json

```json
{
  "scripts": {
    "prisma:seed": "bun ./prisma/seed.ts",
    "prisma:seed:production": "NODE_ENV=production bun ./prisma/seed-production.ts",
    "prisma:seed:safe": "npx prisma db seed --skip-generate",
    "prisma:migrate": "npx prisma migrate dev",
    "prisma:migrate:test": "npm run prisma:migrate -- --name test",
    "prisma:migrate:deploy": "npx prisma migrate deploy",
    "prisma:validate": "npx prisma validate",
    "prisma:status": "npx prisma migrate status",
    "prisma:reset": "npx prisma migrate reset --force"
  }
}
```

---

## Docker Setup

### Dockerfile Production

```dockerfile
# Dockerfile.production
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN npm install -g bun && bun install

# Copy source
COPY . .

# Generate Prisma Client
RUN bunx prisma generate

# Build application
RUN bun run build

# Production image
FROM node:20-alpine

WORKDIR /app

RUN npm install -g bun

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

USER nextjs

EXPOSE 3000

# Scripts untuk migration
COPY --chown=nextjs:nodejs scripts/ ./scripts/

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["bun", "start"]
```

### docker-compose.yml untuk Testing

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: driver_booking_mysql
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: driver
      MYSQL_USER: driver
      MYSQL_PASSWORD: driver
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  app:
    build:
      context: .
      dockerfile: Dockerfile.production
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: "mysql://driver:driver@mysql:3306/driver"
      NODE_ENV: production
    depends_on:
      mysql:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  mysql_data:
```

---

## Dockploy Integration

### 1. Dockploy Configuration File

```yaml
# dockploy.yml
version: '1'

services:
  driver-booking:
    image: your-registry/driver-booking:latest
    container_name: driver-booking-prod
    restart: always
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      NODE_ENV: production
      WA_API_URL: ${WA_API_URL}
      WA_API_KEY: ${WA_API_KEY}
    volumes:
      - ./logs:/app/logs
      - ./backups:/app/.backups
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    depends_on:
      - mysql

  mysql:
    image: mysql:8.0
    container_name: driver-booking-mysql
    restart: always
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: driver
      MYSQL_USER: driver
      MYSQL_PASSWORD: driver
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  mysql_data:
    driver: local
```

### 2. Pre-deployment Hook Script

```bash
#!/bin/bash
# dockploy/hooks/pre-deploy.sh

set -e

echo "🔍 Running pre-deployment checks..."

# 1. Validate environment variables
required_vars=("DATABASE_URL" "WA_API_URL" "WA_API_KEY")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Required environment variable not set: $var"
    exit 1
  fi
done

echo "✅ All required environment variables are set"

# 2. Test database connection
echo "🔗 Testing database connection..."
# Extract database info from DATABASE_URL
# mysql://driver:driver@202.74.74.69:3306/driver
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\).*/\1/p')
DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\).*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "Connecting to MySQL at $DB_HOST..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" > /dev/null 2>&1 || {
  echo "❌ Database connection failed"
  exit 1
}

echo "✅ Database connection successful"

# 3. Create backup
echo "📦 Creating database backup..."
BACKUP_DIR="/backups"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"

mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE" || {
  echo "❌ Backup failed"
  exit 1
}

echo "✅ Backup created: $BACKUP_FILE"

# 4. Validate migration files
echo "🔍 Validating migration files..."
# This would be done inside the container
echo "✅ Migration validation will be done during deploy"

echo "✅ Pre-deployment checks passed!"
```

### 3. Post-deployment Hook Script

```bash
#!/bin/bash
# dockploy/hooks/post-deploy.sh

set -e

echo "🚀 Running post-deployment steps..."

# Get container ID
CONTAINER_ID=$(docker ps -q -f "name=driver-booking-prod")

if [ -z "$CONTAINER_ID" ]; then
  echo "❌ Container not found"
  exit 1
fi

# 1. Run Prisma migration
echo "⏳ Running Prisma migrations..."
docker exec "$CONTAINER_ID" npx prisma migrate deploy || {
  echo "❌ Migration failed!"
  exit 1
}

echo "✅ Migrations applied successfully"

# 2. Generate Prisma client
echo "🔧 Generating Prisma client..."
docker exec "$CONTAINER_ID" npx prisma generate

# 3. Seed database (if needed)
if [ "$SEED_DATABASE" = "true" ]; then
  echo "🌱 Seeding database..."
  docker exec "$CONTAINER_ID" npm run prisma:seed:production
  echo "✅ Database seeded"
fi

# 4. Health check
echo "🏥 Running health checks..."
for i in {1..10}; do
  if docker exec "$CONTAINER_ID" curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Application is healthy"
    exit 0
  fi
  echo "⏳ Health check attempt $i/10..."
  sleep 5
done

echo "❌ Application health check failed"
exit 1
```

### 4. Deployment Command

```bash
#!/bin/bash
# deploy-production.sh

set -e

echo "🚀 Deploying to production..."

# Set environment
export DATABASE_URL="mysql://driver:driver@202.74.74.69:3306/driver"
export NODE_ENV="production"
export WA_API_URL="https://app.whacenter.com/api/send"
export WA_API_KEY="4de5a784d5b039ded4665fa073ae460d"

# Run dockploy
dockploy deploy \
  --config dockploy.yml \
  --pre-hook dockploy/hooks/pre-deploy.sh \
  --post-hook dockploy/hooks/post-deploy.sh \
  --timeout 300 \
  --backup

echo "✅ Deployment completed successfully!"
```

---

## Monitoring & Rollback

### 1. Migration Monitoring

```bash
#!/bin/bash
# scripts/monitor-migration.sh

echo "📊 Monitoring migration status..."

# Check Prisma status
npx prisma migrate status

# Check database size
mysql -h 202.74.74.69 -u driver -p driver -e "
  SELECT 
    TABLE_NAME,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS Size_MB
  FROM information_schema.tables
  WHERE table_schema = 'driver'
  ORDER BY (data_length + index_length) DESC;
"

# Check for errors
tail -n 50 migration.log | grep -i error || echo "No errors found"
```

### 2. Rollback Procedure

```bash
#!/bin/bash
# scripts/rollback-migration.sh

set -e

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./rollback-migration.sh <backup-file>"
  echo "Available backups:"
  ls -la .backups/
  exit 1
fi

echo "⚠️  Rolling back to: $BACKUP_FILE"
echo "Press ENTER to continue or CTRL+C to cancel..."
read

# Stop application
echo "🛑 Stopping application..."
docker-compose down

# Restore backup
echo "📦 Restoring database..."
mysql -h 202.74.74.69 -u driver -p driver < ".backups/$BACKUP_FILE"

# Reset Prisma state
echo "🔄 Resetting Prisma migrations..."
npx prisma migrate resolve --rolled-back --latest

# Start application
echo "🚀 Starting application..."
docker-compose up -d

echo "✅ Rollback completed!"
```

### 3. Health Check Endpoint

```typescript
// src/app/api/health/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check migrations status
    const migrations = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM _prisma_migrations;
    `;

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      migrations: migrations,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

---

## Troubleshooting

### Issue: Migration Failed

```bash
# 1. Check migration status
npx prisma migrate status

# 2. Check migration history
npx prisma migrate history

# 3. Resolve failed migration
npx prisma migrate resolve --rolled-back <migration-name>

# 4. Retry migration
npx prisma migrate deploy
```

### Issue: Seeding Failed

```bash
# 1. Check seed script syntax
npx ts-node prisma/seed.ts

# 2. Verify database connection
mysql -h 202.74.74.69 -u driver -p driver -e "USE driver; SHOW TABLES;"

# 3. Reset and reseed (development only!)
npx prisma migrate reset --force
```

### Issue: Prisma Client Out of Sync

```bash
# Regenerate Prisma Client
npx prisma generate --force

# Clear cache
rm -rf node_modules/.prisma
```

### Issue: Database Lock

```bash
# Check active connections
mysql -h 202.74.74.69 -u driver -p driver -e "SHOW PROCESSLIST;"

# Kill specific process
mysql -h 202.74.74.69 -u driver -p driver -e "KILL <process_id>;"
```

---

## Quick Reference Commands

```bash
# Migration Commands
npx prisma migrate dev --name <migration-name>    # Create migration
npx prisma migrate deploy                         # Apply migrations
npx prisma migrate status                         # Check status
npx prisma migrate resolve --rolled-back <name>  # Mark as rolled back

# Seeding Commands
npm run prisma:seed                               # Run seed script
npm run prisma:seed:production                    # Production seeding

# Validation
npx prisma validate                               # Validate schema
npx prisma validate --generate                    # Validate & generate client

# Backup
mysqldump -h 202.74.74.69 -u driver -p driver driver > backup.sql

# Restore
mysql -h 202.74.74.69 -u driver -p driver driver < backup.sql
```

---

## Summary

✅ **Langkah-langkah Production Deployment:**

1. **Pre-Deployment**: Backup database dan validate schema
2. **Migration**: Apply pending migrations with `npx prisma migrate deploy`
3. **Seeding**: Run production seeding dengan `npm run prisma:seed:production`
4. **Post-Deployment**: Health check dan monitoring
5. **Rollback**: Siapkan backup untuk emergency rollback

Semua proses ini sudah terintegrasi dalam Dockploy hooks untuk automation penuh!

