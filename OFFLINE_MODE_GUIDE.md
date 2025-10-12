# 📡 Offline Mode & Low Network Support

## Overview
SwapSync now supports **full offline functionality** and works seamlessly in low network areas. All operations are saved locally and automatically synced when the internet connection is restored.

---

## ✨ Features

### 1. **Offline Storage (IndexedDB)**
- All data cached locally in browser
- Stores: Phones, Customers, Swaps, Sales, Repairs
- Automatic sync when back online
- No data loss even when offline

### 2. **Sync Queue System**
- Operations queued when offline
- Automatic retry mechanism (up to 5 attempts)
- Background sync every 30 seconds
- Manual sync button available

### 3. **Network Detection**
- Automatic detection of online/offline status
- Real-time sync when connection restored
- Visual indicator showing network status

### 4. **Progressive Web App (PWA)**
- Installable on mobile devices
- Works like a native app
- Offline-first approach
- Service Worker for asset caching

---

## 🎯 How It Works

### When **Online**:
1. All operations go directly to server
2. Data cached locally for offline access
3. Auto-sync runs every 30 seconds
4. Green indicator shows "Online"

### When **Offline**:
1. Operations saved to local IndexedDB
2. Added to sync queue
3. Yellow indicator shows "Offline Mode"
4. Shows pending operations count
5. User can continue working normally

### When **Back Online**:
1. Automatic sync triggered immediately
2. All pending operations uploaded
3. Local cache updated with server data
4. "Syncing..." indicator shown
5. Success/failure notifications

---

## 📱 Offline Indicator

Located at **bottom-right corner** of screen:

### States:
- **🟢 Green Dot + "Online"** - Connected, all synced
- **🟡 Yellow Dot (Pulsing) + "Offline Mode"** - No connection
- **⏳ Spinner + "Syncing..."** - Uploading queued data
- **"X pending"** - Number of operations waiting to sync

### Actions:
- **"Sync Now" button** - Manually trigger sync (when online with pending items)
- **Auto-sync** - Happens automatically every 30 seconds when online

---

## 💾 What Works Offline?

### ✅ Fully Supported:
- **View** cached data (phones, customers, repairs, etc.)
- **Create** new records (saved to queue)
- **Update** existing records (saved to queue)
- **Delete** records (saved to queue)
- **Search** and **Filter** cached data
- **Navigate** between pages

### ⚠️ Limitations:
- **SMS notifications** - Will be sent when sync completes
- **Real-time updates** - Only see your own changes until sync
- **Reports/Analytics** - May show stale data until online
- **Multi-user changes** - Won't see others' changes until sync

---

## 🔄 Sync Behavior

### Sync Triggers:
1. **Automatic** - Every 30 seconds when online
2. **On reconnect** - Immediately when network restored
3. **Manual** - Click "Sync Now" button
4. **On app startup** - If online, sync immediately

### Sync Process:
1. Check for pending operations in queue
2. Upload operations in chronological order
3. Mark successful operations as synced
4. Retry failed operations (max 5 times)
5. Update local cache with server data
6. Show success/failure notifications

### Conflict Resolution:
- **Server wins** - Server data always takes precedence
- **Last write wins** - Most recent update applied
- Failed syncs after 5 retries are discarded (logged)

---

## 🛠️ Technical Architecture

### Components:
1. **`offlineStorage.ts`** - IndexedDB manager
   - CRUD operations
   - Local caching
   - Sync status tracking

2. **`syncManager.ts`** - Sync queue handler
   - Operation queueing
   - Automatic sync
   - Retry logic

3. **`offlineApi.ts`** - API wrapper
   - Offline-first requests
   - Automatic fallback
   - Cache management

4. **`OfflineIndicator.tsx`** - UI component
   - Network status display
   - Sync progress
   - Manual sync button

5. **Service Worker** (`public/sw.js`)
   - Asset caching
   - Offline page serving
   - Background sync

