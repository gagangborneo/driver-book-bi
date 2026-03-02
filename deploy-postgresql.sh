#!/bin/bash

# PostgreSQL Production Deployment Script
# This script will deploy the application with PostgreSQL database

set -e  # Exit on error

echo "🚀 Driver Booking System - PostgreSQL Deployment"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✅ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  ${1}${NC}"
}

print_error() {
    echo -e "${RED}❌ ${1}${NC}"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    print_info "Creating .env from example..."
    
    cat > .env << 'EOF'
# PostgreSQL Configuration
POSTGRES_USER=driver
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD
POSTGRES_DB=driver

# Application
NODE_ENV=production
LOG_LEVEL=warn
ADMIN_PASSWORD=CHANGE_THIS_PASSWORD

# API
NEXT_PUBLIC_API_URL=http://localhost:3000

# WhatsApp (optional)
WA_API_URL=https://app.whacenter.com/api
WA_API_KEY=your-api-key
WA_PHONE_NUMBER=your-phone
EOF

    print_warning "Please edit .env file with your actual values!"
    print_info "Then run this script again."
    exit 1
fi

# Load environment variables
source .env

# Check if passwords are still default
if [ "$POSTGRES_PASSWORD" == "CHANGE_THIS_PASSWORD" ] || [ "$ADMIN_PASSWORD" == "CHANGE_THIS_PASSWORD" ]; then
    print_error "Please change default passwords in .env file!"
    exit 1
fi

print_info "Environment variables loaded"

# Step 1: Check if old containers exist
print_info "Step 1: Checking for old containers..."
if docker ps -a | grep -q "driver_booking"; then
    print_warning "Found existing containers"
    read -p "Do you want to remove old containers? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Stopping and removing old containers..."
        docker-compose -f docker-compose.production.yml down
        print_success "Old containers removed"
    fi
fi

# Step 2: Check migrations
print_info "Step 2: Checking Prisma migrations..."
if [ -d "prisma/migrations" ]; then
    # Check if migrations are for PostgreSQL
    if grep -r "sqlite" prisma/migrations/ 2>/dev/null; then
        print_warning "Found SQLite migrations, need to recreate for PostgreSQL"
        read -p "Remove old migrations and create new ones? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Backing up old migrations..."
            mv prisma/migrations "prisma/migrations_backup_$(date +%Y%m%d_%H%M%S)"
            print_success "Old migrations backed up"
        fi
    fi
fi

# Step 3: Build Docker images
print_info "Step 3: Building Docker images..."
docker-compose -f docker-compose.production.yml build --no-cache
print_success "Docker images built successfully"

# Step 4: Start PostgreSQL first
print_info "Step 4: Starting PostgreSQL..."
docker-compose -f docker-compose.production.yml up -d postgres

# Wait for PostgreSQL to be ready
print_info "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker exec driver_booking_postgres_prod pg_isready -U $POSTGRES_USER -d $POSTGRES_DB 2>/dev/null; then
        print_success "PostgreSQL is ready"
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

# Step 5: Generate Prisma Client and run migrations
print_info "Step 5: Generating Prisma Client..."
bunx prisma generate

# Check if we need to create initial migration
if [ ! -d "prisma/migrations" ] || [ -z "$(ls -A prisma/migrations)" ]; then
    print_info "Creating initial migration for PostgreSQL..."
    # Create migration without applying (we'll apply in container)
    bunx prisma migrate dev --name init --create-only
    print_success "Initial migration created"
fi

# Step 6: Start application
print_info "Step 6: Starting application..."
docker-compose -f docker-compose.production.yml up -d app

# Wait for app to be ready
print_info "Waiting for application to be ready..."
for i in {1..30}; do
    if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
        print_success "Application is ready"
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

# Step 7: Apply migrations inside container
print_info "Step 7: Applying database migrations..."
docker exec driver_booking_app_prod bunx prisma migrate deploy
print_success "Migrations applied"

# Step 8: Seed database
print_info "Step 8: Seeding database..."
if docker exec driver_booking_app_prod bunx prisma db seed 2>/dev/null; then
    print_success "Database seeded successfully"
else
    print_warning "Seeding skipped or failed (database might already have data)"
fi

# Step 9: Verify deployment
print_info "Step 9: Verifying deployment..."

# Check containers
if docker ps | grep -q "driver_booking_postgres_prod"; then
    print_success "PostgreSQL container running"
else
    print_error "PostgreSQL container not running!"
fi

if docker ps | grep -q "driver_booking_app_prod"; then
    print_success "Application container running"
else
    print_error "Application container not running!"
fi

# Check database connection
if docker exec driver_booking_app_prod bunx prisma db pull > /dev/null 2>&1; then
    print_success "Database connection successful"
else
    print_error "Cannot connect to database!"
fi

# Check if admin user exists
print_info "Checking admin user..."
USER_COUNT=$(docker exec driver_booking_postgres_prod psql -U $POSTGRES_USER -d $POSTGRES_DB -t -c "SELECT COUNT(*) FROM \"User\" WHERE role='ADMIN';" 2>/dev/null | tr -d ' ')
if [ "$USER_COUNT" -gt 0 ]; then
    print_success "Admin user exists (count: $USER_COUNT)"
else
    print_warning "No admin user found in database"
fi

# Test health endpoint
print_info "Testing health endpoint..."
if curl -sf http://localhost:3000/api/health > /dev/null; then
    print_success "Health check passed"
else
    print_error "Health check failed!"
fi

# Final summary
echo ""
echo "================================================"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "================================================"
echo ""
echo "📋 Deployment Summary:"
echo "  - PostgreSQL: Running on port 5432"
echo "  - Application: Running on port 3000"
echo "  - Database: $POSTGRES_DB"
echo "  - User: $POSTGRES_USER"
echo ""
echo "🔐 Default Login Credentials:"
echo "  Email: admin@driver.com"
echo "  Password: admin123"
echo ""
echo "⚠️  IMPORTANT: Change default admin password after first login!"
echo ""
echo "📱 Access your application:"
echo "  - Local: http://localhost:3000"
echo "  - API: http://localhost:3000/api"
echo "  - Health: http://localhost:3000/api/health"
echo ""
echo "📊 View logs:"
echo "  docker-compose -f docker-compose.production.yml logs -f"
echo ""
echo "🛑 Stop services:"
echo "  docker-compose -f docker-compose.production.yml down"
echo ""

# Test login
print_info "Testing login endpoint..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@driver.com","password":"admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    print_success "Login test successful! 🎉"
    echo ""
    echo "✅ Your application is ready to use!"
else
    print_warning "Login test failed. Please check logs:"
    echo "  docker-compose -f docker-compose.production.yml logs -f app"
    echo ""
    echo "Response: $LOGIN_RESPONSE"
fi

echo ""
print_info "For troubleshooting, see: POSTGRESQL_MIGRATION_GUIDE.md"
