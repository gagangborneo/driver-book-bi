#!/bin/bash

####################################################################################
# Migration Monitoring Script
# 
# Fungsi:
# - Monitor Prisma migration status
# - Check database size
# - Monitor connection count
# - Check for errors
# 
# Usage: ./scripts/monitor-migration.sh
####################################################################################

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

# Load environment
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

echo ""
echo "═══════════════════════════════════════════════════════════════"
log_success "📊 Migration Monitoring Dashboard"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 1. Prisma Migration Status
echo "1️⃣  PRISMA MIGRATION STATUS"
echo "───────────────────────────────────────────────────────────────"
npx prisma migrate status || log_warn "Could not retrieve migration status"
echo ""

# 2. Database Connection
echo "2️⃣  DATABASE CONNECTION"
echo "───────────────────────────────────────────────────────────────"
log_info "Connecting to: $DB_HOST:$DB_PORT/$DB_NAME"

if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -P "$DB_PORT" -e "SELECT 1" > /dev/null 2>&1; then
    log_success "Connection successful"
else
    log_warn "Connection failed"
fi
echo ""

# 3. Database Size
echo "3️⃣  DATABASE SIZE"
echo "───────────────────────────────────────────────────────────────"

mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -P "$DB_PORT" "$DB_NAME" -e "
    SELECT 
        CONCAT(ROUND(SUM(data_length + index_length) / 1024 / 1024, 2), ' MB') AS 'Total Size'
    FROM information_schema.tables
    WHERE table_schema = '$DB_NAME';
" || log_warn "Could not retrieve database size"
echo ""

# 4. Table Sizes
echo "4️⃣  TABLE SIZES"
echo "───────────────────────────────────────────────────────────────"

mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -P "$DB_PORT" "$DB_NAME" -e "
    SELECT 
        TABLE_NAME,
        CONCAT(ROUND((data_length + index_length) / 1024 / 1024, 2), ' MB') AS Size,
        TABLE_ROWS AS 'Row Count'
    FROM information_schema.tables
    WHERE table_schema = '$DB_NAME'
    ORDER BY (data_length + index_length) DESC;
" || log_warn "Could not retrieve table sizes"
echo ""

# 5. Active Connections
echo "5️⃣  ACTIVE DATABASE CONNECTIONS"
echo "───────────────────────────────────────────────────────────────"

mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -P "$DB_PORT" -e "
    SELECT 
        COUNT(*) AS active_connections
    FROM information_schema.processlist
    WHERE db = '$DB_NAME' AND command != 'Sleep';
" || log_warn "Could not retrieve active connections"
echo ""

# 6. Prisma Migrations History
echo "6️⃣  PRISMA MIGRATIONS HISTORY"
echo "───────────────────────────────────────────────────────────────"

mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -P "$DB_PORT" "$DB_NAME" -e "
    SELECT 
        id,
        checksum,
        finished_at,
        execution_time_in_millis AS 'Duration (ms)'
    FROM _prisma_migrations
    ORDER BY finished_at DESC
    LIMIT 10;
" || log_warn "Could not retrieve migration history"
echo ""

# 7. Recent Errors (if log file exists)
echo "7️⃣  RECENT MIGRATION LOGS"
echo "───────────────────────────────────────────────────────────────"

if [ -f migration_*.log ]; then
    LATEST_LOG=$(ls -t migration_*.log | head -1)
    log_info "Latest log: $LATEST_LOG"
    echo ""
    
    ERROR_COUNT=$(grep -c "ERROR\|error\|Error" "$LATEST_LOG" 2>/dev/null || echo "0")
    
    if [ "$ERROR_COUNT" -gt 0 ]; then
        log_warn "Found $ERROR_COUNT error(s) in log:"
        grep -i "error\|failed\|failed" "$LATEST_LOG" | tail -5
    else
        log_success "No errors found in recent logs"
    fi
else
    log_warn "No migration logs found"
fi
echo ""

# 8. Health Check
echo "8️⃣  HEALTH CHECK"
echo "───────────────────────────────────────────────────────────────"

if command -v curl &> /dev/null; then
    HEALTH=$(curl -s http://localhost:3000/api/health 2>/dev/null || echo "")
    
    if [ ! -z "$HEALTH" ]; then
        echo "$HEALTH" | grep -q "healthy" && log_success "Application is healthy" || log_warn "Application health status unknown"
    else
        log_warn "Could not reach health endpoint (http://localhost:3000/api/health)"
    fi
else
    log_info "curl not available for health check"
fi
echo ""

# Summary
echo "═══════════════════════════════════════════════════════════════"
log_success "✅ Monitoring complete at $(date)"
echo "═══════════════════════════════════════════════════════════════"
echo ""
