@echo off
title SwapSync Launcher
color 0B
cls

echo =============================================
echo         SwapSync System Launcher
echo =============================================
echo.
echo [STEP 1] Starting Backend Server...
echo.

REM Kill any existing Python processes on port 8000
taskkill /F /IM python.exe /FI "WINDOWTITLE eq SwapSync Backend*" 2>nul

REM Start Backend - Using full path to venv python
start "SwapSync Backend" cmd /k "cd /d %~dp0backend && %~dp0.venv\Scripts\python.exe main.py"

echo [WAIT] Waiting 12 seconds for backend to fully start...
timeout /t 12 /nobreak > nul

echo.
echo [STEP 2] Starting Frontend Server...
echo.

REM Start Frontend
start "SwapSync Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak > nul

cls
color 0A
echo =============================================
echo         SwapSync IS NOW RUNNING!
echo =============================================
echo.
echo ✅ Two windows have opened successfully
echo.
echo =============================================
echo         ACCESS YOUR SYSTEM
echo =============================================
echo.
echo  Frontend (Open this in your browser):
echo    👉 http://localhost:5173
echo.
echo  Backend API (for reference):
echo    http://localhost:8000
echo    http://localhost:8000/docs
echo.
echo =============================================
echo         LOGIN CREDENTIALS
echo =============================================
echo.
echo  Username: super_admin
echo  Password: admin123
echo.
echo =============================================
echo         IMPORTANT
echo =============================================
echo.
echo  WAIT 20-30 SECONDS after opening browser
echo  for all services to fully initialize!
echo.
echo  Then refresh the page if you see errors.
echo.
echo  To STOP:
echo    Close the Backend and Frontend windows
echo.
echo =============================================
echo.
pause

