/**
 * Sync Queue Processor
 *
 * Processes pending operations in sync queue and uploads to server
 * Handles sync conflicts and retry logic
 *
 * Data flow:
 * IndexedDB sync queue → syncProcessor → API → Backend → Database
 */

import { db } from '../db';
import syncService from '../api/sync.service';
import type { UUID } from '../../types';

/**
 * Sync result summary
 */
export interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  conflicts: number;
  errors: string[];
}

/**
 * Process all pending items in sync queue
 * Called when network is restored or manually triggered
 *
 * @param branchId - Current branch ID
 * @param registerId - Current register ID
 * @returns Promise<SyncResult>
 */
export const processSyncQueue = async (
  branchId: UUID,
  registerId: UUID
): Promise<SyncResult> => {
  const result: SyncResult = {
    success: false,
    processed: 0,
    failed: 0,
    conflicts: 0,
    errors: [],
  };

  try {
    console.log('[SyncProcessor] Starting sync queue processing...');

    // Get all pending items from sync queue
    const pendingItems = await db.syncQueue
      .where('status')
      .equals('PENDING')
      .toArray();

    if (pendingItems.length === 0) {
      console.log('[SyncProcessor] No pending items to sync');
      result.success = true;
      return result;
    }

    console.log(`[SyncProcessor] Found ${pendingItems.length} pending items`);

    // Mark items as PROCESSING
    for (const item of pendingItems) {
      await db.syncQueue
        .where('id')
        .equals(item.id!)
        .modify({ status: 'PROCESSING' });
    }

    // Prepare sync request
    const syncItems = pendingItems.map((item) => ({
      entity_type: item.entity_type,
      local_id: item.entity_local_id,
      operation: item.operation,
      data: item.payload,
      local_created_at: item.local_created_at,
    }));

    // Call sync/push endpoint
    try {
      const response = await syncService.push({
        branch_id: branchId,
        register_id: registerId,
        items: syncItems,
        last_sync_at: await db.getLastSyncTime(),
      });

      if (!response.success || !response.data) {
        throw new Error('Sync push failed');
      }

      const syncData = response.data;

      // Calculate processed count
      const processedCount = syncData.processed || 0;
      result.processed = processedCount;

      // Mark synced items as SYNCED
      for (const item of pendingItems) {
        await db.syncQueue
          .where('id')
          .equals(item.id!)
          .modify({
            status: 'SYNCED',
            synced_at: response.data.server_time || new Date().toISOString(),
          });

        // If this was a sale, update the sale's sync status
        if (item.entity_type === 'SALE') {
          await db.sales
            .where('local_id')
            .equals(item.entity_local_id)
            .modify({
              sync_status: 'SYNCED',
              synced_at: response.data.server_time || new Date().toISOString(),
            });
        }
      }

      // Handle conflicts
      if (syncData.conflicts && syncData.conflicts.length > 0) {
        result.conflicts = syncData.conflicts.length;
        console.warn(
          `[SyncProcessor] ${syncData.conflicts.length} conflicts detected`
        );

        for (const conflict of syncData.conflicts) {
          // Find the queue item for this conflict
          const queueItem = pendingItems.find(
            (item) => item.entity_local_id === conflict.local_id
          );

          if (queueItem) {
            await db.syncQueue
              .where('id')
              .equals(queueItem.id!)
              .modify({
                status: 'CONFLICT',
                conflict_type: conflict.conflict_type,
                error_message: `Conflict: ${conflict.conflict_type}`,
              });

            // Update sale status if applicable
            if (queueItem.entity_type === 'SALE') {
              await db.sales
                .where('local_id')
                .equals(queueItem.entity_local_id)
                .modify({
                  sync_status: 'CONFLICT',
                  sync_error: `Conflict: ${conflict.conflict_type}`,
                });
            }
          }
        }
      }

      // Handle failures
      if (syncData.failed > 0) {
        result.failed = syncData.failed;
        console.error(`[SyncProcessor] ${syncData.failed} items failed to sync`);
      }

      // Update last sync time
      await db.setLastSyncTime(
        response.data.server_time || new Date().toISOString()
      );

      result.success = true;
      console.log('[SyncProcessor] Sync queue processing completed');
    } catch (error: any) {
      // Sync failed - mark items as FAILED with retry
      console.error('[SyncProcessor] Sync push failed:', error);
      result.errors.push(error.message || 'Sync push failed');

      for (const item of pendingItems) {
        await db.syncQueue
          .where('id')
          .equals(item.id!)
          .modify({
            status: 'FAILED',
            error_message: error.message || 'Sync push failed',
            retry_count: (item.retry_count || 0) + 1,
          });
      }

      result.failed = pendingItems.length;
      result.success = false;
    }
  } catch (error: any) {
    console.error('[SyncProcessor] Error processing sync queue:', error);
    result.errors.push(error.message || 'Unknown error');
    result.success = false;
  }

  return result;
};

