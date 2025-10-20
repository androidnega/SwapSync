#!/bin/bash

# SwapSync Backend Deployment Script
# Run this on your server to deploy the latest backend changes

echo "🚀 SwapSync Backend Deployment"
echo "================================"
echo ""

# Check if we're in the backend directory
if [ ! -f "main.py" ]; then
    echo "❌ Error: Not in backend directory!"
    echo "Please cd to your backend directory first"
    exit 1
fi

echo "📍 Current directory: $(pwd)"
echo ""

# Show current commit
echo "📋 Current commit:"
git log -1 --oneline
echo ""

# Pull latest changes
echo "⬇️  Pulling latest changes from GitHub..."
git fetch origin
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Git pull failed!"
    echo "You may need to stash or commit local changes first"
    exit 1
fi

echo ""
echo "📋 New commit:"
git log -1 --oneline
echo ""

# Restart Passenger
echo "🔄 Restarting Passenger application..."
mkdir -p tmp
touch tmp/restart.txt

if [ $? -eq 0 ]; then
    echo "✅ Restart triggered successfully!"
    echo ""
    echo "⏳ Waiting 3 seconds for restart..."
    sleep 3
    echo ""
    echo "✅ Backend deployed successfully!"
    echo ""
    echo "🔍 Test your API at: https://api.digitstec.store/api/docs"
    echo ""
    echo "POS System should now work without 405 errors! 🎉"
else
    echo "⚠️  Could not create restart.txt"
    echo "You may need to manually restart your Python app via cPanel"
fi

echo ""
echo "================================"
echo "Deployment Complete!"

