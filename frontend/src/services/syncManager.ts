/**
 * Sync Manager - Handles synchronization of offline data to server
 */
import axios from 'axios';
import { offlineStorage, STORES } from './offlineStorage';
import { getToken } from './authService';
import { API_URL } from './api';

interface PendingOperation {
  id?: number;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  resource: 'phones' | 'customers' | 'swaps' | 'sales' | 'repairs';
  data: any;
  timestamp: number;
  retries: number;
}

class SyncManager {
  private isSyncing = false;
  private syncInterval: any = null;

  async addPendingOperation(operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    const op: PendingOperation = {
      ...operation,
      timestamp: Date.now(),
      retries: 0,
    };

    await offlineStorage.save(STORES.PENDING_OPERATIONS, op);
    console.log('📝 Pending operation saved:', op);
  }

  async syncAll(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      console.log('⏳ Sync already in progress...');
      return { success: 0, failed: 0 };
    }

    if (!navigator.onLine) {
      console.log('📡 Offline - cannot sync');
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    let successCount = 0;
    let failedCount = 0;

    try {
      const pendingOps = await offlineStorage.getAll(STORES.PENDING_OPERATIONS);
      console.log(`🔄 Syncing ${pendingOps.length} pending operations...`);

      for (const op of pendingOps) {
        try {
          await this.syncOperation(op);
          await offlineStorage.delete(STORES.PENDING_OPERATIONS, op.id);
          successCount++;
          console.log(`✅ Synced operation #${op.id}`);
        } catch (error: any) {
          console.error(`❌ Failed to sync operation #${op.id}:`, error);
          
          // Update retry count
          op.retries = (op.retries || 0) + 1;
          
          // Remove if too many retries (more than 5)
          if (op.retries > 5) {
            console.warn(`⚠️ Operation #${op.id} failed after ${op.retries} retries, removing`);
            await offlineStorage.delete(STORES.PENDING_OPERATIONS, op.id);
          } else {
            await offlineStorage.update(STORES.PENDING_OPERATIONS, op);
          }
          
          failedCount++;
        }
      }

      // Sync cached data
      await this.syncCachedData();

      console.log(`✅ Sync complete: ${successCount} succeeded, ${failedCount} failed`);
    } catch (error) {
      console.error('❌ Sync error:', error);
    } finally {
      this.isSyncing = false;
    }

    return { success: successCount, failed: failedCount };
  }

  private async syncOperation(op: PendingOperation): Promise<void> {
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };

    const endpoint = `${API_URL}/${op.resource}/`;

    switch (op.type) {
      case 'CREATE':
        await axios.post(endpoint, op.data, { headers });
        break;
      case 'UPDATE':
        await axios.put(`${endpoint}${op.data.id}`, op.data, { headers });
        break;
      case 'DELETE':
        await axios.delete(`${endpoint}${op.data.id}`, { headers });
        break;
    }
  }

  private async syncCachedData(): Promise<void> {
    const token = getToken();
    if (!token) return;

    try {
      // Sync unsynced phones
      const unsyncedPhones = await offlineStorage.getUnsynced(STORES.PHONES);
      for (const phone of unsyncedPhones) {
        try {
          if (phone.offline_created) {
            const headers = { Authorization: `Bearer ${token}` };
            await axios.post(`${API_URL}/phones/`, phone, { headers });
            await offlineStorage.markAsSynced(STORES.PHONES, phone.id);
          }
        } catch (error) {
          console.error('Failed to sync phone:', error);
        }
      }

      // Similar for other resources...
      console.log('✅ Cached data synced');
    } catch (error) {
      console.error('❌ Failed to sync cached data:', error);
    }
  }

  startAutoSync(intervalMs: number = 30000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.syncAll();
      }
    }, intervalMs);

    console.log('🔄 Auto-sync started (every 30s)');
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏸️ Auto-sync stopped');
    }
  }

  async getPendingCount(): Promise<number> {
    const pending = await offlineStorage.getAll(STORES.PENDING_OPERATIONS);
    return pending.length;
  }
}

export const syncManager = new SyncManager();

