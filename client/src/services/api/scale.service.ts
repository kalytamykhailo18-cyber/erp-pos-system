/**
 * Scale Service
 * PART 13: KRETZ SCALE INTEGRATION
 *
 * API service for Kretz Aura scale integration
 * Handles price list export and scale barcode parsing
 */

import { get, post, put } from './client';
import type { ApiResponse, UUID } from '../../types';

export interface ScaleProduct {
  id: UUID;
  sku: string;
  name: string;
  selling_price: number;
  scale_plu: number;
  is_weighable: boolean;
  export_to_scale: boolean;
  tare_weight?: number;
}

export interface ScaleExportStatistics {
  total_products: number;
  weighable_products: number;
  products_with_plu: number;
  exportable_products: number;
  missing_plu: number;
  export_ready: boolean;
}

export interface ScaleBarcodeParseResult {
  valid: boolean;
  plu?: number;
  weight?: number;
  price?: number;
  barcode_type?: string;
  product_found?: boolean;
  product?: {
    id: UUID;
    sku: string;
    name: string;
    scale_plu: number;
    unit_price: number;
    is_weighable: boolean;
  };
  error?: string;
}

export interface PLUValidationResult {
  unique: boolean;
  conflict?: {
    id: UUID;
    name: string;
    plu: number;
  };
}

export interface ScaleConfiguration {
  scale_ip?: string;
  scale_port?: number;
  scale_enabled: boolean;
  scale_sync_frequency: 'manual' | 'hourly' | 'daily';
  scale_last_sync?: string;
  scale_connection_protocol: 'serial' | 'ftp' | 'http' | 'tcp';
  scale_ftp_username?: string;
  scale_upload_path?: string;
}

export interface ScaleConnectionTestResult {
  connected: boolean;
  protocol: string;
  ip: string;
  port: number;
  message: string;
  error?: string;
}

export interface ScaleSyncResult {
  success: boolean;
  protocol: string;
  filename?: string;
  remotePath?: string;
  url?: string;
  size: number;
  timestamp: string;
}

export const scaleService = {
  /**
   * Get all products marked for scale export
   */
  getExportableProducts: (params?: {
    branch_id?: UUID;
  }): Promise<ApiResponse<ScaleProduct[]>> => {
    return get<ScaleProduct[]>('/scales/products', params);
  },

  /**
   * Export price list for Kretz Aura scale
   * Returns file download
   * @param format - 'csv' or 'txt'
   * @param branchId - Optional branch filter
   */
  exportPriceList: async (
    format: 'csv' | 'txt' = 'csv',
    branchId?: UUID
  ): Promise<Blob> => {
    const params = new URLSearchParams();
    params.append('format', format);
    if (branchId) {
      params.append('branch_id', branchId);
    }

    const response = await fetch(
      `/api/v1/scales/export?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to export price list');
    }

    return response.blob();
  },

  /**
   * Download scale price list file
   * Triggers browser download
   */
  downloadPriceList: async (
    format: 'csv' | 'txt' = 'csv',
    branchId?: UUID
  ): Promise<void> => {
    try {
      const blob = await scaleService.exportPriceList(format, branchId);

      // Get filename from Content-Disposition header or generate one
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `kretz-aura-prices-${timestamp}.${format}`;

      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download price list:', error);
      throw error;
    }
  },

  /**
   * Parse scale-printed barcode
   * Used when scanning barcodes from products weighed on Kretz Aura scale
   */
  parseBarcode: (
    barcode: string
  ): Promise<ApiResponse<ScaleBarcodeParseResult>> => {
    return post<ScaleBarcodeParseResult>('/scales/barcode/parse', { barcode });
  },

  /**
   * Validate PLU code uniqueness
   * Checks if PLU code is already in use by another product
   */
  validatePLU: (
    plu: number,
    productId?: UUID
  ): Promise<ApiResponse<PLUValidationResult>> => {
    return post<PLUValidationResult>('/scales/validate-plu', {
      plu,
      product_id: productId,
    });
  },

  /**
   * Get scale export statistics
   * Returns counts and status information
   */
  getStatistics: (): Promise<ApiResponse<ScaleExportStatistics>> => {
    return get<ScaleExportStatistics>('/scales/statistics');
  },

  /**
   * Analyze barcode format (debugging)
   * Used to understand barcode structure
   */
  analyzeBarcode: (
    barcode: string
  ): Promise<ApiResponse<any>> => {
    return post<any>('/scales/barcode/analyze', { barcode });
  },

  /**
   * Get product by PLU code
   * Find product using its scale PLU code
   */
  getProductByPLU: (plu: number): Promise<ApiResponse<ScaleProduct>> => {
    return get<ScaleProduct>(`/scales/products/plu/${plu}`);
  },

  /**
   * Get scale configuration
   */
  getConfiguration: (branchId?: UUID): Promise<ApiResponse<ScaleConfiguration>> => {
    return get<ScaleConfiguration>('/scales/config', branchId ? { branch_id: branchId } : undefined);
  },

  /**
   * Update scale configuration
   */
  updateConfiguration: (config: Partial<ScaleConfiguration>, branchId?: UUID): Promise<ApiResponse<ScaleConfiguration>> => {
    return put<ScaleConfiguration>('/scales/config' + (branchId ? `?branch_id=${branchId}` : ''), config);
  },

  /**
   * Test connection to scale
   */
  testConnection: (branchId?: UUID): Promise<ApiResponse<ScaleConnectionTestResult>> => {
    return post<ScaleConnectionTestResult>('/scales/connection/test', branchId ? { branch_id: branchId } : {});
  },

  /**
   * Synchronize products with scale now
   */
  syncNow: (branchId?: UUID): Promise<ApiResponse<ScaleSyncResult>> => {
    return post<ScaleSyncResult>('/scales/sync', branchId ? { branch_id: branchId } : {});
  },
};

export default scaleService;
