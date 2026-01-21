import { get, post, put, del } from './client';
import type { ApiResponse, User, Branch, UUID } from '../../types';

export interface UserListParams {
  page?: number;
  limit?: number;
  role_id?: UUID;
  branch_id?: UUID;
  is_active?: boolean;
  search?: string;
}

export interface UserListResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateUserData {
  employee_code?: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role_id: UUID;
  primary_branch_id?: UUID;
  pin_code?: string;
  language?: string;
  branch_ids?: UUID[];
}

export interface UpdateUserData {
  employee_code?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role_id?: UUID;
  primary_branch_id?: UUID;
  is_active?: boolean;
  language?: string;
  branch_ids?: UUID[];
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  email?: string;
}

export const userService = {
  /**
   * Get all users with filters and pagination
   */
  getAll: (params?: UserListParams): Promise<ApiResponse<UserListResponse>> => {
    return get<UserListResponse>('/users', params as Record<string, any>);
  },

  /**
   * Get user by ID
   */
  getById: (id: UUID): Promise<ApiResponse<User>> => {
    return get<User>(`/users/${id}`);
  },

  /**
   * Create new user
   */
  create: (data: CreateUserData): Promise<ApiResponse<User>> => {
    return post<User>('/users', data);
  },

  /**
   * Update user (works for own profile or admin updating others)
   */
  update: (id: UUID, data: UpdateUserData): Promise<ApiResponse<User>> => {
    return put<User>(`/users/${id}`, data);
  },

  /**
   * Deactivate user (soft delete)
   */
  deactivate: (id: UUID): Promise<ApiResponse<null>> => {
    return del<null>(`/users/${id}`);
  },

  /**
   * Reset user password (admin action)
   */
  resetPassword: (id: UUID, newPassword: string): Promise<ApiResponse<null>> => {
    return post<null>(`/users/${id}/reset-password`, { new_password: newPassword });
  },

  /**
   * Unlock locked user account
   */
  unlock: (id: UUID): Promise<ApiResponse<null>> => {
    return post<null>(`/users/${id}/unlock`);
  },

  /**
   * Get branches assigned to user
   */
  getBranches: (id: UUID): Promise<ApiResponse<Branch[]>> => {
    return get<Branch[]>(`/users/${id}/branches`);
  },

  /**
   * Update user's branch assignments
   */
  updateBranches: (id: UUID, branchIds: UUID[]): Promise<ApiResponse<null>> => {
    return put<null>(`/users/${id}/branches`, { branch_ids: branchIds });
  },

  /**
   * Get users with PIN codes (for PIN login)
   */
  getUsersWithPIN: (): Promise<ApiResponse<User[]>> => {
    return get<User[]>('/users?is_active=true&has_pin=true');
  },

  /**
   * Update current user's profile (convenience method)
   * Backend uses /users/profile endpoint for updating own profile
   */
  updateProfile: (data: UpdateProfileData): Promise<ApiResponse<User>> => {
    return put<User>('/users/profile', data);
  },
};

export default userService;
