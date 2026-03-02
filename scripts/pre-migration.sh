#!/bin/bash

####################################################################################
# Pre-Migration Script for Production
# 
# Fungsi:
# - Validasi environment variables
# - Test database connection
# - Create backup sebelum migration
# - Validate Prisma schema
# - Check migration status
# 
# Usage: ./scripts/pre-migration.sh
####################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️ ${1}${NC}"
}

log_success() {
    echo -e "${GREEN}✅ ${1}${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  ${1}${NC}"
}

log_error() {
    echo -e "${RED}❌ ${1}${NC}"
}

exit_error() {
    log_error "$1"
    exit 1
}

# Load environment
log_info "Loading environment variables..."
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '#' | xargs)
    log_success "Environment loaded from .env.production"
elif [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
    log_success "Environment loaded from .env"
else
    exit_error "No .env file found"
fi

log_info "Current environment: $NODE_ENV"

# 1. Validate required environment variables
log_info "Validating required environment variables..."

required_vars=("DATABASE_URL" "NODE_ENV")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        exit_error "Required environment variable not set: $var"
    fi
done

log_success "All required environment variables are set"

# 2. Parse database URL
log_info "Parsing database connection string..."

# DATABASE_URL format: mysql://username:password@host:port/database
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\).*/\1/p')
DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\).*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/\|.*@[^:]*:\([0-9]*\).*/\1\2/p' || echo "3306")
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

log_info "Database Configuration:"
log_info "  Host: $DB_HOST"
log_info "  Port: $DB_PORT"
log_info "  Database: $DB_NAME"

# 3. Test database connection
log_info "Testing database connection..."

if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -P "$DB_PORT" -e "SELECT 1" > /dev/null 2>&1; then
    log_success "Database connection successful"
else
    exit_error "Database connection failed. Check credentials and connection."
fi

# 4. Check if database exists
log_info "Checking if database exists..."

if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -P "$DB_PORT" -e "USE $DB_NAME" > /dev/null 2>&1; then
    log_success "Database '$DB_NAME' exists"
else
    log_warn "Database '$DB_NAME' does not exist. It will be created during migration."
fi

# 5. Create backup folder
log_info "Creating backup directory..."

mkdir -p .backups
log_success "Backup directory ready: .backups/"

# 6. Create database backup
log_info "Creating database backup..."

BACKUP_FILE=".backups/backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql"

if mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -P "$DB_PORT" "$DB_NAME" --result-file="$BACKUP_FILE" 2>/dev/null; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_success "Backup created: $BACKUP_FILE ($BACKUP_SIZE)"
else
    log_warn "Could not create backup (database may be empty). Continuing..."
fi

# 7. Validate Prisma schema
log_info "Validating Prisma schema..."

if npx prisma validate > /dev/null 2>&1; then
    log_success "Prisma schema is valid"
else
    exit_error "Prisma schema validation failed. Check prisma/schema.prisma"
fi

# 8. Check migration status
log_info "Checking migration status..."

npx prisma migrate status || true
log_success "Migration status checked"

# 9. List pending migrations
log_info "Checking for pending migrations..."

PENDING_COUNT=$(npx prisma migrate status 2>&1 | grep -c "Following migration" || echo "0")

if [ "$PENDING_COUNT" -gt 0 ]; then
    log_warn "Found pending migrations (will be applied during deployment)"
    npx prisma migrate status
else
    log_info "No pending migrations found"
fi

# 10. Check Node.js and npm/bun versions
log_info "Checking runtime versions..."

NODE_VERSION=$(node -v)
if command -v bun &> /dev/null; then
    BUN_VERSION=$(bun -v)
    log_success "Node.js $NODE_VERSION, Bun $BUN_VERSION"
else
    NPM_VERSION=$(npm -v)
    log_success "Node.js $NODE_VERSION, npm $NPM_VERSION"
fi

# Final summary
echo ""
log_success "✅ All pre-migration checks passed!"
echo ""
echo "Ready for migration. Run the following command:"
echo "  ./scripts/apply-migration.sh"
echo ""
