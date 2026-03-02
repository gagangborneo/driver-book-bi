# Production Deployment Complete Checklist

## 📋 Pre-Deployment Checklist

### Environment Preparation
- [ ] MySQL database accessible at `202.74.74.69:3306`
- [ ] Database name: `driver`, user: `driver`, password set in `.env.production`
- [ ] All environment variables in `.env.production` configured
- [ ] WhatsApp API credentials set (WA_API_URL, WA_API_KEY)
- [ ] Admin password configured (ADMIN_PASSWORD)

### Code & Repo
- [ ] Latest code committed to `main` branch
- [ ] All pending migrations reviewed in `prisma/migrations/`
- [ ] `prisma/schema.prisma` valid and tested
- [ ] Seed script tested on staging
- [ ] All dependencies in `package.json` compatible with production

### Infrastructure
- [ ] Docker installed and configured
- [ ] Docker Compose installed (v1.29+)
- [ ] Minimum 2GB free disk space available
- [ ] Network connectivity confirmed to database host
- [ ] Firewall rules allow port 3000 and 3306

---

## 🚀 Deployment Steps

### Step 1: Pre-Migration Validation
```bash
npm run migration:pre
```
**Verification:**
- ✅ Environment variables validated
- ✅ Database connection successful
- ✅ Backup created in `.backups/`
- ✅ Prisma schema valid
- ✅ No migration conflicts

### Step 2: Apply Migrations & Seed
```bash
npm run migration:apply:prod:seed
```
**Verification:**
- ✅ All migrations applied successfully
- ✅ Prisma Client generated
- ✅ Production seed data created
- ✅ No errors in migration log

### Step 3: Build Docker Image
```bash
npm run docker:build:tag
```
**Verification:**
- ✅ Image built successfully
- ✅ Image tagged with timestamp
- ✅ Image size < 500MB

### Step 4: Start Services
```bash
npm run production:start
```
**Verification:**
- ✅ MySQL container running
- ✅ App container running
- ✅ Both services healthy
- ✅ Port 3000 accessible

### Step 5: Verify Deployment
```bash
npm run docker:compose:ps
npm run production:health
npm run production:monitor
```
**Verification:**
- ✅ Health endpoint returns 200
- ✅ Database connection active
- ✅ All tables present in database
- ✅ No errors in logs

---

## ✅ Post-Deployment Verification

### API Endpoints Check
- [ ] `GET /api/health` - Returns healthy status
- [ ] `POST /api/auth/login` - Login works
- [ ] `GET /api/bookings` - Fetch bookings
- [ ] `POST /api/bookings` - Create booking
- [ ] `GET /api/drivers` - List drivers
- [ ] `POST /api/gps/track` - GPS tracking

### Database Check
- [ ] User table has admin account
- [ ] Vehicle table populated
- [ ] WhatsApp config created
- [ ] Migration history recorded
- [ ] No orphaned records

### Application Check
- [ ] Admin dashboard loads
- [ ] Driver dashboard works
- [ ] Employee functions available
- [ ] Real-time GPS updates work
- [ ] WhatsApp notifications functional

### Performance Check
- [ ] Response time < 200ms (API endpoints)
- [ ] CPU usage < 25% idle
- [ ] Memory usage < 70%
- [ ] Disk space usage < 50%

---

## 🔄 Database Seeding Details

