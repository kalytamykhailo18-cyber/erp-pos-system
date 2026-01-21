import { get, post } from './client';
import type {
  ApiResponse,
  CashWithdrawal,
  CreateWithdrawalData,
  UUID,
} from '../../types';

interface SessionWithdrawalsResponse {
  withdrawals: CashWithdrawal[];
  total: number;
  count: number;
}

export const withdrawalService = {
  /**
   * Create cash withdrawal during session
   */
  create: (sessionId: UUID, data: CreateWithdrawalData): Promise<ApiResponse<CashWithdrawal>> => {
    return post<CashWithdrawal>(`/registers/sessions/${sessionId}/withdrawals`, data);
  },

  /**
   * Get all withdrawals for a session
   */
  getBySession: (sessionId: UUID): Promise<ApiResponse<SessionWithdrawalsResponse>> => {
    return get<SessionWithdrawalsResponse>(`/registers/sessions/${sessionId}/withdrawals`);
  },

  /**
   * Get withdrawal by ID
   */
  getById: (id: UUID): Promise<ApiResponse<CashWithdrawal>> => {
    return get<CashWithdrawal>(`/registers/withdrawals/${id}`);
  },
};
