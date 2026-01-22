import { get, post, put } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  Register,
  RegisterSession,
  OpenSessionData,
  CloseSessionData,
  CloseSessionResponse,
  UUID,
} from '../../types';

interface SessionSummary {
  session: RegisterSession;
  sales: {
    count: number;
    total: number;
    average: number;
  };
  voided: {
    count: number;
    total: number;
  };
  payments: Array<{
    method: string;
    code: string;
    total: number;
  }>;
}

export const registerService = {
  /**
   * Get registers by branch
   */
  getByBranch: (branchId: UUID): Promise<ApiResponse<Register[]>> => {
    return get<Register[]>('/registers', { branch_id: branchId });
  },

  /**
   * Get register by ID
   */
  getById: (id: UUID): Promise<ApiResponse<Register>> => {
    return get<Register>(`/registers/${id}`);
  },

  /**
   * Create new register
   */
  create: (data: Partial<Register>): Promise<ApiResponse<Register>> => {
    return post<Register>('/registers', data);
  },

  /**
   * Update register
   */
  update: (id: UUID, data: Partial<Register>): Promise<ApiResponse<Register>> => {
    return put<Register>(`/registers/${id}`, data);
  },

  /**
   * Open register session
   */
  openSession: (data: OpenSessionData): Promise<ApiResponse<RegisterSession>> => {
    const { register_id, ...sessionData } = data;
    return post<RegisterSession>(`/registers/${register_id}/open`, sessionData);
  },

  /**
   * Close register session (BLIND CLOSING)
   * Cashier declares amounts without seeing expected values
   */
  closeSession: (sessionId: UUID, data: CloseSessionData): Promise<ApiResponse<CloseSessionResponse>> => {
    return post<CloseSessionResponse>(`/registers/sessions/${sessionId}/close`, data);
  },

  /**
   * Get active session for a register
   */
  getActiveSession: (registerId: UUID): Promise<ApiResponse<RegisterSession | null>> => {
    return get<RegisterSession | null>(`/registers/${registerId}/current-session`);
  },

  /**
   * Get current cashier's active session
   */
  getCashierSession: (): Promise<ApiResponse<RegisterSession | null>> => {
    return get<RegisterSession | null>('/registers/sessions/my-session');
  },

  /**
   * Get session summary (for closing)
   */
  getSessionSummary: (sessionId: UUID): Promise<ApiResponse<SessionSummary>> => {
    return get<SessionSummary>(`/registers/sessions/${sessionId}/summary`);
  },

  /**
   * CRITICAL: Get unapproved voided sales for session
   * Used to validate closing - register cannot close with unapproved voids
   */
  getUnapprovedVoids: (sessionId: UUID): Promise<ApiResponse<any>> => {
    return get<any>(`/registers/sessions/${sessionId}/unapproved-voids`);
  },

  /**
   * Get session by ID
   */
  getSessionById: (sessionId: UUID): Promise<ApiResponse<RegisterSession>> => {
    return get<RegisterSession>(`/registers/sessions/${sessionId}`);
  },

  /**
   * Get session history
   */
  getSessions: (params?: {
    branch_id?: UUID;
    register_id?: UUID;
    cashier_id?: UUID;
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<RegisterSession>> => {
    // Filter empty strings to avoid validation errors
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, v]) => v !== '' && v !== undefined)
    );
    // Backend endpoint is /registers/sessions/list
    return get<RegisterSession[]>('/registers/sessions/list', cleanParams) as Promise<PaginatedResponse<RegisterSession>>;
  },

  /**
   * Reopen a closed session (requires manager authorization)
   */
  reopenSession: (sessionId: UUID, reason: string, managerPin: string): Promise<ApiResponse<RegisterSession>> => {
    return post<RegisterSession>(`/registers/sessions/${sessionId}/reopen`, {
      reason,
      manager_pin: managerPin
    });
  },

  /**
   * Force close session (manager only)
   */
  forceClose: (sessionId: UUID, reason: string): Promise<ApiResponse<RegisterSession>> => {
    return post<RegisterSession>(`/registers/sessions/${sessionId}/force-close`, { reason });
  },
};

export default registerService;
