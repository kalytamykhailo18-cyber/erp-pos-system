import { get, post, put, del, patch } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  Species,
  Variety,
  ProductType,
  UUID
} from '../../types';

// ============================================
// SPECIES SERVICE
// ============================================

export const speciesService = {
  /**
   * Get all species with pagination and filters
   */
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<Species>> => {
    return get<Species[]>('/species', params) as Promise<PaginatedResponse<Species>>;
  },

  /**
   * Get species by ID
   */
  getById: (id: UUID): Promise<ApiResponse<Species>> => {
    return get<Species>(`/species/${id}`);
  },

  /**
   * Create new species
   */
  create: (data: {
    name: string;
    description?: string;
    sort_order?: number;
    is_active?: boolean;
  }): Promise<ApiResponse<Species>> => {
    return post<Species>('/species', data);
  },

  /**
   * Update species
   */
  update: (id: UUID, data: {
    name?: string;
    description?: string;
    sort_order?: number;
    is_active?: boolean;
  }): Promise<ApiResponse<Species>> => {
    return put<Species>(`/species/${id}`, data);
  },

  /**
   * Delete species
   */
  delete: (id: UUID): Promise<ApiResponse<null>> => {
    return del(`/species/${id}`);
  },

  /**
   * Activate species
   */
  activate: (id: UUID): Promise<ApiResponse<Species>> => {
    return patch<Species>(`/species/${id}/activate`);
  },

  /**
   * Deactivate species
   */
  deactivate: (id: UUID): Promise<ApiResponse<Species>> => {
    return patch<Species>(`/species/${id}/deactivate`);
  }
};

// ============================================
// VARIETY SERVICE
// ============================================

export const varietyService = {
  /**
   * Get all varieties with pagination and filters
   */
  getAll: (params?: {
    page?: number;
    limit?: number;
    species_id?: UUID;
    search?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<Variety>> => {
    return get<Variety[]>('/varieties', params) as Promise<PaginatedResponse<Variety>>;
  },

  /**
   * Get varieties for a specific species
   */
  getBySpecies: (speciesId: UUID, params?: {
    is_active?: boolean;
  }): Promise<ApiResponse<Variety[]>> => {
    return get<Variety[]>(`/varieties/by-species/${speciesId}`, params);
  },

  /**
   * Get variety by ID
   */
  getById: (id: UUID): Promise<ApiResponse<Variety>> => {
    return get<Variety>(`/varieties/${id}`);
  },

  /**
   * Create new variety
   */
  create: (data: {
    species_id: UUID;
    name: string;
    description?: string;
    sort_order?: number;
    is_active?: boolean;
  }): Promise<ApiResponse<Variety>> => {
    return post<Variety>('/varieties', data);
  },

  /**
   * Update variety
   */
  update: (id: UUID, data: {
    species_id?: UUID;
    name?: string;
    description?: string;
    sort_order?: number;
    is_active?: boolean;
  }): Promise<ApiResponse<Variety>> => {
    return put<Variety>(`/varieties/${id}`, data);
  },

  /**
   * Delete variety
   */
  delete: (id: UUID): Promise<ApiResponse<null>> => {
    return del(`/varieties/${id}`);
  },

  /**
   * Activate variety
   */
  activate: (id: UUID): Promise<ApiResponse<Variety>> => {
    return patch<Variety>(`/varieties/${id}/activate`);
  },

  /**
   * Deactivate variety
   */
  deactivate: (id: UUID): Promise<ApiResponse<Variety>> => {
    return patch<Variety>(`/varieties/${id}/deactivate`);
  }
};

// ============================================
// PRODUCT TYPE SERVICE
// ============================================

export const productTypeService = {
  /**
   * Get all product types with pagination and filters
   */
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<ProductType>> => {
    return get<ProductType[]>('/product-types', params) as Promise<PaginatedResponse<ProductType>>;
  },

  /**
   * Get product type by ID
   */
  getById: (id: UUID): Promise<ApiResponse<ProductType>> => {
    return get<ProductType>(`/product-types/${id}`);
  },

  /**
   * Create new product type
   */
  create: (data: {
    name: string;
    description?: string;
    sort_order?: number;
    is_active?: boolean;
  }): Promise<ApiResponse<ProductType>> => {
    return post<ProductType>('/product-types', data);
  },

  /**
   * Update product type
   */
  update: (id: UUID, data: {
    name?: string;
    description?: string;
    sort_order?: number;
    is_active?: boolean;
  }): Promise<ApiResponse<ProductType>> => {
    return put<ProductType>(`/product-types/${id}`, data);
  },

  /**
   * Delete product type
   */
  delete: (id: UUID): Promise<ApiResponse<null>> => {
    return del(`/product-types/${id}`);
  },

  /**
   * Activate product type
   */
  activate: (id: UUID): Promise<ApiResponse<ProductType>> => {
    return patch<ProductType>(`/product-types/${id}/activate`);
  },

  /**
   * Deactivate product type
   */
  deactivate: (id: UUID): Promise<ApiResponse<ProductType>> => {
    return patch<ProductType>(`/product-types/${id}/deactivate`);
  }
};
