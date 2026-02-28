#!/bin/bash

# WhatsApp Settings Setup Guide
# Run database migrations first before using WhatsApp settings

echo "🚀 WhatsApp Settings Setup"
echo "=========================="
echo ""

# Step 1: Run migrations
echo "1️⃣  Running database migrations..."
echo "   Command: npx prisma migrate dev"
echo ""

# Step 2: Access admin panel
echo "2️⃣  Access Admin Panel"
echo "   URL: http://localhost:3000/admin/whatsapp"
echo "   Requirements: Admin role"
echo ""

# Step 3: Configure first
echo "3️⃣  Configuration (Required)"
echo "   - Enter Device ID from WACenter"
echo "   - Set API URL (default: https://app.whacenter.com/api)"
echo "   - Toggle Active status"
echo "   - Click 'Save Configuration'"
echo ""

# Step 4: Add routes
echo "4️⃣  Add Routes/Groups"
echo "   - Go to 'Routes/Groups' tab"
echo "   - Click 'Add Route'"
echo "   - Enter route details (name, groupId, description)"
echo "   - Common group IDs: WAGDriver, WAGManagement"
echo ""

# Step 5: Create templates
echo "5️⃣  Create Message Templates"
echo "   - Go to 'Message Templates' tab"
echo "   - Click 'Add Template'"
echo "   - Enter template name and type"
echo "   - Use placeholders like {pickupLocation}, {destination}"
echo ""

# Step 6: Verify setup
echo "6️⃣  Verify Setup"
echo "   - Check if messages are being sent (check logs)"
echo "   - Test with sample booking notification"
echo "   - Monitor WhatsApp group for messages"
echo ""

echo "✅ Setup Complete!"
echo ""
echo "📖 For more details, see:"
echo "   - WHATSAPP_ADMIN_SETTINGS.md"
echo "   - WHATSAPP_INTEGRATION.md"
