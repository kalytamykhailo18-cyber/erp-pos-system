import { get } from './client';
import type { ApiResponse, DailyReportData, LiveBranchShiftStatusData, OwnerDashboardData, ConsolidatedDailyReportData, UUID } from '../../types';

export const reportService = {
  /**
   * Get daily report for a branch
   */
  getDailyReport: (branchId: UUID, date?: string): Promise<ApiResponse<DailyReportData>> => {
    return get<DailyReportData>('/reports/daily-report', { branch_id: branchId, date });
  },

  /**
   * Get consolidated daily report across all branches for a specific date
   */
  getConsolidatedDailyReport: (date?: string): Promise<ApiResponse<ConsolidatedDailyReportData>> => {
    return get<ConsolidatedDailyReportData>('/reports/consolidated-daily', { date });
  },

  /**
   * Get owner dashboard (multi-branch overview)
   */
  getOwnerDashboard: (params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<OwnerDashboardData>> => {
    return get<OwnerDashboardData>('/reports/owner-dashboard', params);
  },

  /**
   * Get live branch shift status (today's shifts for all branches)
   */
  getLiveBranchShiftStatus: (): Promise<ApiResponse<LiveBranchShiftStatusData>> => {
    return get<LiveBranchShiftStatusData>('/reports/live-branch-status');
  },

  /**
   * Get sales report
   */
  getSalesReport: (params?: {
    branch_id?: UUID;
    start_date?: string;
    end_date?: string;
    group_by?: 'hour' | 'day' | 'week' | 'month';
  }): Promise<ApiResponse<{
    period: { start_date: string; end_date: string };
    group_by: string;
    data: Array<{
      period: string;
      sales_count: number;
      revenue: number;
      tax: number;
      discounts: number;
      avg_ticket: number;
    }>;
    totals: {
      total_sales: number;
      total_revenue: number;
      total_tax: number;
      total_discounts: number;
      average_ticket: number;
    };
  }>> => {
    // Backend expects from_date/to_date, filter empty strings
    const { start_date, end_date, ...rest } = params || {};
    const cleanParams = Object.fromEntries(
      Object.entries({ ...rest, from_date: start_date, to_date: end_date })
        .filter(([_, v]) => v !== '' && v !== undefined)
    );
    return get('/reports/sales', cleanParams);
  },

  /**
   * Get product performance report
   */
  getProductReport: (params?: {
    branch_id?: UUID;
    category_id?: UUID;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<ApiResponse<{
    period: { start_date: string; end_date: string };
    products: Array<{
      product_id: UUID;
      name: string;
      sku: string;
      category: string;
      total_quantity: number;
      total_revenue: number;
      transaction_count: number;
      avg_price: number;
      margin_percent: string;
    }>;
  }>> => {
    // Backend expects from_date/to_date, filter empty strings
    const { start_date, end_date, ...rest } = params || {};
    const cleanParams = Object.fromEntries(
      Object.entries({ ...rest, from_date: start_date, to_date: end_date })
        .filter(([_, v]) => v !== '' && v !== undefined)
    );
    return get('/reports/products', cleanParams);
  },

  /**
   * Get cashier performance report
   */
  getCashierReport: (params?: {
    branch_id?: UUID;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<{
    period: { start_date: string; end_date: string };
    cashiers: Array<{
      cashier_id: UUID;
      name: string;
      total_sales: number;
      total_revenue: number;
      average_ticket: number;
      total_sessions: number;
      total_discrepancy: number;
      avg_session_hours: number;
    }>;
  }>> => {
    // Backend expects from_date/to_date, filter empty strings
    const { start_date, end_date, ...rest } = params || {};
    const cleanParams = Object.fromEntries(
      Object.entries({ ...rest, from_date: start_date, to_date: end_date })
        .filter(([_, v]) => v !== '' && v !== undefined)
    );
    return get('/reports/cashiers', cleanParams);
  },

  /**
   * Get inventory report
   */
  getInventoryReport: (params?: {
    branch_id?: UUID;
    category_id?: UUID;
    low_stock_only?: boolean;
  }): Promise<ApiResponse<{
    inventory: Array<{
      branch: string;
      branch_code: string;
      product: string;
      sku: string;
      category: string;
      quantity: number;
      min_stock: number;
      max_stock: number;
      cost_value: number;
      retail_value: number;
      is_low: boolean;
    }>;
    summary: {
      total_items: number;
      total_cost_value: number;
      total_retail_value: number;
      low_stock_count: number;
    };
  }>> => {
    // Filter empty strings to avoid UUID validation errors
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, v]) => v !== '' && v !== undefined)
    );
    return get('/reports/inventory', cleanParams);
  },

  /**
   * Get sales by category report
   */
  getCategoryReport: (params?: {
    branch_id?: UUID;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<{
    period: { start_date: string; end_date: string };
    categories: Array<{
      category_id: UUID | null;
      category_name: string;
      category_description?: string;
      total_quantity: number;
      total_revenue: number;
      total_cost: number;
      transaction_count: number;
      avg_sale: number;
      margin_percent: string;
    }>;
    totals: {
      total_revenue: number;
      total_cost: number;
      total_quantity: number;
      overall_margin: string;
    };
  }>> => {
    const { start_date, end_date, ...rest } = params || {};
    const cleanParams = Object.fromEntries(
      Object.entries({ ...rest, from_date: start_date, to_date: end_date })
        .filter(([_, v]) => v !== '' && v !== undefined)
    );
    return get('/reports/categories', cleanParams);
  },

  /**
   * Get cash discrepancy report
   */
  getDiscrepancyReport: (params?: {
    branch_id?: UUID;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<{
    period: { start_date: string; end_date: string };
    discrepancies: Array<{
      session_id: UUID;
      branch: string;
      branch_code: string;
      business_date: string;
      shift_type: string;
      opened_by: string | null;
      closed_by: string | null;
      opened_at: string;
      closed_at: string;
      expected_cash: number;
      declared_cash: number;
      discrepancy_cash: number;
      expected_card: number;
      declared_card: number;
      discrepancy_card: number;
      expected_qr: number;
      declared_qr: number;
      discrepancy_qr: number;
      expected_transfer: number;
      declared_transfer: number;
      discrepancy_transfer: number;
      total_discrepancy: number;
    }>;
    summary: {
      total_sessions_with_discrepancy: number;
      total_discrepancy_cash: number;
      total_discrepancy_card: number;
      total_discrepancy_qr: number;
      total_discrepancy_transfer: number;
      total_discrepancy_overall: number;
      avg_discrepancy: number;
    };
    by_branch: Array<{
      branch: string;
      count: number;
      total_discrepancy: number;
    }>;
  }>> => {
    const { start_date, end_date, ...rest } = params || {};
    const cleanParams = Object.fromEntries(
      Object.entries({ ...rest, from_date: start_date, to_date: end_date })
        .filter(([_, v]) => v !== '' && v !== undefined)
    );
    return get('/reports/discrepancies', cleanParams);
  },

  /**
   * Get payment method breakdown report
   */
  getPaymentMethodReport: (params?: {
    branch_id?: UUID;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<{
    period: { start_date: string; end_date: string };
    payments: Array<{
      payment_method_id: UUID;
      payment_method: string;
      code: string;
      type: string;
      transaction_count: number;
      total_amount: number;
      avg_amount: number;
      min_amount: number;
      max_amount: number;
      percentage: string;
    }>;
    summary: {
      total_amount: number;
      total_transactions: number;
      avg_transaction: number;
    };
    daily_breakdown: Array<{
      date: string;
      payment_method: string;
      code: string;
      transaction_count: number;
      total_amount: number;
    }>;
  }>> => {
    const { start_date, end_date, ...rest } = params || {};
    const cleanParams = Object.fromEntries(
      Object.entries({ ...rest, from_date: start_date, to_date: end_date })
        .filter(([_, v]) => v !== '' && v !== undefined)
    );
    return get('/reports/payments', cleanParams);
  },

  /**
   * Get shrinkage report
   */
  getShrinkageReport: (params?: {
    branch_id?: UUID;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<{
    period: { start_date: string; end_date: string };
    shrinkage_records: Array<{
      movement_id: UUID;
      created_at: string;
      quantity: number;
      reason: string;
      notes: string;
      branch_name: string;
      branch_code: string;
      product_name: string;
      sku: string;
      cost_price: number;
      selling_price: number;
      category_name: string;
      created_by_name: string;
      cost_loss: number;
      retail_loss: number;
    }>;
    summary: {
      total_records: number;
      total_quantity: number;
      total_cost_loss: number;
      total_retail_loss: number;
      potential_profit_loss: number;
    };
    by_category: Array<{
      category: string;
      count: number;
      total_quantity: number;
      cost_loss: number;
      retail_loss: number;
    }>;
    by_branch: Array<{
      branch: string;
      branch_code: string;
      count: number;
      cost_loss: number;
      retail_loss: number;
    }>;
    top_products: Array<{
      product_id: UUID;
      product_name: string;
      sku: string;
      category: string;
      total_quantity: number;
      cost_loss: number;
      retail_loss: number;
      occurrences: number;
    }>;
  }>> => {
    const { start_date, end_date, ...rest } = params || {};
    const cleanParams = Object.fromEntries(
      Object.entries({ ...rest, from_date: start_date, to_date: end_date })
        .filter(([_, v]) => v !== '' && v !== undefined)
    );
    return get('/reports/shrinkage', cleanParams);
  },

  /**
   * Get hourly sales pattern report
   */
  getHourlyReport: (params?: {
    branch_id?: UUID;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<{
    period: { start_date: string; end_date: string };
    hourly_data: Array<{
      hour: number;
      hour_label: string;
      sales_count: number;
      revenue: number;
      avg_ticket: number;
      min_ticket: number;
      max_ticket: number;
      sales_percentage: string;
      revenue_percentage: string;
    }>;
    day_of_week_data: Array<{
      day_of_week: number;
      day_name: string;
      sales_count: number;
      revenue: number;
      avg_ticket: number;
    }>;
    peak_hours: Array<{
      hour: number;
      hour_label: string;
      sales_count: number;
      revenue: number;
    }>;
    slow_hours: Array<{
      hour: number;
      hour_label: string;
      sales_count: number;
      revenue: number;
    }>;
    summary: {
      total_sales: number;
      total_revenue: number;
      avg_hourly_sales: number;
      avg_hourly_revenue: number;
    };
  }>> => {
    const { start_date, end_date, ...rest } = params || {};
    const cleanParams = Object.fromEntries(
      Object.entries({ ...rest, from_date: start_date, to_date: end_date })
        .filter(([_, v]) => v !== '' && v !== undefined)
    );
    return get('/reports/hourly', cleanParams);
  },

  /**
   * Get branch comparison report
   */
  getBranchComparisonReport: (params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<{
    period: { start_date: string; end_date: string };
    branches: Array<{
      branch_id: UUID;
      branch_name: string;
      branch_code: string;
      sales: {
        total_sales: number;
        total_revenue: number;
        avg_ticket: number;
        total_discounts: number;
      };
      payments: Array<{
        method: string;
        name: string;
        total: number;
      }>;
      inventory: {
        unique_products: number;
        cost_value: number;
        retail_value: number;
      };
      discrepancies: {
        session_count: number;
        total_discrepancy: number;
      };
      top_product: {
        name: string;
        sku: string;
        revenue: number;
      } | null;
      revenue_percentage: string;
      sales_percentage: string;
    }>;
    rankings: {
      by_revenue: Array<any>;
      by_sales_count: Array<any>;
      by_avg_ticket: Array<any>;
      by_inventory_value: Array<any>;
    };
    consolidated: {
      total_revenue: number;
      total_sales: number;
      total_inventory_value: number;
      total_discrepancy: number;
      branch_count: number;
    };
  }>> => {
    const { start_date, end_date } = params || {};
    const cleanParams = Object.fromEntries(
      Object.entries({ from_date: start_date, to_date: end_date })
        .filter(([_, v]) => v !== '' && v !== undefined)
    );
    return get('/reports/comparison', cleanParams);
  },
};

export default reportService;
