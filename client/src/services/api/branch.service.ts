import apiClient from './client';
import type { Branch, ApiResponse } from '../../types';

export interface UpdateBranchSettingsData {
  receipt_footer?: string;
  auto_print_receipt?: boolean;
  require_customer?: boolean;
  enable_discounts?: boolean;
  max_discount_percent?: number;
  petty_cash_amount?: number;
  tax_id?: string;
  tax_condition?: string;
  factuhoy_point_of_sale?: string;
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

  // Get all branches
  getAll: async (): Promise<ApiResponse<Branch[]>> => {
    const response = await apiClient.get<ApiResponse<Branch[]>>('/branches');
    return response.data;
  },
};

export default branchService;