/**
 * Retry failed sync items
 * Called manually or automatically with exponential backoff
 *
 * @param branchId - Current branch ID
 * @param registerId - Current register ID
 * @param maxRetries - Maximum retry count to attempt (default: 3)
 * @returns Promise<SyncResult>
 */
export const retryFailedSync = async (
  branchId: UUID,
  registerId: UUID,
  maxRetries: number = 3
): Promise<SyncResult> => {
  const result: SyncResult = {
    success: false,
    processed: 0,
    failed: 0,
    conflicts: 0,
    errors: [],
  };

  try {
    console.log('[SyncProcessor] Retrying failed sync items...');

    // Get failed items that haven't exceeded max retries
    const failedItems = await db.syncQueue
      .where('status')
      .equals('FAILED')
      .and((item) => item.retry_count < maxRetries)
      .toArray();

    if (failedItems.length === 0) {
      console.log('[SyncProcessor] No failed items to retry');
      result.success = true;
      return result;
    }

    console.log(`[SyncProcessor] Found ${failedItems.length} failed items to retry`);

    // Mark as PENDING to be picked up by normal sync
    for (const item of failedItems) {
      await db.syncQueue
        .where('id')
        .equals(item.id!)
        .modify({ status: 'PENDING' });
    }

    // Process the sync queue
    return await processSyncQueue(branchId, registerId);
  } catch (error: any) {
    console.error('[SyncProcessor] Error retrying failed sync:', error);
    result.errors.push(error.message || 'Unknown error');
    result.success = false;
  }

  return result;
};

/**
 * Get sync queue status
 *
 * @returns Promise<{pending: number, processing: number, failed: number, conflicts: number}>
 */
export const getSyncQueueStatus = async (): Promise<{
  pending: number;
  processing: number;
  failed: number;
  conflicts: number;
  total: number;
}> => {
  try {
    const [pending, processing, failed, conflicts] = await Promise.all([
      db.getPendingSyncCount(),
      db.syncQueue.where('status').equals('PROCESSING').count(),
      db.getFailedSyncCount(),
      db.getConflictCount(),
    ]);

    return {
      pending,
      processing,
      failed,
      conflicts,
      total: pending + processing + failed + conflicts,
    };
  } catch (error) {
    console.error('[SyncProcessor] Error getting sync queue status:', error);
    return {
      pending: 0,
      processing: 0,
      failed: 0,
      conflicts: 0,
      total: 0,
    };
  }
};

/**
 * Clear synced items from queue (housekeeping)
 * Keeps last 100 synced items for audit trail
 */
export const cleanupSyncedItems = async (): Promise<void> => {
  try {
    const syncedItems = await db.syncQueue
      .where('status')
      .equals('SYNCED')
      .reverse()
      .sortBy('synced_at');

    // Keep last 100 synced items, delete the rest
    if (syncedItems.length > 100) {
      const itemsToDelete = syncedItems.slice(100);
      for (const item of itemsToDelete) {
        await db.syncQueue.delete(item.id!);
      }
      console.log(`[SyncProcessor] Cleaned up ${itemsToDelete.length} old synced items`);
    }
  } catch (error) {
    console.error('[SyncProcessor] Error cleaning up synced items:', error);
  }
};

/**
 * Get pending sales count (for UI display)
 */
export const getPendingSalesCount = async (): Promise<number> => {
  try {
    return await db.sales.where('sync_status').equals('PENDING').count();
  } catch (error) {
    console.error('[SyncProcessor] Error getting pending sales count:', error);
    return 0;
  }
};

export default {
  processSyncQueue,
  retryFailedSync,
  getSyncQueueStatus,
  cleanupSyncedItems,
  getPendingSalesCount,
};
