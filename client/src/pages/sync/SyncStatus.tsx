import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UUID } from '../../types';
import { db } from '../../services/db';
import { processSyncQueue, getSyncQueueStatus } from '../../services/offline/syncProcessor';
import { downloadDataForOffline } from '../../services/offline/syncService';
import { useAppSelector } from '../../store';

/**
 * Sync Status Dashboard
 * PART 12: OFFLINE MODE - Owner sees sync status and can resolve issues
 *
 * Shows:
 * - Pending operations to sync
 * - Sync conflicts that need resolution
 * - Failed operations that need retry
 * - Recent sync history
 * - Manual sync trigger
 */

interface SyncStats {
  pending: number;
  processing: number;
  failed: number;
  conflicts: number;
}

interface PendingSale {
  local_id: UUID;
  branch_id: UUID;
  total_amount: number;
  created_at: string;
  items_count: number;
  sync_status: string;
}

const SyncStatus: React.FC = () => {
  const navigate = useNavigate();
  const { currentBranch } = useAppSelector((state) => state.auth);
  const [currentSession, setCurrentSession] = useState<any>(null);

  const [syncStats, setSyncStats] = useState<SyncStats>({
    pending: 0,
    processing: 0,
    failed: 0,
    conflicts: 0,
  });

  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Load sync status
  useEffect(() => {
    loadSyncStatus();
    loadPendingSales();
    loadLastSyncTime();
    loadCurrentSession();

    // Refresh every 10 seconds
    const interval = setInterval(() => {
      loadSyncStatus();
      loadPendingSales();
    }, 10000);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadCurrentSession = async () => {
    try {
      // Get current session from auth state or localStorage
      const sessionStr = localStorage.getItem('currentSession');
      if (sessionStr) {
        setCurrentSession(JSON.parse(sessionStr));
      }
    } catch (error) {
      console.error('[SyncStatus] Error loading session:', error);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const stats = await getSyncQueueStatus();
      setSyncStats(stats);
    } catch (error) {
      console.error('[SyncStatus] Error loading sync status:', error);
    }
  };

  const loadPendingSales = async () => {
    try {
      const sales = await db.sales
        .where('sync_status')
        .equals('PENDING')
        .toArray();

      const salesWithItems: PendingSale[] = await Promise.all(
        sales.map(async (sale) => {
          const items = await db.saleItems
            .where('sale_local_id')
            .equals(sale.local_id)
            .count();

          return {
            local_id: sale.local_id,
            branch_id: sale.branch_id,
            total_amount: sale.total_amount,
            created_at: sale.local_created_at || '',
            items_count: items,
            sync_status: sale.sync_status || 'PENDING',
          };
        })
      );

      setPendingSales(salesWithItems);
    } catch (error) {
      console.error('[SyncStatus] Error loading pending sales:', error);
    }
  };

  const loadLastSyncTime = async () => {
    try {
      const time = await db.getLastSyncTime();
      setLastSyncTime(time);
    } catch (error) {
      console.error('[SyncStatus] Error loading last sync time:', error);
    }
  };

  const handleManualSync = async () => {
    if (!currentBranch || !currentSession) {
      setSyncMessage('Error: No branch or session available');
      return;
    }

    setIsSyncing(true);
    setSyncMessage('');

    try {
      // Upload pending operations
      const result = await processSyncQueue(currentBranch.id, currentSession.register_id);

      if (result.success) {
        const msg = `Sync completed: ${result.processed} uploaded, ${result.failed} failed, ${result.conflicts} conflicts`;
        setSyncMessage(msg);

        // Download latest data
        await downloadDataForOffline(currentBranch.id);

        // Reload status
        await loadSyncStatus();
        await loadPendingSales();
        await loadLastSyncTime();
      } else {
        setSyncMessage(`Sync failed: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[SyncStatus] Sync error:', error);
      setSyncMessage(`Sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Estado de Sincronización
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Monitoreo de operaciones offline y sincronización
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm transition-colors"
        >
          Volver al Dashboard
        </button>
      </div>

      {/* Connection Status */}
      <div className={`p-4 rounded-sm ${isOnline ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <div>
            <p className={`font-semibold ${isOnline ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              {isOnline ? 'En línea' : 'Sin conexión'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isOnline ? 'Sincronización automática activa' : 'Las ventas se guardan localmente hasta que se restaure la conexión'}
            </p>
          </div>
        </div>
      </div>

      {/* Sync Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
            {syncStats.pending}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Operaciones sin sincronizar
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Procesando</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {syncStats.processing}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Sincronizando ahora
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Fallidas</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
            {syncStats.failed}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Requieren atención
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Conflictos</p>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
            {syncStats.conflicts}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Revisión manual requerida
          </p>
        </div>
      </div>

      {/* Manual Sync Button */}
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sincronización Manual
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Última sincronización: {lastSyncTime ? formatDate(lastSyncTime) : 'Nunca'}
            </p>
            {syncMessage && (
              <p className={`text-sm mt-2 ${syncMessage.includes('error') || syncMessage.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>
                {syncMessage}
              </p>
            )}
          </div>

          <button
            onClick={handleManualSync}
            disabled={isSyncing || !isOnline || !currentBranch || !currentSession}
            className={`px-6 py-3 rounded-sm font-semibold transition-colors ${
              isSyncing || !isOnline || !currentBranch || !currentSession
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isSyncing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sincronizando...
              </span>
            ) : (
              'Sincronizar Ahora'
            )}
          </button>
        </div>
      </div>

      {/* Pending Sales */}
      {pendingSales.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ventas Pendientes de Sincronización ({pendingSales.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Fecha/Hora
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    ID Local
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {pendingSales.map((sale) => (
                  <tr key={sale.local_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {formatDate(sale.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {sale.local_id.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(sale.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">
                      {sale.items_count}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 text-xs rounded bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200">
                        {sale.sync_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Pending Operations */}
      {pendingSales.length === 0 && syncStats.pending === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-12 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Todo Sincronizado
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No hay operaciones pendientes de sincronización
          </p>
        </div>
      )}
    </div>
  );
};

export default SyncStatus;
