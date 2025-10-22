#!/bin/bash

# Deploy and Migrate Script
# This script deploys the latest code and runs the migration

echo "🚀 DEPLOYING AND RUNNING MIGRATION"
echo "=================================="

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies if needed
echo "📦 Installing dependencies..."
pip install psycopg2-binary

# Run the migration
echo "🔄 Running phone fields migration..."
python server_migration.py

# Check if migration was successful
if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo "The 500 error should now be fixed."
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi

echo "🎉 Deployment and migration completed!"
