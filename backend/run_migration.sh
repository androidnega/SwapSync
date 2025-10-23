#!/bin/bash
# Script to trigger phone fields migration on Railway

echo "============================================================"
echo "SwapSync - Phone Fields Migration Trigger"
echo "============================================================"
echo ""
echo "This will add missing phone fields to the products table"
echo ""

# Prompt for credentials
read -p "Enter your username (manager/admin): " USERNAME
read -sp "Enter your password: " PASSWORD
echo ""
echo ""

# Login to get token
echo "🔄 Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "https://api.digitstec.store/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$USERNAME&password=$PASSWORD")

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed. Please check your credentials."
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Login successful!"
echo ""

# Trigger migration
echo "🔄 Triggering migration..."
MIGRATION_RESPONSE=$(curl -s -X POST "https://api.digitstec.store/api/migrations/add-phone-fields" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo ""
echo "📊 Migration Response:"
echo "$MIGRATION_RESPONSE" | python -m json.tool 2>/dev/null || echo "$MIGRATION_RESPONSE"
echo ""

if echo "$MIGRATION_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Migration completed successfully!"
    echo "Please refresh your frontend application."
else
    echo "❌ Migration may have failed. Please check the response above."
fi

