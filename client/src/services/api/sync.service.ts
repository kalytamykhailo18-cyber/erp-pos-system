/**
 * Sync API Service
 *
 * Handles communication with backend sync endpoints
 * Matches server/src/routes/sync.routes.js endpoints
 */

import { get, post } from './client';
import type { ApiResponse, UUID } from '../../types';

/**
 * Sync push item - matches server/src/types/sync.ts SyncPushItem
 */
interface SyncPushItem {
  entity_type: string;
  local_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data: object;
  local_created_at: string;
}

/**
 * Sync push request - matches server/src/types/sync.ts SyncPushRequest
 */
interface SyncPushRequest {
  branch_id: UUID;
  register_id: UUID;
  items: SyncPushItem[];
  last_sync_at: string | null;
}

/**
 * Sync conflict - matches server/src/types/sync.ts SyncConflict
 */
interface SyncConflict {
  local_id: string;
  entity_type: string;
  conflict_type: string;
  local_data: object;
  server_data: object;
  suggested_resolution: 'LOCAL_WINS' | 'SERVER_WINS' | 'MERGED';
}

/**
 * Sync push response - matches server/src/types/sync.ts SyncPushResponse
 */
interface SyncPushResponse {
  success: boolean;
  processed: number;
  failed: number;
  conflicts: SyncConflict[];
  server_time: string;
}

/**
 * Sync pull request - matches server/src/types/sync.ts SyncPullRequest
 */
interface SyncPullRequest {
  branch_id: UUID;
  last_sync_at: string | null;
  entity_types?: string[];
}

/**
 * Sync pull data - matches server/src/types/sync.ts SyncPullData
 */
interface SyncPullData {
  products?: any[];
  categories?: any[];
  customers?: any[];
  payment_methods?: any[];
  users?: any[];
  branch_stock?: any[];
}

/**
 * Sync pull response - matches server/src/types/sync.ts SyncPullResponse
 */
interface SyncPullResponse {
  success: boolean;
  data: SyncPullData;
  server_time: string;
}

/**
 * Sync status overview - matches server/src/types/sync.ts SyncStatusOverview
 */
interface SyncStatusOverview {
  pending_count: number;
  processing_count: number;
  failed_count: number;
  conflict_count: number;
  last_successful_sync: string | null;
  by_entity_type: {
    entity_type: string;
    pending: number;
    failed: number;
    conflicts: number;
  }[];
}

/**
 * Resolve conflict request - matches server/src/types/sync.ts ResolveConflictRequest
 */
interface ResolveConflictRequest {
  queue_id: UUID;
  resolution: 'LOCAL_WINS' | 'SERVER_WINS' | 'MERGED';
  merged_data?: object;
}

export const syncService = {
  /**
   * Push offline changes to server
   * POST /api/v1/sync/push
   */
  push: (request: SyncPushRequest): Promise<ApiResponse<SyncPushResponse>> => {
    return post<SyncPushResponse>('/sync/push', request);
  },

  /**
   * Pull data from server for offline use
   * POST /api/v1/sync/pull
   */
  pull: (request: SyncPullRequest): Promise<ApiResponse<SyncPullResponse>> => {
    return post<SyncPullResponse>('/sync/pull', request);
  },

  /**
   * Get sync status overview for a branch
   * GET /api/v1/sync/status
   */
  getStatus: (branchId: UUID): Promise<ApiResponse<SyncStatusOverview>> => {
    return get<SyncStatusOverview>('/sync/status', { branch_id: branchId });
  },

  /**
   * Get sync queue items
   * GET /api/v1/sync/queue
   */
  getQueue: (params?: {
    branch_id?: UUID;
    register_id?: UUID;
    entity_type?: string;
    status?: string;
  }): Promise<ApiResponse<any[]>> => {
    return get<any[]>('/sync/queue', params);
  },

  /**
   * Get unresolved conflicts
   * GET /api/v1/sync/conflicts
   */
  getConflicts: (branchId: UUID): Promise<ApiResponse<SyncConflict[]>> => {
    return get<SyncConflict[]>('/sync/conflicts', { branch_id: branchId });
  },

  /**
   * Resolve a conflict
   * POST /api/v1/sync/conflicts/:id/resolve
   */
  resolveConflict: (
    conflictId: UUID,
    request: ResolveConflictRequest
  ): Promise<ApiResponse<any>> => {
    return post<any>(`/sync/conflicts/${conflictId}/resolve`, request);
  },

  /**
   * Get audit log
   * GET /api/v1/sync/audit
   */
  getAuditLog: (params?: {
    branch_id?: UUID;
    entity_type?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<ApiResponse<any[]>> => {
    return get<any[]>('/sync/audit', params);
  },
};

export default syncService;
