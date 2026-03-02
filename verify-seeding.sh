#!/bin/bash

# Verify Database Data After Seeding
# Usage: ./verify-seeding.sh

echo "=========================================="
echo "Verifying Production Seeding Results"
echo "=========================================="
echo ""

# Check environment
if [ -z "$DATABASE_URL" ]; then
  # Try reading from .env.local
  if [ -f ".env.local" ]; then
    export $(grep -v '^#' .env.local | xargs)
  fi
fi

# Extract credentials from DATABASE_URL
# Expected format: mysql://user:pass@host:port/dbname
if [[ $DATABASE_URL =~ mysql:\/\/([^:]+):([^@]+)@([^:]+):([^/]+)\/(.+) ]]; then
  DB_USER="${BASH_REMATCH[1]}"
  DB_PASS="${BASH_REMATCH[2]}"
  DB_HOST="${BASH_REMATCH[3]}"
  DB_PORT="${BASH_REMATCH[4]}"
  DB_NAME="${BASH_REMATCH[5]}"
else
  echo "❌ Could not parse DATABASE_URL"
  exit 1
fi

echo "📊 Checking Data Counts:"
echo "=========================================="

# Function to run query
run_query() {
  local query=$1
  mysql -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" -P "$DB_PORT" "$DB_NAME" -se "$query" 2>/dev/null
}

# User counts
TOTAL_USERS=$(run_query "SELECT COUNT(*) FROM User;")
ADMIN_COUNT=$(run_query "SELECT COUNT(*) FROM User WHERE role='ADMIN';")
EMPLOYEE_COUNT=$(run_query "SELECT COUNT(*) FROM User WHERE role='EMPLOYEE';")
DRIVER_COUNT=$(run_query "SELECT COUNT(*) FROM User WHERE role='DRIVER';")

echo "👥 Users:"
echo "   Total Users: $TOTAL_USERS"
echo "   - Admins: $ADMIN_COUNT"
echo "   - Employees: $EMPLOYEE_COUNT"
echo "   - Drivers: $DRIVER_COUNT"
echo ""

# Vehicle counts
TOTAL_VEHICLES=$(run_query "SELECT COUNT(*) FROM Vehicle;")
AVAILABLE_VEHICLES=$(run_query "SELECT COUNT(*) FROM Vehicle WHERE status='AVAILABLE';")

echo "🚗 Vehicles:"
echo "   Total Vehicles: $TOTAL_VEHICLES"
echo "   - Available: $AVAILABLE_VEHICLES"
echo ""

# Booking counts
TOTAL_BOOKINGS=$(run_query "SELECT COUNT(*) FROM Booking;")
PENDING=$(run_query "SELECT COUNT(*) FROM Booking WHERE status='PENDING';")
APPROVED=$(run_query "SELECT COUNT(*) FROM Booking WHERE status='APPROVED';")
COMPLETED=$(run_query "SELECT COUNT(*) FROM Booking WHERE status='COMPLETED';")

echo "📋 Bookings:"
echo "   Total Bookings: $TOTAL_BOOKINGS"
echo "   - Pending: $PENDING"
echo "   - Approved: $APPROVED"
echo "   - Completed: $COMPLETED"
echo ""

# WhatsApp config
WA_CONFIG=$(run_query "SELECT COUNT(*) FROM WhatsAppConfig;")
WA_TEMPLATES=$(run_query "SELECT COUNT(*) FROM WhatsAppTemplate;")

echo "💬 WhatsApp:"
echo "   Configurations: $WA_CONFIG"
echo "   Templates: $WA_TEMPLATES"
echo ""

# Admin details
echo "=========================================="
echo "🔐 Admin User Details:"
echo "=========================================="
run_query "SELECT id, email, name, phone, isActive FROM User WHERE role='ADMIN' LIMIT 1;" | while read line; do
  echo "   $line"
done
echo ""

# Test employees and drivers
echo "=========================================="
echo "✅ Test Users Created:"
echo "=========================================="
echo "Employees:"
run_query "SELECT id, email, name FROM User WHERE role='EMPLOYEE';" | while read line; do
  echo "   $line"
done
echo ""
echo "Drivers:"
run_query "SELECT id, email, name FROM User WHERE role='DRIVER';" | while read line; do
  echo "   $line"
done
echo ""

# Vehicles list
echo "=========================================="
echo "🚙 Vehicles:"
echo "=========================================="
run_query "SELECT id, plateNumber, brand, model, status FROM Vehicle;" | while read line; do
  echo "   $line"
done
echo ""

# Summary
echo "=========================================="
echo "📈 Summary:"
echo "=========================================="

if [ "$TOTAL_USERS" -gt 0 ]; then
  echo "✅ Users: $TOTAL_USERS created"
else
  echo "❌ Users: NONE (seeding may have failed)"
fi

if [ "$TOTAL_VEHICLES" -gt 0 ]; then
  echo "✅ Vehicles: $TOTAL_VEHICLES created"
else
  echo "❌ Vehicles: NONE (seeding may have failed)"
fi

if [ "$TOTAL_BOOKINGS" -gt 0 ]; then
  echo "✅ Bookings: $TOTAL_BOOKINGS created"
else
  echo "⚠️  Bookings: NONE (optional)"
fi

if [ "$WA_CONFIG" -gt 0 ]; then
  echo "✅ WhatsApp Config: Created"
else
  echo "⚠️  WhatsApp Config: Not created"
fi

echo ""
echo "=========================================="
echo "✅ Verification complete!"
echo "=========================================="
