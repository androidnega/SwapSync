# 🌐 SwapSync - Local Network Access Setup

## Your Network Configuration
- **Your IP Address**: `192.168.17.1`
- **Backend Server**: `http://192.168.17.1:8000`
- **Frontend App**: `http://192.168.17.1:5173`

## Quick Start

### Option 1: Use the Startup Script (Recommended)
Simply double-click `START_NETWORK.bat` to start both servers configured for network access.

### Option 2: Manual Start

#### 1. Start the Backend
```bash
cd backend
python main.py
```
The backend will automatically listen on all network interfaces (0.0.0.0:8000)

#### 2. Start the Frontend
```bash
cd frontend
npm run dev
```
The frontend will now listen on all network interfaces (0.0.0.0:5173)

## Accessing from Other Devices

### From Your Computer (Host Machine)
- Open: `http://localhost:5173` or `http://192.168.17.1:5173`

### From Other Devices on Same Network (Phone, Tablet, Other PC)
1. Make sure the device is connected to the **same WiFi network**
2. Open browser and go to: `http://192.168.17.1:5173`

### Troubleshooting

#### Can't Access from Other Devices?

1. **Check Windows Firewall**
   - Open Windows Defender Firewall
   - Click "Allow an app through firewall"
   - Make sure Python and Node.js have network access
   - Or temporarily disable firewall for testing

2. **Verify Your IP Address**
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" under your active network adapter
   If it's different from 192.168.17.1, update the CORS settings in `backend/main.py`

3. **Check Network Type**
   - Make sure your network is set to "Private" not "Public"
   - Go to: Settings > Network & Internet > Properties
   - Change to Private network

4. **Allow Ports Through Firewall**
   ```bash
   # Run as Administrator
   netsh advfirewall firewall add rule name="SwapSync Backend" dir=in action=allow protocol=TCP localport=8000
   netsh advfirewall firewall add rule name="SwapSync Frontend" dir=in action=allow protocol=TCP localport=5173
   ```

#### API Not Working?
If the frontend can't connect to the backend, the API URL is automatically detected based on the hostname. It will use:
- `http://localhost:8000/api` when accessed via localhost
- `http://192.168.17.1:8000/api` when accessed via network IP

## Configuration Details

### What Was Changed:

1. **Frontend Vite Config** (`frontend/vite.config.ts`)
   - Added `host: '0.0.0.0'` to listen on all network interfaces

2. **API Service** (`frontend/src/services/api.ts`)
   - Made API URL dynamic - automatically uses the correct host
   - Works seamlessly on localhost and network IP

3. **Backend CORS** (`backend/main.py`)
   - Added your network IP to allowed origins
   - Allows requests from http://192.168.17.1:5173

### Dynamic API URL
The frontend now automatically detects which URL to use:
- When accessed via `localhost:5173` → calls `http://localhost:8000/api`
- When accessed via `192.168.17.1:5173` → calls `http://192.168.17.1:8000/api`

## Security Note
⚠️ This configuration is for **local network development only**. 
For production deployment, you'll need proper security configurations including:
- HTTPS/SSL certificates
- Proper CORS policies
- Firewall rules
- Authentication & authorization

## Need Help?
If you have a different IP address or need to access from a different network, update:
- `backend/main.py` line 66: Add your new IP to CORS origins

