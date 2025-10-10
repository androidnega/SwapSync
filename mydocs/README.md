# SwapSync Frontend

Electron + React + Vite + TypeScript frontend for SwapSync

## Features

- Modern React with TypeScript
- Fast development with Vite
- Desktop app with Electron
- Hot Module Replacement (HMR)

## Development

1. Install dependencies:
```bash
npm install
```

2. Run in development mode (web only):
```bash
npm run dev
```

3. Run as Electron app:
```bash
npm run electron:dev
```

This will start both the Vite dev server and Electron app.

## Building

Build the Electron app for distribution:

```bash
npm run electron:build
```

The built app will be in the `release/` directory.

## Scripts

- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run electron` - Run Electron (requires dev server running)
- `npm run electron:dev` - Run both Vite and Electron together
- `npm run electron:build` - Build production Electron app
