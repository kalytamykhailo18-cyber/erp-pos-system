import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';

/**
 * Offline Indicator Component
 * PART 12: OFFLINE MODE - Shows offline status and pending sync count
 *
 * Displays:
 * - Connection status (online/offline)
 * - Number of pending operations to sync
 * - Click to view sync status dashboard
 */

const OfflineIndicator: React.FC = () => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending count
    loadPendingCount();

    // Refresh pending count every 30 seconds
    const interval = setInterval(loadPendingCount, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const loadPendingCount = async () => {
    try {
      const count = await db.syncQueue
        .where('status')
        .equals('PENDING')
        .count();

      setPendingCount(count);
    } catch (error) {
      console.error('[OfflineIndicator] Error loading pending count:', error);
    }
  };

  const handleClick = () => {
    navigate('/sync-status');
  };

  // Don't show anything if online and no pending operations
  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 transition-all hover:scale-105 z-50 ${
        isOnline
          ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
          : 'bg-red-500 hover:bg-red-600 text-white'
      }`}
      title="Ver estado de sincronización"
    >
      {/* Status Icon */}
      <div className="relative">
        {isOnline ? (
          // Cloud with sync icon (pending operations)
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        ) : (
          // Cloud with X (offline)
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        )}

        {/* Pending count badge */}
        {pendingCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-white text-red-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-red-500">
            {pendingCount > 99 ? '99+' : pendingCount}
          </div>
        )}
      </div>

      {/* Status Text */}
      <div className="text-left">
        <p className="font-semibold text-sm">
          {isOnline ? 'Sincronizando' : 'Sin Conexión'}
        </p>
        <p className="text-xs opacity-90">
          {pendingCount > 0
            ? `${pendingCount} operación${pendingCount > 1 ? 'es' : ''} pendiente${pendingCount > 1 ? 's' : ''}`
            : 'Modo offline'}
        </p>
      </div>
    </button>
  );
};

export default OfflineIndicator;
