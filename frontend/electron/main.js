import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let backendProcess = null;
const BACKEND_PORT = 8000;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

// Function to check if backend is ready
async function waitForBackend(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await axios.get(`${BACKEND_URL}/`, { timeout: 2000 });
      console.log('✅ Backend is ready!');
      return true;
    } catch (error) {
      console.log(`⏳ Waiting for backend... (${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

// Function to start FastAPI backend
async function startBackend() {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log('🔧 Development mode: Backend should be started manually');
    console.log('   Run: cd backend && uvicorn main:app --reload');
    return await waitForBackend(10); // Wait briefly in dev mode
  }
  
  // Production mode: Start backend as subprocess
  const backendPath = path.join(process.resourcesPath, 'backend');
  const pythonExecutable = path.join(backendPath, 'python', 'python.exe');
  const mainScript = path.join(backendPath, 'main.py');
  
  console.log('🚀 Starting FastAPI backend...');
  console.log(`   Python: ${pythonExecutable}`);
  console.log(`   Script: ${mainScript}`);
  console.log(`   Working Directory: ${backendPath}`);
  
  // Check if Python exists
  const fs = require('fs');
  if (!fs.existsSync(pythonExecutable)) {
    console.error(`❌ Python not found at: ${pythonExecutable}`);
    
    // Show helpful error dialog
    const { dialog } = require('electron');
    dialog.showErrorBox(
      'SwapSync - Python Backend Missing',
      'Python backend is not installed.\n\n' +
      'This appears to be a portable installation.\n' +
      'Please use the bundled version from:\n' +
      'frontend\\release\\win-unpacked\\SwapSync.exe\n\n' +
      'Or install using the full installer.\n\n' +
      'The app will now close.'
    );
    return false;
  }
  
  // Use uvicorn to run the FastAPI app
  backendProcess = spawn(pythonExecutable, [
    '-m', 'uvicorn',
    'main:app',
    '--host', '0.0.0.0',
    '--port', '8000'
  ], {
    cwd: backendPath,
    env: {
      ...process.env,
      PYTHONUNBUFFERED: '1',
      PYTHONPATH: backendPath
    },
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`[Backend] ${data.toString().trim()}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`[Backend Error] ${data.toString().trim()}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
    backendProcess = null;
  });

  // Wait for backend to be ready
  const ready = await waitForBackend();
  if (!ready) {
    console.error('❌ Failed to start backend');
    return false;
  }
  
  return true;
}

// Function to stop backend
function stopBackend() {
  if (backendProcess) {
    console.log('🛑 Stopping backend...');
    backendProcess.kill();
    backendProcess = null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'SwapSync',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: false, // Allow localhost API calls in production
    },
    icon: path.join(__dirname, '../public/swapsyng.png'),
  });

  // In development mode, load from Vite dev server
  // In production, load the built files
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools(); // Open DevTools in development
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.on('ready', async () => {
  console.log('🚀 SwapSync starting...');
  
  // Try to start backend (if bundled) or check if it's running
  const backendStarted = await startBackend();
  
  // In production, if backend is not bundled, just check if it's running
  if (!backendStarted && process.env.NODE_ENV !== 'development') {
    console.warn('⚠️ Backend auto-start failed. Checking if backend is running...');
    const backendRunning = await waitForBackend(5); // Quick check
    if (!backendRunning) {
      console.error('❌ Backend is not running. Please start the backend server first.');
      // Show error dialog instead of quitting silently
      const { dialog } = require('electron');
      dialog.showErrorBox(
        'Backend Server Not Running',
        'SwapSync backend server is not running.\n\n' +
        'Please start the backend by running START_ALL.bat\n' +
        'or START_SWAPSYNC.bat before launching the app.\n\n' +
        'The app will now close.'
      );
      app.quit();
      return;
    } else {
      console.log('✅ Found running backend server!');
    }
  }
  
  // Create window
  createWindow();
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('will-quit', () => {
  stopBackend();
});

// Handle app errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  stopBackend();
});

