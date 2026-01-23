import { get, post, put, del } from './client';
import type { ApiResponse, PaginatedResponse, Product, POSProduct, UUID, BranchStock } from '../../types';

export const productService = {
  /**
   * Get all products with pagination and filters
   */
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category_id?: UUID;
    is_active?: boolean;
    is_weighable?: boolean;
  }): Promise<PaginatedResponse<Product>> => {
    return get<Product[]>('/products', params) as Promise<PaginatedResponse<Product>>;
  },

  /**
   * Get products optimized for POS (with stock info)
   */
  getForPOS: (params: {
    branch_id: UUID;
    category_id?: UUID;
    search?: string;
  }): Promise<ApiResponse<POSProduct[]>> => {
    return get<POSProduct[]>('/products/pos', params);
  },

  /**
   * Get all units of measure
   */
  getUnits: (): Promise<ApiResponse<Array<{
    id: string;
    code: string;
    name: string;
    is_fractional: boolean;
  }>>> => {
    return get('/products/units');
  },

  /**
   * Get product by barcode
   */
  getByBarcode: (barcode: string): Promise<ApiResponse<Product>> => {
    return get<Product>(`/products/barcode/${barcode}`);
  },

  /**
   * Get product by ID
   */
  getById: (id: UUID): Promise<ApiResponse<Product>> => {
    return get<Product>(`/products/${id}`);
  },

  /**
   * Create new product
   */
  create: (data: Partial<Product>): Promise<ApiResponse<Product>> => {
    return post<Product>('/products', data);
  },

  /**
   * Update product
   */
  update: (id: UUID, data: Partial<Product>): Promise<ApiResponse<Product>> => {
    return put<Product>(`/products/${id}`, data);
  },

  /**
   * Deactivate product
   */
  deactivate: (id: UUID): Promise<ApiResponse<null>> => {
    return del<null>(`/products/${id}`);
  },

  /**
   * Get product stock across branches
   */
  getStock: (productId: UUID): Promise<ApiResponse<BranchStock[]>> => {
    return get<BranchStock[]>(`/products/${productId}/stock`);
  },

  /**
   * Get product price history
   */
  getPriceHistory: (productId: UUID, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<{
    id: string;
    cost_price: number;
    selling_price: number;
    margin_percent: number;
    changed_by: string;
    change_reason: string;
    created_at: string;
  }>> => {
    return get(`/products/${productId}/price-history`, params) as Promise<PaginatedResponse<{
      id: string;
      cost_price: number;
      selling_price: number;
      margin_percent: number;
      changed_by: string;
      change_reason: string;
      created_at: string;
    }>>;
  },

  /**
   * Update product prices (with history tracking)
   */
  updatePrices: (productId: UUID, data: {
    cost_price?: number;
    selling_price?: number;
    reason?: string;
  }): Promise<ApiResponse<Product>> => {
    return put<Product>(`/products/${productId}/prices`, data);
  },

  /**
   * Bulk update product prices by margin percentage
   */
  bulkUpdateByMargin: (data: {
    product_ids?: UUID[];
    category_id?: UUID;
    margin_percentage: number;
    rounding_rule?: 'NONE' | 'UP' | 'DOWN' | 'NEAREST';
    rounding_value?: number;
  }): Promise<ApiResponse<{
    updated_count: number;
    products: Array<{
      id: UUID;
      name: string;
      sku: string;
      old_price: number;
      new_price: number;
    }>;
  }>> => {
    return post('/products/bulk-update-margin', data);
  },

  /**
   * Bulk update prices for all products from a supplier
   */
  bulkUpdateBySupplier: (data: {
    supplier_id: UUID;
    margin_percentage: number;
    rounding_rule?: 'NONE' | 'UP' | 'DOWN' | 'NEAREST';
    rounding_value?: number;
    update_cost_prices: boolean;
  }): Promise<ApiResponse<{
    updated_count: number;
    products: Array<{
      id: UUID;
      name: string;
      sku: string;
      old_price: number;
      new_price: number;
    }>;
  }>> => {
    return post('/products/bulk-update-supplier', data);
  },

  /**
   * Advanced product search with taxonomy and protein filters (PART 14)
   */
  advancedSearch: (params: {
    species_id?: UUID;
    variety_id?: UUID;
    product_type_id?: UUID;
    protein_min?: number;
    protein_max?: number;
    is_factory_direct?: boolean;
    search?: string;
    branch_id?: UUID;
  }): Promise<ApiResponse<{
    all_products: Product[];
    factory_direct: Product[];
    premium: Product[];
    count: number;
  }>> => {
    return get('/products/search', params);
  },
};

export default productService;