### What Gets Seeded (Production)
- ✅ Admin user (only if doesn't exist)
- ✅ Default vehicles (only if table empty)
- ✅ WhatsApp configuration (only if empty)
- ✅ WhatsApp templates (only if empty)

### What Won't Be Overwritten
- ❌ Existing users/employees
- ❌ Active bookings
- ❌ Historical data
- ❌ Custom templates

### To Force Reseed
```bash
npm run prisma:seed:production:force
```
⚠️ Use only with caution and after backup!

---

## 📊 Monitoring Commands

```bash
# View application logs
npm run production:logs

# Monitor migration status
npm run production:monitor

# Check service status
npm run docker:compose:ps

# Health check endpoint
npm run production:health

# Database connection test
mysql -h 202.74.74.69 -u driver -p driver -e "USE driver; SELECT COUNT(*) FROM user;"

# Docker resource usage
docker stats
```

---

## 🔙 Rollback Procedure

### If Migration Fails

```bash
# List available backups
npm run migration:rollback -- --list

# Rollback to specific backup
npm run migration:rollback -- backup_pre_migration_20260301_010000.sql
```

### If Application Fails After Deployment

```bash
# Stop services
npm run production:stop

# Restore from backup
mysql -h 202.74.74.69 -u driver -p driver driver < .backups/backup_pre_migration_YYYYMMDD_HHMMSS.sql

# Restart services
npm run production:start
```

---

## 📝 Important Files & Locations

### Scripts
- `scripts/pre-migration.sh` - Pre-deployment validation
- `scripts/apply-migration.sh` - Apply migrations
- `scripts/rollback-migration.sh` - Emergency rollback
- `scripts/monitor-migration.sh` - Monitoring dashboard

### Configuration Files
- `prisma/schema.prisma` - Database schema
- `prisma/seed-production.ts` - Production seeding
- `Dockerfile.production` - Production image
- `docker-compose.production.yml` - Service composition
- `dockploy.yml` - Deployment configuration

### Logs & Backups
- `logs/` - Application logs
- `.backups/` - Database backups
- `migration_*.log` - Migration logs

---

## ⚠️ Critical Points

### Never Do This in Production
- [ ] Run `prisma migrate reset --force` (deletes all data!)
- [ ] Run `npm run prisma:seed` (general seed, may overwrite data)
- [ ] Edit migration files directly
- [ ] Delete backup files without archiving

### Always Do This
- [ ] Create backup BEFORE migration
- [ ] Run pre-migration checks
- [ ] Test migrations on staging first
- [ ] Monitor logs after deployment
- [ ] Keep 30 days of backups
- [ ] Document any manual changes

---

## 📞 Support & Troubleshooting

### Issue: Database Connection Failed
```bash
# Check if MySQL is running
docker-compose -f docker-compose.production.yml logs mysql

# Verify credentials
mysql -h 202.74.74.69 -u driver -p driver -e "SELECT 1"
```

### Issue: Migration Hangs
```bash
# Check active processes
mysql -h 202.74.74.69 -u driver -p driver -e "SHOW PROCESSLIST;"

# Kill long-running queries
mysql -h 202.74.74.69 -u driver -p driver -e "KILL <process_id>;"
```

### Issue: Disk Space Low
```bash
# Check disk usage
df -h

# Clean old logs
find logs -name "*.log" -mtime +30 -delete

# Clean old backups
find .backups -name "*.sql" -mtime +30 -delete
```

### Issue: Container Crashes
```bash
# Check logs
npm run production:logs

# Check health
docker inspect driver_booking_app_prod --format='{{json .State.Health}}'

# Restart container
docker restart driver_booking_app_prod
```

---

## 🎯 Next Steps After Successful Deployment

1. **Monitor for 24 hours**
   - Watch logs for errors
   - Monitor CPU/memory/disk usage
   - Track user activity

2. **Create Production Backup**
   ```bash
   mysqldump -h 202.74.74.69 -u driver -p driver driver > .backups/backup_production_baseline.sql
   ```

3. **Set Up Autom atic Backups**
   - Daily incremental backups
   - Weekly full backups
   - Off-site backup copies

4. **Configure Monitoring**
   - Set up error tracking
   - Configure uptime monitoring
   - Set up log aggregation

5. **Team Communication**
   - Document deployment date/time
   - Share deployment notes
   - Brief team on changes
   - Set up incident response plan

---

## 📖 Complete Command Reference

```bash
# Pre-deployment
npm run migration:pre              # Validation & backup

# Deployment
npm run migration:apply:prod:seed  # Full migration with seed
npm run deploy:production          # Complete deployment

# Docker
npm run docker:build:tag           # Build image with tag
npm run production:start           # Start services
npm run production:stop            # Stop services

# Monitoring
npm run production:logs            # View logs
npm run production:monitor         # Monitoring dashboard
npm run production:health          # Health check

# Emergency
npm run migration:rollback         # Emergency rollback
npm run production:reset           # Full reset (! dangerous)
```

---

## ✨ Success Indicators

When deployment is successful, you should see:

- ✅ All containers running (`npm run docker:compose:ps`)
- ✅ Health endpoint returning green status
- ✅ No errors in application logs
- ✅ Database tables visible and populated
- ✅ Admin user can login
- ✅ All API endpoints responding correctly
- ✅ WhatsApp integration working
- ✅ GPS tracking functional
- ✅ Database backups created automatically

**Deployment is complete and ready for production!** 🎉
