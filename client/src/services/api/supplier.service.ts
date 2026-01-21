import { get, post, put, del } from './client';
import type { ApiResponse, PaginatedResponse, UUID } from '../../types';

// Types for Supplier management
export interface Supplier {
  id: UUID;
  code: string;
  name: string;
  legal_name?: string;
  cuit?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  payment_terms_days: number;
  credit_limit: number;
  price_list_format?: 'PDF' | 'EXCEL' | 'CSV';
  default_margin_percent: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: UUID;
  order_number: string;
  supplier_id: UUID;
  branch_id: UUID;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  expected_date?: string;
  notes?: string;
  created_by: UUID;
  approved_by?: UUID;
  received_by?: UUID;
  submitted_at?: string;
  approved_at?: string;
  received_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  branch?: {
    id: UUID;
    name: string;
    code: string;
  };
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: UUID;
  purchase_order_id: UUID;
  product_id: UUID;
  quantity_ordered: number;
  quantity_received: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  product?: {
    id: UUID;
    name: string;
    sku: string;
    cost_price: number;
  };
}

export interface CreateSupplierData {
  code: string;
  name: string;
  legal_name?: string;
  cuit?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  payment_terms_days?: number;
  credit_limit?: number;
  price_list_format?: 'PDF' | 'EXCEL' | 'CSV';
  default_margin_percent?: number;
  notes?: string;
}

export interface UpdateSupplierData extends Partial<CreateSupplierData> {
  is_active?: boolean;
}

export interface CreatePurchaseOrderData {
  supplier_id: UUID;
  branch_id: UUID;
  expected_date?: string;
  notes?: string;
  items: Array<{
    product_id: UUID;
    quantity: number;
    unit_price: number;
  }>;
}

export interface UpdatePurchaseOrderData {
  expected_date?: string;
  notes?: string;
  items?: Array<{
    product_id: UUID;
    quantity: number;
    unit_price: number;
  }>;
}

export interface ReceivePurchaseOrderData {
  items: Array<{
    id: UUID; // item id
    quantity_received: number;
  }>;
}

export const supplierService = {
  /**
   * Get all suppliers with pagination and filters
   */
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<Supplier>> => {
    return get<Supplier[]>('/suppliers', params) as Promise<PaginatedResponse<Supplier>>;
  },

  /**
   * Get supplier by ID
   */
  getById: (id: UUID): Promise<ApiResponse<Supplier>> => {
    return get<Supplier>(`/suppliers/${id}`);
  },

  /**
   * Create new supplier
   */
  create: (data: CreateSupplierData): Promise<ApiResponse<Supplier>> => {
    return post<Supplier>('/suppliers', data);
  },

  /**
   * Update supplier
   */
  update: (id: UUID, data: UpdateSupplierData): Promise<ApiResponse<Supplier>> => {
    return put<Supplier>(`/suppliers/${id}`, data);
  },

  /**
   * Deactivate supplier (soft delete)
   */
  deactivate: (id: UUID): Promise<ApiResponse<null>> => {
    return del<null>(`/suppliers/${id}`);
  },

  /**
   * Get products from supplier
   */
  getSupplierProducts: (id: UUID): Promise<ApiResponse<any[]>> => {
    return get<any[]>(`/suppliers/${id}/products`);
  },

  // ===== Purchase Order Methods =====

  /**
   * Get all purchase orders with filters
   */
  getPurchaseOrders: (params?: {
    page?: number;
    limit?: number;
    supplier_id?: UUID;
    branch_id?: UUID;
    status?: PurchaseOrder['status'];
  }): Promise<PaginatedResponse<PurchaseOrder>> => {
    return get<PurchaseOrder[]>('/suppliers/purchase-orders', params) as Promise<PaginatedResponse<PurchaseOrder>>;
  },

  /**
   * Get purchase order by ID
   */
  getPurchaseOrderById: (id: UUID): Promise<ApiResponse<PurchaseOrder>> => {
    return get<PurchaseOrder>(`/suppliers/purchase-orders/${id}`);
  },

  /**
   * Create new purchase order
   */
  createPurchaseOrder: (data: CreatePurchaseOrderData): Promise<ApiResponse<PurchaseOrder>> => {
    return post<PurchaseOrder>('/suppliers/purchase-orders', data);
  },

  /**
   * Update purchase order (draft only)
   */
  updatePurchaseOrder: (id: UUID, data: UpdatePurchaseOrderData): Promise<ApiResponse<PurchaseOrder>> => {
    return put<PurchaseOrder>(`/suppliers/purchase-orders/${id}`, data);
  },

  /**
   * Submit purchase order for approval
   */
  submitPurchaseOrder: (id: UUID): Promise<ApiResponse<PurchaseOrder>> => {
    return post<PurchaseOrder>(`/suppliers/purchase-orders/${id}/submit`, {});
  },

  /**
   * Approve purchase order
   */
  approvePurchaseOrder: (id: UUID): Promise<ApiResponse<PurchaseOrder>> => {
    return post<PurchaseOrder>(`/suppliers/purchase-orders/${id}/approve`, {});
  },

  /**
   * Receive purchase order items
   */
  receivePurchaseOrder: (id: UUID, data: ReceivePurchaseOrderData): Promise<ApiResponse<PurchaseOrder>> => {
    return post<PurchaseOrder>(`/suppliers/purchase-orders/${id}/receive`, data);
  },

  /**
   * Cancel purchase order
   */
  cancelPurchaseOrder: (id: UUID, reason?: string): Promise<ApiResponse<null>> => {
    return post<null>(`/suppliers/purchase-orders/${id}/cancel`, { reason });
  },
};

export default supplierService;
