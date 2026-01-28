import apiClient from './client';
import type { Branch, ApiResponse, PaginatedResponse } from '../../types';

export interface UpdateBranchSettingsData {
  receipt_footer?: string;
  auto_print_receipt?: boolean;
  require_customer?: boolean;
  enable_discounts?: boolean;
  max_discount_percent?: number;
  petty_cash_amount?: number;
  tax_id?: string;
  tax_condition?: string;
  factuhoy_point_of_sale?: number;
  default_invoice_type?: 'A' | 'B' | 'C';
  weekday_opening_time?: string;
  weekday_closing_time?: string;
  midday_closing_time?: string;
  afternoon_opening_time?: string | null;
  evening_closing_time?: string;
  sunday_opening_time?: string;
  sunday_closing_time?: string;
  has_shift_change?: boolean;
}

export interface CreateBranchData {
  code: string;
  name: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
}

export interface UpdateBranchData {
  code?: string;
  name?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  is_active?: boolean;
}

const branchService = {
  // Get branch by ID
  getById: async (id: string): Promise<ApiResponse<Branch>> => {
    const response = await apiClient.get<ApiResponse<Branch>>(`/branches/${id}`);
    return response.data;
  },

  // Update branch settings
  updateSettings: async (id: string, data: UpdateBranchSettingsData): Promise<ApiResponse<Branch>> => {
    const response = await apiClient.put<ApiResponse<Branch>>(`/branches/${id}`, data);
    return response.data;
  },

  // Get all branches (paginated)
  getAll: async (params?: { is_active?: string; search?: string }): Promise<PaginatedResponse<Branch>> => {
    const response = await apiClient.get<PaginatedResponse<Branch>>('/branches', { params });
    return response.data;
  },

  // Create new branch
  create: async (data: CreateBranchData): Promise<ApiResponse<Branch>> => {
    const response = await apiClient.post<ApiResponse<Branch>>('/branches', data);
    return response.data;
  },

  // Update branch (name, code, address, etc.)
  update: async (id: string, data: UpdateBranchData): Promise<ApiResponse<Branch>> => {
    const response = await apiClient.put<ApiResponse<Branch>>(`/branches/${id}`, data);
    return response.data;
  },

  // Deactivate branch (soft delete)
  deactivate: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete<ApiResponse<null>>(`/branches/${id}`);
    return response.data;
  },
};

export default branchService;
