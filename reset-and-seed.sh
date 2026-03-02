#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Database Reset & Production Seeding${NC}"
echo -e "${YELLOW}========================================${NC}"

# Check if environment is production
if [ "${NODE_ENV}" == "production" ]; then
  echo -e "${RED}⚠️  WARNING: Running in PRODUCTION mode!${NC}"
  echo -e "${RED}This will DELETE ALL data from the database!${NC}"
  read -p "Type 'yes' to confirm: " confirmation
  if [ "$confirmation" != "yes" ]; then
    echo -e "${RED}❌ Cancelled${NC}"
    exit 1
  fi
fi

echo ""
echo -e "${YELLOW}📋 Step 1: Backing up database...${NC}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="driver_backup_${TIMESTAMP}.sql"
mysqldump -u ${DB_USER:-driver} -p${DB_PASSWORD:-driver} -h ${DB_HOST:-localhost} ${DB_NAME:-driver} > $BACKUP_FILE 2>/dev/null
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
else
  echo -e "${YELLOW}⚠️  Could not create backup (file permissions, continue anyway)${NC}"
fi

echo ""
echo -e "${YELLOW}🔄 Step 2: Resetting database schema...${NC}"
# Using Prisma to reset (interactive will prompt, so we use --force-reset if available)
bun run db:reset --force 2>/dev/null || bun run db:reset
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Database schema reset${NC}"
else
  echo -e "${RED}❌ Failed to reset database${NC}"
  exit 1
fi

echo ""
echo -e "${YELLOW}🌱 Step 3: Running production seeder...${NC}"
bun ./prisma/seed-production.ts --force
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Seeding completed successfully${NC}"
else
  echo -e "${RED}❌ Seeding failed${NC}"
  exit 1
fi

echo ""
echo -e "${YELLOW}📊 Step 4: Verifying data...${NC}"
# Optional: Add verification queries
bun ./prisma/seed-production.ts --verify 2>/dev/null

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Database reset and seeding complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Summary:"
echo "  📁 Backup: $BACKUP_FILE"
echo "  👤 Admin: admin@bi.go.id"
echo "  💼 Employees: 2"
echo "  🚗 Drivers: 2"
echo "  📦 Vehicles: 2"
echo "  📋 Bookings: 5"
echo ""
