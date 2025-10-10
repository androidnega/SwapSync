/**
 * Preload script for SwapSync Electron app
 * Provides secure bridge between main process and renderer
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform info
  platform: process.platform,
  
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Backend status
  checkBackend: () => ipcRenderer.invoke('check-backend'),
  
  // Notifications
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
});

console.log('✅ SwapSync Preload Script Loaded');
