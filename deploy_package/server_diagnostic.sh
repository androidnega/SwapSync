#!/bin/bash
# SwapSync Server Diagnostic Script
# Run this on your cPanel terminal and send the output back

echo "=========================================="
echo "SWAPSYNC SERVER DIAGNOSTIC REPORT"
echo "=========================================="
echo ""

echo "1. CURRENT DIRECTORY & USER INFO"
echo "-----------------------------------"
pwd
whoami
echo "Home directory: $HOME"
echo ""

echo "2. PYTHON VERSION & LOCATION"
echo "-----------------------------------"
which python3
python3 --version
which python
python --version 2>/dev/null || echo "python command not found"
echo ""

echo "3. BACKEND DIRECTORY CHECK"
echo "-----------------------------------"
cd /home3/manuelc8/digitstec.store/backend 2>/dev/null && echo "✓ Backend directory exists" || echo "✗ Backend directory NOT FOUND"
ls -la /home3/manuelc8/digitstec.store/backend 2>/dev/null | head -20
echo ""

echo "4. CRITICAL FILES CHECK"
echo "-----------------------------------"
cd /home3/manuelc8/digitstec.store/backend 2>/dev/null || exit 1
echo "Checking critical files..."
[ -f "passenger_wsgi.py" ] && echo "✓ passenger_wsgi.py exists" || echo "✗ passenger_wsgi.py MISSING"
[ -f ".htaccess" ] && echo "✓ .htaccess exists" || echo "✗ .htaccess MISSING"
[ -f ".env" ] && echo "✓ .env exists" || echo "✗ .env MISSING"
[ -f "main.py" ] && echo "✓ main.py exists" || echo "✗ main.py MISSING"
[ -f "requirements.txt" ] && echo "✓ requirements.txt exists" || echo "✗ requirements.txt MISSING"
[ -f "swapsync.db" ] && echo "✓ swapsync.db exists" || echo "✗ swapsync.db MISSING"
[ -d "app" ] && echo "✓ app/ directory exists" || echo "✗ app/ directory MISSING"
echo ""

echo "5. FILE PERMISSIONS"
echo "-----------------------------------"
ls -l passenger_wsgi.py .htaccess .env main.py requirements.txt swapsync.db 2>/dev/null
echo ""

echo "6. .HTACCESS CONTENT"
echo "-----------------------------------"
cat .htaccess 2>/dev/null || echo ".htaccess not found"
echo ""

echo "7. PASSENGER_WSGI.PY CONTENT (First 30 lines)"
echo "-----------------------------------"
head -30 passenger_wsgi.py 2>/dev/null || echo "passenger_wsgi.py not found"
echo ""

echo "8. .ENV FILE CHECK (Hidden values)"
echo "-----------------------------------"
if [ -f ".env" ]; then
    echo "SECRET_KEY is set: $(grep -q 'SECRET_KEY=' .env && echo 'YES' || echo 'NO')"
    echo "DEBUG setting: $(grep 'DEBUG=' .env 2>/dev/null || echo 'NOT SET')"
    echo "DATABASE_URL: $(grep 'DATABASE_URL=' .env 2>/dev/null || echo 'NOT SET')"
else
    echo ".env file does not exist"
fi
echo ""

echo "9. VIRTUAL ENVIRONMENT CHECK"
echo "-----------------------------------"
echo "Checking for virtual environment..."
[ -d "$HOME/virtualenv/backend" ] && echo "✓ $HOME/virtualenv/backend exists" || echo "✗ $HOME/virtualenv/backend NOT FOUND"
ls -la $HOME/virtualenv/ 2>/dev/null || echo "No virtualenv directory found"
echo ""
echo "Python in virtualenv:"
ls -la $HOME/virtualenv/backend/3.9/bin/ 2>/dev/null | grep python || echo "Virtual environment Python not found"
echo ""

echo "10. INSTALLED PYTHON PACKAGES"
echo "-----------------------------------"
if [ -f "$HOME/virtualenv/backend/3.9/bin/pip" ]; then
    $HOME/virtualenv/backend/3.9/bin/pip list 2>/dev/null | grep -E "(fastapi|uvicorn|sqlalchemy|pydantic|python-dotenv)" || echo "Key packages not found"
else
    echo "pip not found in virtual environment"
fi
echo ""

echo "11. DATABASE FILE CHECK"
echo "-----------------------------------"
if [ -f "swapsync.db" ]; then
    ls -lh swapsync.db
    echo "Database is readable: $([ -r swapsync.db ] && echo 'YES' || echo 'NO')"
    echo "Database is writable: $([ -w swapsync.db ] && echo 'YES' || echo 'NO')"
else
    echo "swapsync.db not found"
fi
echo ""

echo "12. PASSENGER/ERROR LOGS"
echo "-----------------------------------"
echo "Recent passenger log entries:"
tail -50 $HOME/logs/passenger.log 2>/dev/null || echo "No passenger.log found"
echo ""
echo "Recent error log entries:"
tail -50 $HOME/logs/error_log 2>/dev/null || echo "No error_log found"
echo ""

echo "13. APP DIRECTORY STRUCTURE"
echo "-----------------------------------"
ls -la app/ 2>/dev/null | head -20 || echo "app/ directory not found"
echo ""

echo "14. REQUIREMENTS.TXT CONTENT"
echo "-----------------------------------"
cat requirements.txt 2>/dev/null || echo "requirements.txt not found"
echo ""

echo "15. TEST PYTHON IMPORT"
echo "-----------------------------------"
cd /home3/manuelc8/digitstec.store/backend
if [ -f "$HOME/virtualenv/backend/3.9/bin/python" ]; then
    echo "Testing FastAPI import..."
    $HOME/virtualenv/backend/3.9/bin/python -c "import fastapi; print('✓ FastAPI version:', fastapi.__version__)" 2>&1
    echo "Testing main.py import..."
    $HOME/virtualenv/backend/3.9/bin/python -c "from main import app; print('✓ Main app imported successfully')" 2>&1
else
    echo "Virtual environment Python not found"
fi
echo ""

echo "=========================================="
echo "DIAGNOSTIC REPORT COMPLETE"
echo "=========================================="
echo "Please copy this entire output and send it back."

