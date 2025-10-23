@echo off
REM Script to trigger phone fields migration on Railway (Windows)

echo ============================================================
echo SwapSync - Phone Fields Migration Trigger
echo ============================================================
echo.
echo This will add missing phone fields to the products table
echo.

REM Prompt for credentials
set /p USERNAME=Enter your username (manager/admin): 
set /p PASSWORD=Enter your password: 
echo.

REM Login to get token
echo Logging in...
curl -X POST "https://api.digitstec.store/api/auth/login" -H "Content-Type: application/x-www-form-urlencoded" -d "username=%USERNAME%&password=%PASSWORD%" -o login_response.json
echo.

REM Note: For Windows, manual token extraction is needed
echo Please copy the access_token from login_response.json and run:
echo curl -X POST "https://api.digitstec.store/api/migrations/add-phone-fields" -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json"
echo.

pause

