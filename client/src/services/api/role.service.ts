import { get, post, put, del } from './client';
import type { ApiResponse, Role, UUID } from '../../types';

export interface CreateRoleData {
  name: string;
  description?: string;
  can_void_sale: boolean;
  can_give_discount: boolean;
  can_view_all_branches: boolean;
  can_close_register: boolean;
  can_reopen_closing: boolean;
  can_adjust_stock: boolean;
  can_view_reports: boolean;
  can_manage_users: boolean;
  can_manage_products: boolean;
  can_manage_categories: boolean;
  can_withdraw_cash: boolean;
  max_discount_percent?: number;
}

export interface UpdateRoleData extends Partial<CreateRoleData> {}

export const roleService = {
  /**
   * Get all roles
   */
  getAll: (): Promise<ApiResponse<Role[]>> => {
    return get<Role[]>('/roles');
  },

  /**
   * Get role by ID
   */
  getById: (id: UUID): Promise<ApiResponse<Role>> => {
    return get<Role>(`/roles/${id}`);
  },

  /**
   * Create new role
   */
  create: (data: CreateRoleData): Promise<ApiResponse<Role>> => {
    return post<Role>('/roles', data);
  },

  /**
   * Update role
   */
  update: (id: UUID, data: UpdateRoleData): Promise<ApiResponse<Role>> => {
    return put<Role>(`/roles/${id}`, data);
  },

  /**
   * Delete role
   */
  delete: (id: UUID): Promise<ApiResponse<null>> => {
    return del<null>(`/roles/${id}`);
  },
};

export default roleService;
