import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import SyncIcon from '@mui/icons-material/Sync';
import CloudOffIcon from '@mui/icons-material/CloudOff';

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
          <SyncIcon sx={{ fontSize: 24 }} />
        ) : (
          <CloudOffIcon sx={{ fontSize: 24 }} />
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
