/**
 * Offline-First API Wrapper
 * Automatically handles offline storage and sync
 */
import axios, { AxiosRequestConfig } from 'axios';
import { offlineStorage, STORES } from './offlineStorage';
import { syncManager } from './syncManager';
import { getToken } from './authService';
import { API_URL } from './api';

class OfflineApi {
  /**
   * Create resource (with offline support)
   */
  async create(resource: string, data: any, storeOffline: boolean = true): Promise<any> {
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // Try online first
      if (navigator.onLine) {
        const response = await axios.post(`${API_URL}/${resource}/`, data, { headers });
        return response.data;
      }
    } catch (error: any) {
      console.log(`📡 Network error, saving offline: ${error.message}`);
    }

    // Save offline
    if (storeOffline) {
      await syncManager.addPendingOperation({
        type: 'CREATE',
        resource: resource as any,
        data,
      });

      // Also save to local cache
      const storeName = this.getStoreName(resource);
      if (storeName) {
        const savedId = await offlineStorage.save(storeName, data);
        return { ...data, id: savedId, offline: true };
      }
    }

    throw new Error('Cannot save - offline and offline storage disabled');
  }

  /**
   * Update resource (with offline support)
   */
  async update(resource: string, id: number, data: any): Promise<any> {
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // Try online first
      if (navigator.onLine) {
        const response = await axios.put(`${API_URL}/${resource}/${id}`, data, { headers });
        return response.data;
      }
    } catch (error: any) {
      console.log(`📡 Network error, saving offline: ${error.message}`);
    }

    // Save offline
    await syncManager.addPendingOperation({
      type: 'UPDATE',
      resource: resource as any,
      data: { ...data, id },
    });

    return { ...data, id, offline: true };
  }

  /**
   * Delete resource (with offline support)
   */
  async delete(resource: string, id: number): Promise<void> {
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // Try online first
      if (navigator.onLine) {
        await axios.delete(`${API_URL}/${resource}/${id}`, { headers });
        return;
      }
    } catch (error: any) {
      console.log(`📡 Network error, queuing delete: ${error.message}`);
    }

    // Queue for deletion when online
    await syncManager.addPendingOperation({
      type: 'DELETE',
      resource: resource as any,
      data: { id },
    });
  }

  /**
   * Get all resources (with offline fallback)
   */
  async getAll(resource: string): Promise<any[]> {
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // Try online first
      if (navigator.onLine) {
        const response = await axios.get(`${API_URL}/${resource}/`, { headers });
        
        // Update local cache
        const storeName = this.getStoreName(resource);
        if (storeName) {
          await offlineStorage.clear(storeName);
          for (const item of response.data) {
            await offlineStorage.save(storeName, { ...item, synced: true, offline_created: false });
          }
        }
        
        return response.data;
      }
    } catch (error: any) {
      console.log(`📡 Network error, using offline cache: ${error.message}`);
    }

    // Fallback to offline storage
    const storeName = this.getStoreName(resource);
    if (storeName) {
      const cached = await offlineStorage.getAll(storeName);
      console.log(`📂 Loaded ${cached.length} ${resource} from offline cache`);
      return cached;
    }

    return [];
  }

  /**
   * Helper to map resource names to store names
   */
  private getStoreName(resource: string): string | null {
    const mapping: Record<string, string> = {
      'phones': STORES.PHONES,
      'customers': STORES.CUSTOMERS,
      'swaps': STORES.SWAPS,
      'sales': STORES.SALES,
      'repairs': STORES.REPAIRS,
    };

    return mapping[resource] || null;
  }
}

export const offlineApi = new OfflineApi();

