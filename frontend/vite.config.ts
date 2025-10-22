import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Absolute paths for web deployment
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 2000, // Increase chunk size warning limit to 2MB
  },
})
