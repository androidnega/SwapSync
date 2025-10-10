#!/bin/bash
# SwapSync Production Fix Script
# Run this in: /home3/manuelc8/digitstec.store/backend/

echo "=========================================="
echo "SWAPSYNC PRODUCTION FIX"
echo "=========================================="
echo ""

# Step 1: Fix passenger_wsgi.py
echo "Step 1: Creating correct passenger_wsgi.py..."
cat > passenger_wsgi.py << 'EOF'
import sys
import os

# Add the backend directory to Python path
INTERP = os.path.join(os.environ['HOME'], 'virtualenv', 'digitstec.store', 'backend', '3.11', 'bin', 'python')
if sys.executable != INTERP:
    os.execl(INTERP, INTERP, *sys.argv)

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

# Load environment variables
try:
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    load_dotenv(dotenv_path=env_path)
except ImportError:
    pass

# Import the FastAPI application
from main import app as application
EOF
echo "✓ passenger_wsgi.py created"
echo ""

# Step 2: Install all dependencies
echo "Step 2: Installing Python dependencies..."
source ~/virtualenv/digitstec.store/backend/3.11/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
echo "✓ Dependencies installed"
echo ""

# Step 3: Fix file permissions
echo "Step 3: Setting correct file permissions..."
chmod 755 ~/digitstec.store/backend
chmod 644 .htaccess
chmod 600 .env
chmod 644 passenger_wsgi.py
chmod 644 main.py
chmod 664 swapsync.db
chmod 755 app
echo "✓ Permissions set"
echo ""

# Step 4: Make database directory writable
echo "Step 4: Ensuring database is writable..."
touch swapsync.db
chmod 664 swapsync.db
echo "✓ Database permissions OK"
echo ""

# Step 5: Test the application
echo "Step 5: Testing application import..."
~/virtualenv/digitstec.store/backend/3.11/bin/python -c "from main import app; print('✓ App imported successfully')"
echo ""

# Step 6: Create tmp directory for Passenger
echo "Step 6: Creating tmp directory..."
mkdir -p tmp
chmod 755 tmp
echo "✓ tmp directory created"
echo ""

echo "=========================================="
echo "FIX COMPLETE!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Restart the application via cPanel Python App manager"
echo "2. OR run: mkdir -p tmp && touch tmp/restart.txt"
echo "3. Check your application at: https://digitstec.store/backend"
echo ""

