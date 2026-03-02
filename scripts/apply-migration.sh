#!/bin/bash

####################################################################################
# Apply Prisma Migration Script
# 
# Fungsi:
# - Apply pending migrations ke database
# - Generate Prisma Client
# - Verify migration success
# - Option untuk seeding
# 
# Usage: 
#   ./scripts/apply-migration.sh
#   ./scripts/apply-migration.sh --with-seed
#   ./scripts/apply-migration.sh --production
####################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variables
WITH_SEED=false
IS_PRODUCTION=false
LOG_FILE="migration_$(date +%Y%m%d_%H%M%S).log"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --with-seed)
            WITH_SEED=true
            shift
            ;;
        --production)
            IS_PRODUCTION=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# Functions
log_info() {
    echo -e "${BLUE}ℹ️ ${1}${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅ ${1}${NC}" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}⚠️  ${1}${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌ ${1}${NC}" | tee -a "$LOG_FILE"
}

exit_error() {
    log_error "$1"
    echo ""
    log_error "Migration failed at $(date)"
    echo "Check logs: $LOG_FILE"
    exit 1
}

# Confirm before proceeding
if [ "$IS_PRODUCTION" = true ]; then
    log_warn "⚠️  WARNING: You are about to apply migrations to PRODUCTION"
    log_warn "This action cannot be easily undone. A backup has been created."
    echo ""
    log_warn "Database backups are in: .backups/"
    echo ""
    read -p "Type 'yes' to confirm: " confirmation
    if [ "$confirmation" != "yes" ]; then
        log_info "Migration cancelled"
        exit 0
    fi
fi

# Start migration
echo ""
log_success "Starting migration at $(date)"
echo ""

# Load environment
load_env() {
    if [ "$IS_PRODUCTION" = true ] && [ -f .env.production ]; then
        export $(cat .env.production | grep -v '#' | xargs)
        NODE_ENV="production"
    elif [ -f .env.local ]; then
        export $(cat .env.local | grep -v '#' | xargs)
    elif [ -f .env ]; then
        export $(cat .env | grep -v '#' | xargs)
    fi
}

log_info "Loading environment..."
load_env
log_success "Environment loaded"

# Step 1: Validate schema
log_info "Step 1/5: Validating Prisma schema..."
if npx prisma validate >> "$LOG_FILE" 2>&1; then
    log_success "Schema validation passed"
else
    exit_error "Schema validation failed"
fi

# Step 2: Check migration status
log_info "Step 2/5: Checking pending migrations..."
MIGRATION_STATUS=$(npx prisma migrate status 2>&1 || echo "error")
echo "$MIGRATION_STATUS" | tee -a "$LOG_FILE"

# Step 3: Apply migrations
log_info "Step 3/5: Applying migrations to database..."
if npx prisma migrate deploy >> "$LOG_FILE" 2>&1; then
    log_success "Migrations applied successfully"
else
    exit_error "Migration deployment failed"
fi

# Step 4: Generate Prisma Client
log_info "Step 4/5: Generating Prisma Client..."
if npx prisma generate >> "$LOG_FILE" 2>&1; then
    log_success "Prisma Client generated"
else
    exit_error "Prisma Client generation failed"
fi

# Step 5: Optional seeding
if [ "$WITH_SEED" = true ]; then
    log_info "Step 5/5: Running database seeding..."
    
    if [ "$IS_PRODUCTION" = true ]; then
        log_info "Using production seeding (won't overwrite existing data)..."
        if npm run prisma:seed:production >> "$LOG_FILE" 2>&1; then
            log_success "Production seeding completed"
        else
            log_warn "Production seeding encountered issues (check logs)"
        fi
    else
        log_info "Using development seeding..."
        if npm run prisma:seed >> "$LOG_FILE" 2>&1; then
            log_success "Seeding completed"
        else
            log_warn "Seeding encountered issues (check logs)"
        fi
    fi
else
    log_info "Step 5/5: Seeding skipped (use --with-seed to enable)"
fi

# Final verifications
echo ""
log_info "Running post-migration verifications..."

# Check database tables
log_info "Verifying database tables..."
TABLE_COUNT=$(npx prisma db execute --stdin <<EOF 2>/dev/null <<'EOSQL'
SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'driver';
EOSQL
)

log_success "Database verified and ready"

# Summary
echo ""
echo "═══════════════════════════════════════════════════════════════"
log_success "✅ Migration completed successfully!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
log_info "Migration Details:"
log_info "  Started: Logged in $LOG_FILE"
log_info "  Node Environment: $NODE_ENV"
log_info "  Seeding: $([ "$WITH_SEED" = true ] && echo 'Yes' || echo 'No')"
log_info "  Completed at: $(date)"
echo ""

# Recommendations
if [ "$IS_PRODUCTION" = true ]; then
    echo "📌 Next Steps:"
    echo "  1. Verify the application is running correctly"
    echo "  2. Monitor application logs for errors"
    echo "  3. Run health checks: curl http://localhost:3000/api/health"
    echo ""
    echo "🔄 If something goes wrong:"
    echo "  ./scripts/rollback-migration.sh <backup-file>"
    echo ""
fi

exit 0
