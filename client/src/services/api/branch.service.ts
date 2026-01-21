import apiClient from './client';
import type { Branch, ApiResponse } from '../../types';

export interface UpdateBranchSettingsData {
  receipt_footer?: string;
  auto_print_receipt?: boolean;
  require_customer?: boolean;
  enable_discounts?: boolean;
  max_discount_percent?: number;
  tax_id?: string;
  tax_condition?: string;
  factuhoy_point_of_sale?: string;
  default_invoice_type?: 'A' | 'B' | 'C';
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
