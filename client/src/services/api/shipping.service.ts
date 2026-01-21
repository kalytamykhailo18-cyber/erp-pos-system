import { get, post, put, del } from './client';
import type {
  ApiResponse,
  UUID,
  ShippingZone,
  NeighborhoodMapping,
  SaleShipping,
  ShippingCalculation,
  ShippingZoneFormData,
  NeighborhoodMappingFormData,
  ShippingCalculationRequest,
  CreateSaleShippingRequest,
  DeliveryStatus
} from '../../types';

export const shippingService = {
  // ==================== SHIPPING ZONES ====================

  /**
   * Get all shipping zones with neighborhood mappings
   */
  getAllZones: (includeInactive?: boolean): Promise<ApiResponse<ShippingZone[]>> => {
    return get<ShippingZone[]>('/shipping/zones', { include_inactive: includeInactive });
  },

  /**
   * Get a single shipping zone by ID
   */
  getZoneById: (id: UUID): Promise<ApiResponse<ShippingZone>> => {
    return get<ShippingZone>(`/shipping/zones/${id}`);
  },

  /**
   * Create a new shipping zone
   */
  createZone: (data: ShippingZoneFormData): Promise<ApiResponse<ShippingZone>> => {
    return post<ShippingZone>('/shipping/zones', data);
  },

  /**
   * Update an existing shipping zone
   */
  updateZone: (id: UUID, data: Partial<ShippingZoneFormData>): Promise<ApiResponse<ShippingZone>> => {
    return put<ShippingZone>(`/shipping/zones/${id}`, data);
  },

  /**
   * Delete a shipping zone (soft delete)
   */
  deleteZone: (id: UUID): Promise<ApiResponse<{ message: string }>> => {
    return del<{ message: string }>(`/shipping/zones/${id}`);
  },

  // ==================== NEIGHBORHOOD MAPPINGS ====================

  /**
   * Get all neighborhood mappings
   */
  getAllNeighborhoods: (zoneId?: UUID): Promise<ApiResponse<NeighborhoodMapping[]>> => {
    return get<NeighborhoodMapping[]>('/shipping/neighborhoods', zoneId ? { zone_id: zoneId } : undefined);
  },

  /**
   * Create a new neighborhood mapping
   */
  createNeighborhood: (data: NeighborhoodMappingFormData): Promise<ApiResponse<NeighborhoodMapping>> => {
    return post<NeighborhoodMapping>('/shipping/neighborhoods', data);
  },

  /**
   * Update a neighborhood mapping
   */
  updateNeighborhood: (id: UUID, data: Partial<NeighborhoodMappingFormData>): Promise<ApiResponse<NeighborhoodMapping>> => {
    return put<NeighborhoodMapping>(`/shipping/neighborhoods/${id}`, data);
  },

  /**
   * Delete a neighborhood mapping
   */
  deleteNeighborhood: (id: UUID): Promise<ApiResponse<{ message: string }>> => {
    return del<{ message: string }>(`/shipping/neighborhoods/${id}`);
  },

  // ==================== ZONE LOOKUP & CALCULATION ====================

  /**
   * Find shipping zone for a location (neighborhood or postal code)
   */
  findZoneForLocation: (neighborhood: string, postalCode?: string): Promise<ApiResponse<ShippingZone>> => {
    return get<ShippingZone>('/shipping/find-zone', {
      neighborhood,
      postal_code: postalCode
    });
  },

  /**
   * Calculate shipping cost for an order
   */
  calculateShipping: (params: ShippingCalculationRequest): Promise<ApiResponse<ShippingCalculation>> => {
    return post<ShippingCalculation>('/shipping/calculate', params);
  },

  // ==================== SALE SHIPPING ====================

  /**
   * Create shipping record for a sale
   */
  createSaleShipping: (saleId: UUID, data: CreateSaleShippingRequest): Promise<ApiResponse<SaleShipping>> => {
    return post<SaleShipping>(`/shipping/sales/${saleId}`, data);
  },

  /**
   * Get shipping details for a sale
   */
  getShippingBySaleId: (saleId: UUID): Promise<ApiResponse<SaleShipping | null>> => {
    return get<SaleShipping | null>(`/shipping/sales/${saleId}`);
  },

  /**
   * Update delivery status for a shipment
   */
  updateDeliveryStatus: (
    id: UUID,
    status: DeliveryStatus,
    additionalData?: { signature?: string; photo?: string }
  ): Promise<ApiResponse<SaleShipping>> => {
    return put<SaleShipping>(`/shipping/${id}/status`, {
      status,
      ...additionalData
    });
  },

  // ==================== SHIPMENTS ====================

  /**
   * Get all shipments with optional filters
   */
  getAllShipments: (filters?: {
    status?: DeliveryStatus;
    zone_id?: UUID;
    customer_id?: UUID;
    from_date?: string;
    to_date?: string;
  }): Promise<ApiResponse<SaleShipping[]>> => {
    return get<SaleShipping[]>('/shipping', filters);
  },
};

export default shippingService;
