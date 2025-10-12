/**
 * Offline Storage Manager using IndexedDB
 * Stores data locally when offline and syncs when online
 */

const DB_NAME = 'SwapSyncOfflineDB';
const DB_VERSION = 1;

// Store names
const STORES = {
  PHONES: 'phones',
  CUSTOMERS: 'customers',
  SWAPS: 'swaps',
  SALES: 'sales',
  REPAIRS: 'repairs',
  PENDING_OPERATIONS: 'pending_operations',
  SETTINGS: 'settings',
};

class OfflineStorageManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains(STORES.PHONES)) {
          const phoneStore = db.createObjectStore(STORES.PHONES, { keyPath: 'id', autoIncrement: true });
          phoneStore.createIndex('unique_id', 'unique_id', { unique: false });
          phoneStore.createIndex('brand', 'brand', { unique: false });
          phoneStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.CUSTOMERS)) {
          const customerStore = db.createObjectStore(STORES.CUSTOMERS, { keyPath: 'id', autoIncrement: true });
          customerStore.createIndex('phone_number', 'phone_number', { unique: false });
          customerStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.SWAPS)) {
          const swapStore = db.createObjectStore(STORES.SWAPS, { keyPath: 'id', autoIncrement: true });
          swapStore.createIndex('customer_id', 'customer_id', { unique: false });
          swapStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.SALES)) {
          const saleStore = db.createObjectStore(STORES.SALES, { keyPath: 'id', autoIncrement: true });
          saleStore.createIndex('customer_id', 'customer_id', { unique: false });
          saleStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.REPAIRS)) {
          const repairStore = db.createObjectStore(STORES.REPAIRS, { keyPath: 'id', autoIncrement: true });
          repairStore.createIndex('customer_id', 'customer_id', { unique: false });
          repairStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.PENDING_OPERATIONS)) {
          const opStore = db.createObjectStore(STORES.PENDING_OPERATIONS, { keyPath: 'id', autoIncrement: true });
          opStore.createIndex('timestamp', 'timestamp', { unique: false });
          opStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }

        console.log('✅ IndexedDB stores created');
      };
    });
  }

  // Generic methods for CRUD operations
  async save(storeName: string, data: any): Promise<any> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const dataWithSync = { ...data, synced: false, offline_created: true };
      const request = store.put(dataWithSync);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName: string): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getById(storeName: string, id: number): Promise<any> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async update(storeName: string, data: any): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get unsynced items
  async getUnsynced(storeName: string): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index('synced');
      const request = index.getAll(false);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Mark item as synced
  async markAsSynced(storeName: string, id: number): Promise<void> {
    const item = await this.getById(storeName, id);
    if (item) {
      item.synced = true;
      await this.update(storeName, item);
    }
  }

  // Settings
  async setSetting(key: string, value: any): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.SETTINGS], 'readwrite');
      const store = transaction.objectStore(STORES.SETTINGS);
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSetting(key: string): Promise<any> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.SETTINGS], 'readonly');
      const store = transaction.objectStore(STORES.SETTINGS);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineStorage = new OfflineStorageManager();
export { STORES };

