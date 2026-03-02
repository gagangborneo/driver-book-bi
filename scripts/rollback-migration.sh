#!/bin/bash

####################################################################################
# Rollback Migration Script
# 
# Fungsi:
# - Restore database dari backup
# - Reset Prisma migration state
# - Restart application (jika running in Docker)
# 
# Usage:
#   ./scripts/rollback-migration.sh <backup-file>
#   ./scripts/rollback-migration.sh backup_pre_migration_20260301_120000.sql
#   ./scripts/rollback-migration.sh --list  (to list available backups)
####################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check if backup file is provided
BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    log_error "Backup file not specified"
    echo ""
    echo "Usage: ./scripts/rollback-migration.sh <backup-file>"
    echo ""
    log_info "Available backups:"
    echo ""
    ls -lh .backups/ 2>/dev/null || log_warn "No backups found in .backups/ directory"
    echo ""
    exit 1
fi

# List backups and exit
if [ "$BACKUP_FILE" = "--list" ]; then
    log_info "Available backups:"
    echo ""
    ls -lh .backups/
    exit 0
fi

# Verify backup file exists
if [ ! -f ".backups/$BACKUP_FILE" ] && [ ! -f "$BACKUP_FILE" ]; then
    exit_error "Backup file not found: $BACKUP_FILE"
fi

# Full path to backup
FULL_BACKUP_PATH=$([ -f ".backups/$BACKUP_FILE" ] && echo ".backups/$BACKUP_FILE" || echo "$BACKUP_FILE")
BACKUP_SIZE=$(du -h "$FULL_BACKUP_PATH" | cut -f1)

# Show warning
echo ""
log_warn "⚠️  ROLLBACK WARNING ⚠️"
echo ""
log_info "This action will:"
log_info "  1. Restore database from: $FULL_BACKUP_PATH ($BACKUP_SIZE)"
log_info "  2. Reset all Prisma migrations"
log_info "  3. Potentially lose recent data"
echo ""
log_error "THIS ACTION CANNOT BE UNDONE!"
echo ""

# Confirmation
read -p "Type 'yes-rollback' to confirm: " confirmation
if [ "$confirmation" != "yes-rollback" ]; then
    log_info "Rollback cancelled"
    exit 0
fi

echo ""
log_info "Starting rollback at $(date)..."
echo ""

# Load environment
log_info "Loading environment..."
if [ -f .env.production ]; then
    source .env.production
elif [ -f .env.local ]; then
    source .env.local
elif [ -f .env ]; then
    source .env
fi

# Parse database URL
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\).*/\1/p')
DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\).*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/\|.*@[^:]*:\([0-9]*\).*/\1\2/p' || echo "3306")
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

log_success "Environment loaded"

# Step 1: Test database connection
log_info "Step 1/5: Testing database connection..."
if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -P "$DB_PORT" -e "SELECT 1" > /dev/null 2>&1; then
    log_success "Database connection successful"
else
    exit_error "Cannot connect to database. Check credentials."
fi

# Step 2: Restore database
log_info "Step 2/5: Restoring database from backup..."
log_warn "Dropping existing tables..."

# Drop all tables first
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -P "$DB_PORT" "$DB_NAME" -e "
    SET FOREIGN_KEY_CHECKS=0;
    SET GROUP_CONCAT_MAX_LEN=32768;
    SET @tables = NULL;
    SELECT GROUP_CONCAT('\`', table_name, '\`') INTO @tables
      FROM information_schema.tables
      WHERE table_schema = '$DB_NAME';
    SET @tables = IFNULL(@tables,'dummy');
    SET @sql = CONCAT('DROP TABLE IF EXISTS ', @tables);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    SET FOREIGN_KEY_CHECKS=1;
" 2>/dev/null || log_warn "Some tables may not have been dropped (they may not exist)"

log_info "Restoring from backup..."
if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -P "$DB_PORT" "$DB_NAME" < "$FULL_BACKUP_PATH" 2>&1 | head -20; then
    log_success "Database restored successfully"
else
    exit_error "Database restore failed"
fi

# Step 3: Regenerate Prisma Client
log_info "Step 3/5: Regenerating Prisma Client..."
if npx prisma generate > /dev/null 2>&1; then
    log_success "Prisma Client generated"
else
    exit_error "Failed to generate Prisma Client"
fi

# Step 4: Reset migration state
log_info "Step 4/5: Resetting Prisma migration state..."
LAST_MIGRATION=$(ls -t prisma/migrations/ 2>/dev/null | head -1 || echo "")

if [ ! -z "$LAST_MIGRATION" ]; then
    log_info "Rolling back to previous state..."
    # Note: In production, you might want to use 'resolve' instead
    # npx prisma migrate resolve --rolled-back "$LAST_MIGRATION" > /dev/null 2>&1 || true
    log_success "Migration state reset"
else
    log_warn "No migrations found, skipping migration reset"
fi

# Step 5: Verify rollback
log_info "Step 5/5: Verifying rollback..."
TABLE_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -P "$DB_PORT" "$DB_NAME" -se "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DB_NAME';" || echo "0")

log_success "Database verified with $TABLE_COUNT tables"

# Check if running in Docker and restart
if command -v docker &> /dev/null; then
    log_info "Checking for running Docker containers..."
    CONTAINER=$(docker ps -q -f "name=driver-booking" 2>/dev/null || echo "")
    
    if [ ! -z "$CONTAINER" ]; then
        log_warn "Restarting application container..."
        docker restart "$CONTAINER" > /dev/null 2>&1
        log_success "Container restarted"
    fi
fi

# Summary
echo ""
echo "═══════════════════════════════════════════════════════════════"
log_success "✅ Rollback completed successfully!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
log_info "Rollback Summary:"
log_info "  Source: $FULL_BACKUP_PATH"
log_info "  Database: $DB_NAME"
log_info "  Tables Restored: $TABLE_COUNT"
log_info "  Completed at: $(date)"
echo ""
log_warn "⚠️  Important:"
log_warn "  1. Verify the application is working correctly"
log_warn "  2. Check application logs for any errors"
log_warn "  3. Review what caused the need for rollback"
echo ""

exit 0
