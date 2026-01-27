import apiClient from './client';
import type { ApiResponse } from '../../types';

export interface SystemSettingsData {
  id: string;
  company_name: string;
  tax_id: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  currency: string;
  timezone: string;
  date_format: string;
  enable_invoicing: boolean;
  factuhoy_api_key_masked?: string;
  has_factuhoy_api_key: boolean;
}

export interface UpdateSystemSettingsData {
  company_name?: string;
  tax_id?: string;
  address?: string;
  phone?: string;
  email?: string;
  currency?: string;
  timezone?: string;
  date_format?: string;
  enable_invoicing?: boolean;
  factuhoy_api_key?: string;
}

const settingsService = {
  // Get system settings
  get: async (): Promise<ApiResponse<SystemSettingsData>> => {
    const response = await apiClient.get<ApiResponse<SystemSettingsData>>('/settings');
    return response.data;
  },

  // Update system settings
  update: async (data: UpdateSystemSettingsData): Promise<ApiResponse<SystemSettingsData>> => {
    const response = await apiClient.put<ApiResponse<SystemSettingsData>>('/settings', data);
    return response.data;
  },
};

export default settingsService;
