/**
 * Offline Indicator - Shows network status and pending sync count
 */
import React, { useState, useEffect } from 'react';
import { syncManager } from '../services/syncManager';

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      console.log('🌐 Back online - starting sync...');
      setIsSyncing(true);
      
      try {
        const result = await syncManager.syncAll();
        console.log(`✅ Synced: ${result.success} succeeded, ${result.failed} failed`);
        await updatePendingCount();
      } catch (error) {
        console.error('❌ Sync failed:', error);
      } finally {
        setIsSyncing(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('📡 Went offline');
    };

    const updatePendingCount = async () => {
      const count = await syncManager.getPendingCount();
      setPendingCount(count);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Update pending count every 5 seconds
    const interval = setInterval(updatePendingCount, 5000);
    updatePendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) return;
    
    setIsSyncing(true);
    try {
      await syncManager.syncAll();
      const count = await syncManager.getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline && pendingCount === 0) {
    // Don't show indicator when online and nothing pending
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 ${
        isOnline 
          ? 'bg-white border border-gray-300' 
          : 'bg-yellow-100 border-2 border-yellow-400'
      }`}>
        {/* Status Icon */}
        <div className="flex-shrink-0">
          {isSyncing ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
          ) : isOnline ? (
            <div className="w-3 h-3 rounded-full bg-green-500" />
          ) : (
            <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
          )}
        </div>

        {/* Status Text */}
        <div className="text-sm">
          {isSyncing ? (
            <span className="font-medium text-blue-700">Syncing...</span>
          ) : isOnline ? (
            <>
              <span className="font-medium text-gray-900">Online</span>
              {pendingCount > 0 && (
                <span className="ml-2 text-xs text-gray-600">
                  ({pendingCount} pending)
                </span>
              )}
            </>
          ) : (
            <div>
              <div className="font-medium text-yellow-900">Offline Mode</div>
              {pendingCount > 0 && (
                <div className="text-xs text-yellow-800">
                  {pendingCount} operations will sync when online
                </div>
              )}
            </div>
          )}
        </div>

        {/* Manual Sync Button */}
        {isOnline && pendingCount > 0 && !isSyncing && (
          <button
            onClick={handleManualSync}
            className="ml-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg font-medium transition-colors"
          >
            Sync Now
          </button>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;

