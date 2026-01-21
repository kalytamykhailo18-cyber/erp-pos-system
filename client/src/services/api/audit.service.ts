import { get } from './client';
import type { ApiResponse, UUID } from '../../types';

export interface AuditLog {
  id: UUID;
  user_id: UUID | null;
  user_email: string | null;
  branch_id: UUID | null;
  ip_address: string | null;
  user_agent: string | null;
  action: string;
  entity_type: string;
  entity_id: UUID | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  description: string | null;
  created_at: string;
  user?: {
    id: UUID;
    first_name: string;
    last_name: string;
    email: string;
  };
  branch?: {
    id: UUID;
    name: string;
    code: string;
  };
}

export interface AuditLogsResponse {
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuditStatsResponse {
  action_counts: Array<{ action: string; count: number }>;
  entity_counts: Array<{ entity_type: string; count: number }>;
  top_users: Array<{ user_id: UUID; user_email: string; count: number }>;
}

export interface AuditFilters {
  user_id?: UUID;
  entity_type?: string;
  entity_id?: UUID;
  action?: string;
  branch_id?: UUID;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

/**
 * Audit Service
 * API calls for audit log management
 */
export const auditService = {
  /**
   * Get audit logs with filters and pagination
   */
  getAuditLogs: (filters?: AuditFilters): Promise<ApiResponse<AuditLogsResponse>> => {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.user_id) params.append('user_id', filters.user_id);
      if (filters.entity_type) params.append('entity_type', filters.entity_type);
      if (filters.entity_id) params.append('entity_id', filters.entity_id);
      if (filters.action) params.append('action', filters.action);
      if (filters.branch_id) params.append('branch_id', filters.branch_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
    }

    const queryString = params.toString();
    return get<AuditLogsResponse>(`/audit/logs${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get specific audit log by ID
   */
  getAuditLogById: (id: UUID): Promise<ApiResponse<AuditLog>> => {
    return get<AuditLog>(`/audit/logs/${id}`);
  },

  /**
   * Get complete audit trail for a specific entity
   */
  getEntityAuditTrail: (entityType: string, entityId: UUID): Promise<ApiResponse<{
    entity_type: string;
    entity_id: UUID;
    logs: AuditLog[];
    count: number;
  }>> => {
    return get(`/audit/entity/${entityType}/${entityId}`);
  },

  /**
   * Get audit statistics
   */
  getAuditStats: (filters?: {
    start_date?: string;
    end_date?: string;
    branch_id?: UUID;
  }): Promise<ApiResponse<AuditStatsResponse>> => {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.branch_id) params.append('branch_id', filters.branch_id);
    }

    const queryString = params.toString();
    return get<AuditStatsResponse>(`/audit/stats${queryString ? `?${queryString}` : ''}`);
  }
};
