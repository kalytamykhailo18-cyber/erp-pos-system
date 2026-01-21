import { get, post, put, del } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  UUID,
  Expense,
  ExpenseCategory,
  ExpenseFormData,
  ExpenseCategoryFormData,
  ExpenseStats,
  ExpenseStatus
} from '../../types';

export const expenseService = {
  // ==================== EXPENSES ====================

  /**
   * Get all expenses with optional filters and pagination
   */
  getAll: (filters?: {
    from_date?: string;
    to_date?: string;
    category_id?: UUID;
    branch_id?: UUID;
    status?: ExpenseStatus;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Expense>> => {
    return get<Expense[]>('/expenses', filters) as unknown as Promise<PaginatedResponse<Expense>>;
  },

  /**
   * Get expense by ID
   */
  getById: (id: UUID): Promise<ApiResponse<Expense>> => {
    return get<Expense>(`/expenses/${id}`);
  },

  /**
   * Create new expense
   */
  create: (data: ExpenseFormData): Promise<ApiResponse<Expense>> => {
    return post<Expense>('/expenses', data);
  },

  /**
   * Update expense
   */
  update: (id: UUID, data: Partial<ExpenseFormData>): Promise<ApiResponse<Expense>> => {
    return put<Expense>(`/expenses/${id}`, data);
  },

  /**
   * Delete expense (cancel)
   */
  delete: (id: UUID): Promise<ApiResponse<{ message: string }>> => {
    return del<{ message: string }>(`/expenses/${id}`);
  },

  /**
   * Approve expense
   */
  approve: (id: UUID): Promise<ApiResponse<Expense>> => {
    return put<Expense>(`/expenses/${id}/approve`, {});
  },

  /**
   * Reject expense
   */
  reject: (id: UUID, reason: string): Promise<ApiResponse<Expense>> => {
    return put<Expense>(`/expenses/${id}/reject`, { reason });
  },

  /**
   * Mark expense as paid
   */
  markAsPaid: (id: UUID, paid_date?: string): Promise<ApiResponse<Expense>> => {
    return put<Expense>(`/expenses/${id}/mark-paid`, { paid_date });
  },

  /**
   * Get expense statistics
   */
  getStats: (filters?: {
    from_date?: string;
    to_date?: string;
    branch_id?: UUID;
  }): Promise<ApiResponse<ExpenseStats>> => {
    return get<ExpenseStats>('/expenses/stats', filters);
  },

  /**
   * Get recurring expenses
   */
  getRecurring: (): Promise<ApiResponse<Expense[]>> => {
    return get<Expense[]>('/expenses/recurring');
  },

  /**
   * Create recurring instance
   */
  createRecurringInstance: (parent_id: UUID): Promise<ApiResponse<Expense>> => {
    return post<Expense>('/expenses/recurring-instance', { parent_id });
  },

  /**
   * Upload receipt
   */
  uploadReceipt: (id: UUID, receipt_url: string): Promise<ApiResponse<Expense>> => {
    return post<Expense>(`/expenses/${id}/receipt`, { receipt_url });
  },

  // ==================== EXPENSE CATEGORIES ====================

  /**
   * Get all expense categories
   */
  getAllCategories: (includeInactive?: boolean): Promise<ApiResponse<ExpenseCategory[]>> => {
    return get<ExpenseCategory[]>('/expenses/categories/all', { include_inactive: includeInactive });
  },

  /**
   * Get category by ID
   */
  getCategoryById: (id: UUID): Promise<ApiResponse<ExpenseCategory>> => {
    return get<ExpenseCategory>(`/expenses/categories/${id}`);
  },

  /**
   * Create expense category
   */
  createCategory: (data: ExpenseCategoryFormData): Promise<ApiResponse<ExpenseCategory>> => {
    return post<ExpenseCategory>('/expenses/categories', data);
  },

  /**
   * Update expense category
   */
  updateCategory: (id: UUID, data: Partial<ExpenseCategoryFormData>): Promise<ApiResponse<ExpenseCategory>> => {
    return put<ExpenseCategory>(`/expenses/categories/${id}`, data);
  },

  /**
   * Delete expense category
   */
  deleteCategory: (id: UUID): Promise<ApiResponse<{ message: string }>> => {
    return del<{ message: string }>(`/expenses/categories/${id}`);
  },
};

export default expenseService;
