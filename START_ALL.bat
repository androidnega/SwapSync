@echo off
cls
echo ========================================
echo    SwapSync - Complete System Startup
echo ========================================
echo.
echo This will start:
echo   [1] Backend API Server (FastAPI)
echo   [2] Frontend Development Server (React + Vite)
echo.
echo ========================================
echo.

REM Check if virtual environment exists
if not exist ".venv\Scripts\activate.bat" (
    echo ERROR: Virtual environment not found!
    echo Please run: python -m venv .venv
    echo Then run: .venv\Scripts\activate
    echo Then run: pip install -r backend\requirements.txt
    pause
    exit /b 1
)

REM Start Backend in a new window (with venv activated)
echo [1/2] Starting Backend Server...
start "SwapSync Backend API" cmd /k "cd /d %~dp0 && .venv\Scripts\activate && cd backend && python main.py"

REM Wait for backend to initialize
echo Waiting for backend to initialize...
timeout /t 5 /nobreak > nul

REM Start Frontend in a new window
echo [2/2] Starting Frontend Server...
start "SwapSync Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo   All Services Starting!
echo ========================================
echo.
echo Backend API:
echo   - http://localhost:8000
echo   - http://127.0.0.1:8000
echo   - API Docs: http://localhost:8000/docs
echo.
echo Frontend:
echo   - http://localhost:5173
echo   - http://127.0.0.1:5173
echo.
echo Network Access (from other devices):
echo   - Backend: http://192.168.17.1:8000
echo   - Frontend: http://192.168.17.1:5173
echo.
echo ========================================
echo.
echo New windows have opened for Backend and Frontend.
echo Check those windows for server logs.
echo.
echo To stop the servers:
echo   - Close the Backend and Frontend windows
echo   - Or press Ctrl+C in each window
echo.
echo ========================================
echo.
echo Ready! Open http://localhost:5173 in your browser
echo.
pause