6. **PWA Manifest** (`public/manifest.json`)
   - App installability
   - Icon configuration
   - Display settings

---

## 📊 Database Schema (IndexedDB)

### Stores:
- **phones** - Phone inventory
- **customers** - Customer records
- **swaps** - Swap transactions
- **sales** - Sale records
- **repairs** - Repair bookings
- **pending_operations** - Sync queue
- **settings** - App preferences

### Indexes:
- `synced` - Track sync status
- `timestamp` - Operation ordering
- `customer_id`, `phone_number`, etc. - Quick lookups

---

## 🚀 Usage Guide

### For End Users:

#### Normal Use (Online):
- Everything works as before
- Data auto-syncs
- No action needed

#### When Offline:
1. Continue using the app normally
2. Yellow indicator shows offline status
3. All operations are saved locally
4. Counter shows pending operations

#### When Back Online:
1. Green indicator returns
2. "Syncing..." message appears
3. All pending data uploads automatically
4. Confirmation when complete

### Installation as PWA:

#### On Mobile (Android/iOS):
1. Open app in browser
2. Tap browser menu (⋮ or share icon)
3. Select "Add to Home Screen" or "Install App"
4. App icon appears on home screen
5. Launch like a native app

#### On Desktop (Chrome/Edge):
1. Look for install icon in address bar
2. Click "Install SwapSync"
3. App opens in standalone window
4. Works like desktop app

---

## 🔧 Developer Notes

### Enabling Offline in Components:

```typescript
import { offlineApi } from '../services/offlineApi';

// Create with offline support
const newPhone = await offlineApi.create('phones', phoneData);

// Get with offline fallback
const phones = await offlineApi.getAll('phones');

// Update with offline support
await offlineApi.update('phones', phoneId, updates);

// Delete with offline support
await offlineApi.delete('phones', phoneId);
```

### Check Network Status:

```typescript
if (navigator.onLine) {
  // Online - safe to make API calls
} else {
  // Offline - use cached data
}
```

### Manual Sync:

```typescript
import { syncManager } from '../services/syncManager';

// Trigger sync
await syncManager.syncAll();

// Get pending count
const count = await syncManager.getPendingCount();
```

---

## ⚙️ Configuration

### Sync Interval:
Default: 30 seconds  
Modify in: `App.tsx` → `syncManager.startAutoSync(30000)`

### Retry Limit:
Default: 5 attempts  
Modify in: `syncManager.ts` → `if (op.retries > 5)`

### Cache Version:
Update when making breaking changes:  
`public/sw.js` → `CACHE_NAME = 'swapsync-v2'`

---

## 🐛 Troubleshooting

### Issue: Data not syncing
**Solution**: 
- Check network connection
- Click "Sync Now" button
- Check console for errors
- Clear browser cache and reload

### Issue: Old data showing
**Solution**:
- Trigger manual sync
- Wait for auto-sync (30s)
- Check offline indicator for pending count

### Issue: Offline mode not working
**Solution**:
- Check if service worker registered (console log)
- Verify IndexedDB is supported (modern browsers only)
- Check browser permissions

### Issue: Service Worker errors
**Solution**:
- Unregister old service workers
- Clear application data in DevTools
- Hard refresh (Ctrl+Shift+R)

---

## 📈 Benefits

✅ **Works in low network areas** - Automatically switches to offline mode  
✅ **No data loss** - All operations saved locally  
✅ **Seamless sync** - Automatic when connection restored  
✅ **Better UX** - No waiting for slow networks  
✅ **Mobile-friendly** - Installable PWA  
✅ **Reliable** - Retry mechanism ensures data integrity  

---

## 🎉 Result

SwapSync now works **anywhere**, **anytime** - perfect for:
- Rural areas with poor network
- Mobile shopkeepers
- Areas with intermittent connectivity
- Offline-first business operations
- Low-bandwidth environments

**Data is never lost, always synced when possible!** 🚀

