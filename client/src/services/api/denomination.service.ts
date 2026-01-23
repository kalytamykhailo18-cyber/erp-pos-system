import { get, post, put, del } from './client';
import type {
  ApiResponse,
  UUID,
  DenominationConfig,
  DenominationConfigFormData
} from '../../types';

export const denominationService = {
  /**
   * PART 16: Get all bill denominations
   */
  getAllDenominations: (includeInactive?: boolean): Promise<ApiResponse<DenominationConfig[]>> => {
    return get<DenominationConfig[]>('/denominations', { include_inactive: includeInactive });
  },

  /**
   * PART 16: Get a single denomination by ID
   */
  getDenominationById: (id: UUID): Promise<ApiResponse<DenominationConfig>> => {
    return get<DenominationConfig>(`/denominations/${id}`);
  },

  /**
   * PART 16: Create a new denomination
   */
  createDenomination: (data: DenominationConfigFormData): Promise<ApiResponse<DenominationConfig>> => {
    return post<DenominationConfig>('/denominations', data);
  },

  /**
   * PART 16: Update an existing denomination
   */
  updateDenomination: (id: UUID, data: Partial<DenominationConfigFormData>): Promise<ApiResponse<DenominationConfig>> => {
    return put<DenominationConfig>(`/denominations/${id}`, data);
  },

  /**
   * PART 16: Delete (deactivate) a denomination
   */
  deleteDenomination: (id: UUID): Promise<ApiResponse<{ id: UUID; is_active: boolean }>> => {
    return del<{ id: UUID; is_active: boolean }>(`/denominations/${id}`);
  },

  /**
   * PART 16: Reorder denominations (bulk update display_order)
   */
  reorderDenominations: (denominations: Array<{ id: UUID; display_order: number }>): Promise<ApiResponse<DenominationConfig[]>> => {
    return post<DenominationConfig[]>('/denominations/reorder', { denominations });
  }
};

export default denominationService;
