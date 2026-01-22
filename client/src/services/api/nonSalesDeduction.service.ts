import { get, post, patch } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  NonSalesDeduction,
  DeductionType,
  DeductionApprovalStatus,
  UUID,
  Decimal
} from '../../types';

export const nonSalesDeductionService = {
  /**
   * Get all non-sales deductions with pagination and filters
   */
  getAll: (params?: {
    page?: number;
    limit?: number;
    branch_id?: UUID;
    approval_status?: DeductionApprovalStatus;
    deduction_type?: DeductionType;
  }): Promise<PaginatedResponse<NonSalesDeduction>> => {
    return get<NonSalesDeduction[]>('/non-sales-deductions', params) as Promise<PaginatedResponse<NonSalesDeduction>>;
  },

  /**
   * Get pending non-sales deductions
   */
  getPending: (params?: {
    branch_id?: UUID;
  }): Promise<ApiResponse<NonSalesDeduction[]>> => {
    return get<NonSalesDeduction[]>('/non-sales-deductions/pending', params);
  },

  /**
   * Get non-sales deduction by ID
   */
  getById: (id: UUID): Promise<ApiResponse<NonSalesDeduction>> => {
    return get<NonSalesDeduction>(`/non-sales-deductions/${id}`);
  },

  /**
   * Create non-sales deduction request
   */
  create: (data: {
    branch_id: UUID;
    product_id: UUID;
    quantity: Decimal;
    deduction_type: DeductionType;
    reason?: string;
    recipient?: string;
  }): Promise<ApiResponse<NonSalesDeduction>> => {
    return post<NonSalesDeduction>('/non-sales-deductions', data);
  },

  /**
   * Approve non-sales deduction (Manager/Owner only)
   */
  approve: (id: UUID): Promise<ApiResponse<NonSalesDeduction>> => {
    return patch<NonSalesDeduction>(`/non-sales-deductions/${id}/approve`);
  },

  /**
   * Reject non-sales deduction (Manager/Owner only)
   */
  reject: (id: UUID, data?: {
    rejection_reason?: string;
  }): Promise<ApiResponse<NonSalesDeduction>> => {
    return patch<NonSalesDeduction>(`/non-sales-deductions/${id}/reject`, data);
  }
};
