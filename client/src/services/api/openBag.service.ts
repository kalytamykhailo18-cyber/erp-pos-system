import { get, post, patch } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  OpenBag,
  UUID,
  Decimal
} from '../../types';

export const openBagService = {
  /**
   * Get all open bags with pagination and filters
   */
  getAll: (params?: {
    page?: number;
    limit?: number;
    branch_id?: UUID;
    product_id?: UUID;
    status?: 'OPEN' | 'EMPTY';
  }): Promise<PaginatedResponse<OpenBag>> => {
    return get<OpenBag[]>('/open-bags', params) as Promise<PaginatedResponse<OpenBag>>;
  },

  /**
   * Get open bags for a specific branch
   */
  getByBranch: (branchId: UUID): Promise<ApiResponse<OpenBag[]>> => {
    return get<OpenBag[]>(`/open-bags/branch/${branchId}`);
  },

  /**
   * Get open bags with low stock
   */
  getLowStock: (params?: {
    branch_id?: UUID;
  }): Promise<ApiResponse<OpenBag[]>> => {
    return get<OpenBag[]>('/open-bags/low-stock', params);
  },

  /**
   * Get open bag by ID
   */
  getById: (id: UUID): Promise<ApiResponse<OpenBag>> => {
    return get<OpenBag>(`/open-bags/${id}`);
  },

  /**
   * Open a sealed bag for loose sales
   */
  create: (data: {
    branch_id: UUID;
    product_id: UUID;
    original_weight: Decimal;
    low_stock_threshold?: Decimal;
    notes?: string;
  }): Promise<ApiResponse<OpenBag>> => {
    return post<OpenBag>('/open-bags', data);
  },

  /**
   * Deduct quantity from open bag (on loose sale)
   */
  deduct: (id: UUID, data: {
    quantity: Decimal;
    sale_id?: UUID;
  }): Promise<ApiResponse<OpenBag>> => {
    return patch<OpenBag>(`/open-bags/${id}/deduct`, data);
  },

  /**
   * Close an open bag (mark as empty)
   */
  close: (id: UUID, data?: {
    notes?: string;
  }): Promise<ApiResponse<OpenBag>> => {
    return patch<OpenBag>(`/open-bags/${id}/close`, data);
  }
};
