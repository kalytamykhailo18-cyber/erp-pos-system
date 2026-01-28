// Common Types
export type UUID = string;
export type ISODateString = string;
// CRITICAL FIX #4: Use string-only for Decimal to prevent precision loss
// Backend stores as DECIMAL(12,2) - must maintain 2 decimal places
export type Decimal = string;

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  code?: string;
  errors?: ValidationError[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  };
  message?: string;
  error?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

// User permissions (merged from user overrides + role defaults)
export interface UserPermissions {
  canVoidSale: boolean;
  canGiveDiscount: boolean;
  canViewAllBranches: boolean;
  canCloseRegister: boolean;
  canReopenClosing: boolean;
  canAdjustStock: boolean;
  canImportPrices: boolean;
  canManageUsers: boolean;
  canViewReports: boolean;
  canViewFinancials: boolean;
  canManageSuppliers: boolean;
  canManageProducts: boolean;
  canIssueInvoiceA: boolean;
  canManageExpenses?: boolean;
  canApproveExpenses?: boolean;
  maxDiscountPercent: number;
}

// Auth Types
export interface User {
  id: UUID;
  employee_code?: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role_id: UUID;
  role?: Role;
  primary_branch_id?: UUID;
  primary_branch?: Branch;
  branches?: Branch[];
  is_active: boolean;
  pin_code?: string;
  last_login_at?: ISODateString;
  failed_login_attempts?: number;
  locked_until?: ISODateString | null;
  language?: string;
  avatar_url?: string;
  // Per-user permission overrides (null/undefined = use role default)
  can_void_sale?: boolean | null;
  can_give_discount?: boolean | null;
  can_view_all_branches?: boolean | null;
  can_close_register?: boolean | null;
  can_reopen_closing?: boolean | null;
  can_adjust_stock?: boolean | null;
  can_import_prices?: boolean | null;
  can_manage_users?: boolean | null;
  can_view_reports?: boolean | null;
  can_view_financials?: boolean | null;
  can_manage_suppliers?: boolean | null;
  can_manage_products?: boolean | null;
  can_issue_invoice_a?: boolean | null;
  can_manage_expenses?: boolean | null;
  can_approve_expenses?: boolean | null;
  max_discount_percent?: Decimal | null;
  // Merged permissions (from login response)
  permissions?: UserPermissions;
  created_at: ISODateString;
  updated_at?: ISODateString;
}

export interface Role {
  id: UUID;
  name: string;
  description?: string;
  // Permissions
  can_void_sale: boolean;
  can_give_discount: boolean;
  can_view_all_branches: boolean;
  can_close_register: boolean;
  can_reopen_closing: boolean;
  can_adjust_stock: boolean;
  can_import_prices: boolean;
  can_manage_users: boolean;
  can_view_reports: boolean;
  can_view_financials: boolean;
  can_manage_suppliers: boolean;
  can_manage_products: boolean;
  can_issue_invoice_a: boolean;
  max_discount_percent?: Decimal;
  created_at?: ISODateString;
  updated_at?: ISODateString;
}

// Legacy permissions interface for backwards compatibility
export interface RolePermissions {
  canManageUsers?: boolean;
  canManageProducts?: boolean;
  canManageInventory?: boolean;
  canViewReports?: boolean;
  canManageSettings?: boolean;
  canVoidSale?: boolean;
  canGiveDiscount?: boolean;
  maxDiscountPercent?: number;
  canOpenRegister?: boolean;
  canCloseRegister?: boolean;
  canAccessAllBranches?: boolean;
  canViewAllBranches?: boolean;
  [key: string]: boolean | number | undefined;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  currentBranch: Branch | null;
  currentSession: RegisterSession | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface PINLoginCredentials {
  user_id: UUID;
  pin_code: string;
  branch_id: UUID;
}

// Branch Types
export interface Branch {
  id: UUID;
  name: string;
  code: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;

  // Operating hours
  weekday_opening_time?: string;
  weekday_closing_time?: string;
  midday_closing_time?: string;
  afternoon_opening_time?: string;
  evening_closing_time?: string;
  sunday_opening_time?: string;
  sunday_closing_time?: string;
  has_shift_change?: boolean;

  // Petty cash fund
  petty_cash_amount?: Decimal;

  // FactuHoy/AFIP
  factuhoy_point_of_sale?: number;
  default_invoice_type?: string;

  // POS Configuration
  receipt_footer?: string;
  auto_print_receipt?: boolean;
  require_customer?: boolean;
  enable_discounts?: boolean;
  max_discount_percent?: number;
  tax_id?: string;
  tax_condition?: string;

  // Hardware
  device_type?: string;
  printer_model?: string;
  printer_type?: string;

  // Status
  is_active: boolean;
  timezone?: string;
  created_at?: ISODateString;
  updated_at?: ISODateString;

  // Junction table data (from UserBranch through table - Sequelize returns PascalCase)
  UserBranch?: {
    is_primary: boolean;
  };
}

// Category Types
export interface Category {
  id: UUID;
  name: string;
  description?: string;
  parent_id?: UUID;
  parent?: Category;
  subcategories?: Category[];
  icon?: string;
  color?: string;
  sort_order: number;
  is_active: boolean;
}

// Product Types
export interface Product {
  id: UUID;
  sku: string;
  barcode?: string;
  name: string;
  short_name?: string;
  description?: string;
  category_id?: UUID;
  category?: Category;
  unit_id?: UUID;
  unit?: UnitOfMeasure;

  // Pricing
  cost_price: Decimal;
  selling_price: Decimal;
  wholesale_price?: Decimal;
  margin_percent?: Decimal;
  tax_rate: Decimal;
  is_tax_included: boolean;

  // Stock settings
  track_stock: boolean;
  minimum_stock: Decimal;
  is_weighable: boolean;
  shrinkage_percent: Decimal;

  // Nutritional information (CRITICAL for pet food business)
  protein_percent?: Decimal;

  // Three-level taxonomy (PART 6)
  species_id?: UUID;
  species?: Species;
  variety_id?: UUID;
  variety?: Variety;
  product_type_id?: UUID;
  product_type?: ProductType;
  weight_size?: string;
  is_factory_direct: boolean;

  // Scale integration (PART 13: KRETZ SCALE)
  scale_plu?: number;
  export_to_scale: boolean;
  tare_weight?: Decimal; // Tare weight in kg (bag/packaging weight to deduct)

  // Status
  is_active: boolean;
  is_featured: boolean;

  // Images
  thumbnail_url?: string;
  image_url?: string;

  // Temporary/calculated fields
  stock_quantity?: number;
}

// Three-Level Taxonomy Types (PART 6)
export interface Species {
  id: UUID;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
  varieties?: Variety[];
}

export interface Variety {
  id: UUID;
  species_id: UUID;
  species?: Species;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface ProductType {
  id: UUID;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
}

// Open Bag Types (PART 6)
export interface OpenBag {
  id: UUID;
  branch_id: UUID;
  branch?: Branch;
  product_id: UUID;
  product?: Product;
  original_weight: Decimal;
  remaining_weight: Decimal;
  low_stock_threshold?: Decimal;
  status: 'OPEN' | 'EMPTY';
  opened_at: ISODateString;
  opened_by?: UUID;
  opener?: User;
  closed_at?: ISODateString;
  closed_by?: UUID;
  closer?: User;
  notes?: string;
  created_at: ISODateString;
  updated_at: ISODateString;
}

// Non-Sales Deduction Types (PART 6)
export type DeductionType = 'FREE_SAMPLE' | 'DONATION';
export type DeductionApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface NonSalesDeduction {
  id: UUID;
  branch_id: UUID;
  branch?: Branch;
  product_id: UUID;
  product?: Product;
  quantity: Decimal;
  deduction_type: DeductionType;
  reason?: string;
  recipient?: string;
  requested_by: UUID;
  requester?: User;
  approved_by?: UUID;
  approver?: User;
  approval_status: DeductionApprovalStatus;
  approved_at?: ISODateString;
  rejection_reason?: string;
  stock_movement_id?: UUID;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface UnitOfMeasure {
  id: UUID;
  code: string;
  name: string;
  allow_decimals: boolean;
}

export interface BranchStock {
  id: UUID;
  branch_id: UUID;
  product_id: UUID;
  quantity: Decimal;
  reserved_quantity: Decimal;

  // Shrinkage tracking
  expected_shrinkage: Decimal;
  actual_shrinkage: Decimal;
  last_counted_at?: ISODateString;
  last_counted_quantity?: Decimal;

  // Min/max levels (these are now deprecated - use Product.minimum_stock instead)
  min_stock?: Decimal;
  max_stock?: Decimal;

  // Relations
  product?: Product;
  branch?: Branch;
}

// POS Product (simplified for POS screen)
export interface POSProduct {
  id: UUID;
  sku: string;
  barcode?: string;
  name: string;
  short_name?: string;
  selling_price: Decimal;
  tax_rate: Decimal;
  is_tax_included: boolean;
  is_weighable: boolean;
  is_featured?: boolean;
  unit_code?: string;
  category_name?: string;
  thumbnail_url?: string;
  image_url?: string;
  stock_quantity: number;
}

// Customer Types
export interface Customer {
  id: UUID;
  customer_code: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  document_type?: string;
  document_number?: string;
  tax_condition?: string;
  phone?: string;
  email?: string;
  address?: string;
  doorbell_apt?: string;
  neighborhood?: string;
  city?: string;
  postal_code?: string;
  qr_code: string;
  loyalty_points: number;
  loyalty_tier?: string;
  credit_balance: Decimal;
  assigned_vendor_id?: UUID;
  is_wholesale: boolean;
  wholesale_discount_percent: Decimal;
  is_active: boolean;
  notes?: string;
}

export interface QuickSearchCustomer {
  id: UUID;
  customer_code: string;
  first_name?: string;
  last_name?: string;
  display_name: string;
  email?: string;
  phone?: string;
  loyalty_points: number;
  credit_balance: Decimal;
  is_wholesale: boolean;
  wholesale_discount_percent: Decimal;
  qr_code: string;
}

// Cart Types
export interface CartItem {
  id: string; // Unique cart item ID
  product_id: UUID;
  product: POSProduct;
  quantity: number;
  unit_price: Decimal;
  discount_percent: number;
  discount_amount: Decimal;
  tax_rate: Decimal;
  tax_amount: Decimal;
  subtotal: Decimal;
  total: Decimal;
}

export interface Cart {
  items: CartItem[];
  customer?: Customer;
  subtotal: Decimal;
  discount_type?: 'PERCENT' | 'FIXED';
  discount_value: number;
  discount_amount: Decimal;
  discount_reason?: string;
  discount_approved_by_pin?: string;
  tax_amount: Decimal;
  total: Decimal;
}

// Payment Types
export interface PaymentMethod {
  id: UUID;
  name: string;
  code: string;
  type: 'CASH' | 'CARD' | 'QR' | 'TRANSFER' | 'CREDIT' | 'OTHER';
  icon?: string;
  is_active: boolean;
  requires_reference: boolean;
  sort_order: number;
}

export interface SalePayment {
  id?: UUID;
  payment_method_id: UUID;
  payment_method?: PaymentMethod;
  amount: Decimal;
  // For transfers (receipt number required)
  reference_number?: string;
  // For cards
  card_last_four?: string;
  card_brand?: string;
  authorization_code?: string;
  // For QR payments
  qr_provider?: string;
  qr_transaction_id?: string;
}

// Sale Types
export type SaleStatus = 'PENDING' | 'COMPLETED' | 'VOIDED' | 'RETURNED';

export interface Sale {
  id: UUID;
  sale_number: string;
  branch_id: UUID;
  branch?: Branch;
  register_id: UUID;
  session_id: UUID;
  customer_id?: UUID;
  customer?: Customer;
  created_by: UUID;
  creator?: User;
  cashier?: User; // Alias for creator - same user
  subtotal: Decimal;
  discount_type?: 'PERCENT' | 'FIXED' | 'WHOLESALE' | null;
  discount_value?: Decimal;
  discount_amount: Decimal;
  discount_percent?: Decimal;
  discount_reason?: string;
  discount_applied_by?: UUID;
  discount_approved_by?: UUID;
  tax_amount: Decimal;
  total_amount: Decimal;
  paid_amount: Decimal;
  change_amount: Decimal;
  status: SaleStatus;
  void_reason?: string;
  voided_by?: UUID;
  voided_at?: ISODateString;
  void_approved_by?: UUID;
  notes?: string;
  created_at: ISODateString;
  items?: SaleItem[];
  payments?: SalePayment[];
}

export interface SaleItem {
  id: UUID;
  sale_id: UUID;
  product_id: UUID;
  product?: Product; // Related product (for name, sku, etc.)
  quantity: Decimal;
  unit_price: Decimal;
  cost_price?: Decimal;
  discount_percent: Decimal;
  discount_amount: Decimal;
  tax_rate: Decimal;
  tax_amount: Decimal;
  line_total: Decimal; // This is the actual DB field name
  notes?: string;
  created_at?: ISODateString;
}

// Register & Session Types
export type SessionStatus = 'OPEN' | 'CLOSED' | 'REOPENED';
export type ShiftType = 'MORNING' | 'AFTERNOON' | 'FULL_DAY';

export interface Register {
  id: UUID;
  branch_id: UUID;
  branch?: Branch;
  register_number: number;
  name: string;
  is_active: boolean;
  current_session_id?: UUID;
  current_session?: RegisterSession;
}

export interface RegisterSession {
  id: UUID;
  register_id: UUID;
  register?: Register;
  branch_id: UUID;
  branch?: Branch;
  session_number: string;
  shift_type: ShiftType;
  business_date: string; // DATEONLY format YYYY-MM-DD

  // Opening
  opened_by: UUID;
  opened_at: ISODateString;
  opening_cash: Decimal;
  opening_notes?: string;

  // Opening denomination breakdown (Argentina 2024 bills)
  opening_bills_20000?: number;
  opening_bills_10000?: number;
  opening_bills_2000?: number;
  opening_bills_1000?: number;
  opening_bills_500?: number;
  opening_bills_200?: number;
  opening_bills_100?: number;
  opening_bills_50?: number;
  opening_coins?: Decimal;

  // Closing
  closed_by?: UUID;
  closed_at?: ISODateString;

  // Cashier's declared amounts (blind closing)
  declared_cash?: Decimal;
  declared_card?: Decimal;
  declared_qr?: Decimal;
  declared_transfer?: Decimal;

  // Closing denomination breakdown (Argentina 2024 bills)
  closing_bills_20000?: number;
  closing_bills_10000?: number;
  closing_bills_2000?: number;
  closing_bills_1000?: number;
  closing_bills_500?: number;
  closing_bills_200?: number;
  closing_bills_100?: number;
  closing_bills_50?: number;
  closing_coins?: Decimal;

  // System calculated amounts
  expected_cash?: Decimal;
  expected_card?: Decimal;
  expected_qr?: Decimal;
  expected_transfer?: Decimal;

  // Discrepancies
  discrepancy_cash?: Decimal;
  discrepancy_card?: Decimal;
  discrepancy_qr?: Decimal;
  discrepancy_transfer?: Decimal;
  total_discrepancy?: Decimal;

  // Status
  status: SessionStatus;
  closing_notes?: string;

  // Reopen tracking
  reopened_by?: UUID;
  reopened_at?: ISODateString;
  reopen_reason?: string;

  // Sync tracking
  local_id?: string;
  synced_at?: ISODateString;

  // Relations
  opener?: User;
  closer?: User;
  reopener?: User;
}

// Denomination breakdown for cash counting (Argentina 2024 bills)
export interface DenominationBreakdown {
  bills_20000: number;
  bills_10000: number;
  bills_2000: number;
  bills_1000: number;
  bills_500: number;
  bills_200: number;
  bills_100: number;
  bills_50: number;
  coins: number;
}

// PART 16: Denomination configuration (manages which bills are active/inactive)
export interface DenominationConfig {
  id: UUID;
  value: Decimal;
  label: string;
  is_active: boolean;
  display_order: number;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface DenominationConfigFormData {
  value: number;
  label: string;
  is_active: boolean;
  display_order: number;
}

export interface PettyCashWarning {
  type: 'PETTY_CASH_LOW';
  message: string;
  severity: 'warning' | 'error';
  opening_cash?: number;
  declared_cash?: number;
  petty_cash_required: number;
  deficit: number;
}

export interface AfterHoursWarning {
  type: 'AFTER_HOURS_CLOSING';
  message: string;
  severity: 'warning';
  closing_time: string;
  expected_closing_time: string;
  minutes_late: number;
  shift_type: ShiftType;
}

export interface OpenSessionData {
  register_id: UUID;
  opening_cash: number;
  shift_type: ShiftType;
  opening_notes?: string;
  opening_denominations?: DenominationBreakdown;
  local_id?: string; // For offline sync tracking
}

export interface OpenSessionResponse extends RegisterSession {
  petty_cash_warning?: PettyCashWarning;
}

export interface CloseSessionData {
  declared_cash: number;
  declared_card: number;
  declared_qr: number;
  declared_transfer: number;
  closing_notes?: string;
  closing_denominations?: DenominationBreakdown;
}

export interface CloseSessionResponse extends RegisterSession {
  sales_count: number;
  sales_total: number;
  petty_cash_warning?: PettyCashWarning;
  after_hours_warning?: AfterHoursWarning;
}

// Withdrawal types
export type WithdrawalType = 'SUPPLIER_PAYMENT' | 'EMPLOYEE_ADVANCE' | 'OPERATIONAL_EXPENSE' | 'OTHER';

export interface CashWithdrawal {
  id: UUID;
  session_id: UUID;
  branch_id: UUID;
  amount: number;
  withdrawal_type: WithdrawalType;
  recipient_name: string;
  reason: string;
  receipt_number?: string;
  created_by: UUID;
  creator?: {
    id: UUID;
    first_name: string;
    last_name: string;
  };
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface CreateWithdrawalData {
  amount: number;
  withdrawal_type: WithdrawalType;
  recipient_name: string;
  reason: string;
  receipt_number?: string;
}

export interface SessionWithdrawalsResponse {
  withdrawals: CashWithdrawal[];
  total: number;
  count: number;
}

// Alert Types - Must match backend ENUM definition exactly
export type AlertType =
  | 'VOIDED_SALE'
  | 'CASH_DISCREPANCY'
  | 'LOW_PETTY_CASH'
  | 'LOW_STOCK'
  | 'LATE_CLOSING'
  | 'AFTER_HOURS_CLOSING'
  | 'REOPEN_REGISTER'
  | 'FAILED_INVOICE'
  | 'LARGE_DISCOUNT'
  | 'HIGH_VALUE_SALE'
  | 'SYNC_ERROR'
  | 'LOGIN_FAILED'
  | 'PRICE_CHANGE'
  | 'BANK_TRANSFER';

// Severity levels - Must match backend validation
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Alert {
  id: UUID;
  branch_id?: UUID;
  branch?: Branch;
  user_id?: UUID;
  triggered_by?: User;
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  reference_type?: string;
  reference_id?: UUID;
  is_read: boolean;
  read_by?: UUID;
  reader?: User;
  read_at?: ISODateString;
  is_resolved: boolean;
  resolved_by?: UUID;
  resolver?: User;
  resolved_at?: ISODateString;
  resolution_notes?: string;
  metadata?: any;
  created_at: ISODateString;
}

// Report Types
export interface ShiftReportData {
  shift_type: ShiftType;
  session_id: UUID;
  opened_at: ISODateString;
  closed_at?: ISODateString;
  opened_by: string | null;
  closed_by: string | null;
  status: SessionStatus;
  opening_cash: number | null;
  sales_count: number;
  total_revenue: number;
  expected_cash: number;
  expected_card: number;
  expected_qr: number;
  expected_transfer: number;
  declared_cash: number | null;
  declared_card: number | null;
  declared_qr: number | null;
  declared_transfer: number | null;
  discrepancy_cash: number | null;
  discrepancy_card: number | null;
  discrepancy_qr: number | null;
  discrepancy_transfer: number | null;
  voided_sales_count: number;
  withdrawals?: CashWithdrawal[];
}

export interface DailyReportData {
  report_date: string;
  branch_id: UUID;
  branch: {
    name: string;
    code: string;
    midday_closing_time: string;
    evening_closing_time: string;
    has_shift_change: boolean;
  } | null;
  shifts: ShiftReportData[];
  daily_totals: {
    total_cash: number;
    total_card: number;
    total_qr: number;
    total_transfer: number;
    total_discrepancy_cash: number;
    total_discrepancy_card: number;
    total_discrepancy_qr: number;
    total_discrepancy_transfer: number;
  };
  sales: {
    total_count: number;
    total_revenue: number;
    total_tax: number;
    total_discounts: number;
    average_ticket: number;
    voided_count: number;
    voided_amount: number;
    total_points_earned: number;
    total_points_redeemed: number;
    total_credit_used: number;
    total_credit_issued: number;
  };
  payments: Array<{
    method: string;
    code: string;
    total: number;
  }>;
  sessions: {
    total_sessions: number;
    total_opening: number;
    total_closing: number;
    total_discrepancy: number;
  };
  top_products: Array<{
    product: string;
    sku: string;
    quantity: number;
    revenue: number;
  }>;
  hourly: Array<{
    hour: number;
    sales_count: number;
    revenue: number;
  }>;
}

export interface LiveBranchShiftSession {
  session_id: UUID;
  shift_type: ShiftType;
  status: SessionStatus;
  opened_at: ISODateString;
  closed_at: ISODateString | null;
  opened_by: string | null;
  closed_by: string | null;
  sales_count: number;
  total_revenue: number;
}

export interface LiveBranchStatus {
  branch_id: UUID;
  branch_name: string;
  branch_code: string;
  midday_closing_time: string;
  evening_closing_time: string;
  has_shift_change: boolean;
  sessions: LiveBranchShiftSession[];
}

export interface LiveBranchShiftStatusData {
  date: string;
  branches: LiveBranchStatus[];
}

export interface ConsolidatedBranchReport {
  branch_id: UUID;
  branch_name: string;
  branch_code: string;
  total_cash: number;
  total_card: number;
  total_qr: number;
  total_transfer: number;
  discrepancy_cash: number;
  discrepancy_card: number;
  discrepancy_qr: number;
  discrepancy_transfer: number;
  sales_count: number;
  total_revenue: number;
  sessions: Array<{
    shift_type: ShiftType;
    status: SessionStatus;
    opened_by: string | null;
    closed_by: string | null;
    withdrawals?: CashWithdrawal[];
  }>;
}

export interface ConsolidatedDailyReportData {
  date: string;
  branches: ConsolidatedBranchReport[];
  consolidated: {
    total_cash: number;
    total_card: number;
    total_qr: number;
    total_transfer: number;
    total_discrepancy_cash: number;
    total_discrepancy_card: number;
    total_discrepancy_qr: number;
    total_discrepancy_transfer: number;
    total_sales: number;
    total_revenue: number;
  };
  top_products: Array<{
    product_name: string;
    sku: string;
    total_quantity: number;
    total_revenue: number;
  }>;
  alerts_summary: {
    total_alerts: number;
    by_severity: {
      [key: string]: number;
    };
    by_type: Array<{
      alert_type: string;
      severity: string;
      count: number;
    }>;
  };
}

export interface OwnerDashboardData {
  period: {
    start_date: ISODateString;
    end_date: ISODateString;
  };
  branches: number;
  overall: {
    total_sales: number;
    total_revenue: number;
    average_ticket: number;
  };
  by_branch: Array<{
    branch_id: UUID;
    branch: Branch;
    total_sales: number;
    total_revenue: number;
  }>;
  daily_trend: Array<{
    date: string;
    sales_count: number;
    revenue: number;
  }>;
  discrepancies: Array<{
    branch_id: UUID;
    branch: Branch;
    count: number;
    total_discrepancy: number;
  }>;
  shrinkage: {
    total_records: number;
    total_cost_loss: number;
  };
  top_products: Array<{
    product_id: UUID;
    product: Product;
    total_quantity: number;
    total_revenue: number;
  }>;
}

// Category Report Types
export interface CategoryReportData {
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
}

// Discrepancy Report Types
export interface DiscrepancyReportData {
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
}

// Payment Method Report Types
export interface PaymentMethodReportData {
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
}

// Shrinkage Report Types
export interface ShrinkageReportData {
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
}

// Hourly Report Types
export interface HourlyReportData {
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
}

// Branch Comparison Report Types
export interface BranchComparisonReportData {
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
}

// Invoice Types
export type InvoiceType = 'A' | 'B' | 'C' | 'NC_A' | 'NC_B' | 'NC_C';
export type InvoiceStatus = 'PENDING' | 'ISSUED' | 'FAILED' | 'CANCELLED';

export interface InvoiceTypeRecord {
  id: UUID;
  code: InvoiceType;
  name: string;
  description?: string;
}

export interface Invoice {
  id: UUID;
  sale_id: UUID;
  sale?: Sale;
  invoice_type_id: UUID;
  invoice_type?: InvoiceTypeRecord;
  point_of_sale: number;
  invoice_number: number;

  // CAE (AFIP electronic authorization)
  cae?: string;
  cae_expiration_date?: ISODateString;

  // Customer snapshot data
  customer_name?: string;
  customer_document_type?: string;
  customer_document_number?: string;
  customer_tax_condition?: string;
  customer_address?: string;

  // Amounts
  net_amount: Decimal;
  tax_amount: Decimal;
  total_amount: Decimal;

  // FactuHoy integration data
  factuhoy_id?: string;
  factuhoy_response?: any;
  pdf_url?: string;

  // Status and error handling
  status: InvoiceStatus;
  error_message?: string;
  retry_count: number;
  last_retry_at?: ISODateString;
  issued_at?: ISODateString;

  created_at: ISODateString;
  updated_at: ISODateString;
}

// Credit Note Types
export type CreditNoteType = 'A' | 'B' | 'C';
export type CreditNoteStatus = 'PENDING' | 'ISSUED' | 'FAILED';

export interface CreditNote {
  id: UUID;
  original_invoice_id: UUID;
  original_invoice?: Invoice;
  credit_note_type: CreditNoteType;
  point_of_sale: number;
  credit_note_number: number;

  // CAE (AFIP electronic authorization)
  cae?: string;
  cae_expiration_date?: ISODateString;

  // Reason and amounts
  reason: string;
  net_amount: Decimal;
  tax_amount: Decimal;
  total_amount: Decimal;

  // FactuHoy integration data
  factuhoy_id?: string;
  factuhoy_response?: any;
  pdf_url?: string;

  // Status and error handling
  status: CreditNoteStatus;
  error_message?: string;
  retry_count: number;
  last_retry_at?: ISODateString;
  issued_at?: ISODateString;

  // Relationships
  branch_id: UUID;
  branch?: Branch;
  created_by: UUID;
  creator?: User;

  created_at: ISODateString;
}

// Supplier Types
export interface Supplier {
  id: UUID;
  name: string;
  tax_id?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active: boolean;
}

// Stock Movement Types
export type MovementType =
  | 'SALE'
  | 'RETURN'
  | 'PURCHASE'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'ADJUSTMENT_PLUS'
  | 'ADJUSTMENT_MINUS'
  | 'SHRINKAGE'
  | 'INITIAL'
  | 'INVENTORY_COUNT';

export interface StockMovement {
  id: UUID;
  branch_id: UUID;
  product_id: UUID;
  movement_type: MovementType;
  quantity: Decimal;
  quantity_before: Decimal;
  quantity_after: Decimal;

  // Reference to source document
  reference_type?: string;
  reference_id?: UUID;

  // For adjustments and shrinkage
  adjustment_reason?: string;

  // For transfers
  related_branch_id?: UUID;

  // Tracking
  performed_by?: UUID;
  notes?: string;

  // Sync
  local_id?: string;
  synced_at?: ISODateString;

  // Timestamps
  created_at: ISODateString;

  // Relations
  product?: Product;
  branch?: Branch;
  related_branch?: Branch;
  performer?: User;
}

// Shrinkage Types
export type ShrinkageReason =
  | 'POWDER_LOSS'
  | 'PORTIONING'
  | 'SCALE_ERROR'
  | 'SPILLAGE'
  | 'OTHER';

export interface Shrinkage {
  id: UUID;
  branch_id: UUID;
  product_id: UUID;
  product?: Product;
  quantity: Decimal;
  cost_loss: Decimal;
  reason: ShrinkageReason;
  notes?: string;
  reported_by: UUID;
  created_at: ISODateString;
}

// Stock Transfer Types
export type StockTransferStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'CANCELLED';

export interface StockTransfer {
  id: UUID;
  transfer_number: string;
  source_branch_id: UUID;
  destination_branch_id: UUID;
  status: StockTransferStatus;

  // Tracking users
  requested_by?: UUID;
  approved_by?: UUID;
  shipped_by?: UUID;
  received_by?: UUID;

  // Timestamps
  requested_at: ISODateString;
  approved_at?: ISODateString;
  shipped_at?: ISODateString;
  received_at?: ISODateString;

  // Notes
  notes?: string;

  // Relations
  source_branch?: Branch;
  destination_branch?: Branch;
  requester?: User;
  approver?: User;
  shipper?: User;
  receiver?: User;
  items?: StockTransferItem[];

  // Timestamps
  created_at?: ISODateString;
  updated_at?: ISODateString;
}

export interface StockTransferItem {
  id: UUID;
  transfer_id: UUID;
  product_id: UUID;
  requested_quantity: Decimal;
  shipped_quantity?: Decimal;
  received_quantity?: Decimal;
  notes?: string;

  // Relations
  transfer?: StockTransfer;
  product?: Product;

  // Timestamps
  created_at?: ISODateString;
}

// Loyalty Types
export type LoyaltyTransactionType = 'EARN' | 'REDEEM' | 'ADJUST' | 'EXPIRE' | 'VOID';

export interface LoyaltyTransaction {
  id: UUID;
  customer_id: UUID;
  sale_id?: UUID;
  transaction_type: LoyaltyTransactionType;
  points: number;
  points_balance_after: number;
  description?: string;
  created_at: ISODateString;
}

// Credit Types
export type CreditTransactionType = 'CREDIT' | 'DEBIT' | 'PAYMENT' | 'ADJUST';

export interface CreditTransaction {
  id: UUID;
  customer_id: UUID;
  sale_id?: UUID;
  transaction_type: CreditTransactionType;
  amount: Decimal;
  balance_after: Decimal;
  description?: string;
  created_at: ISODateString;
}

// Shipping Types
export type DeliveryStatus = 'PENDING' | 'PROCESSING' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED' | 'CANCELLED';

export interface ShippingZone {
  id: UUID;
  name: string;
  description?: string;
  base_rate: Decimal;
  free_shipping_threshold?: Decimal;
  weight_surcharge_per_kg?: Decimal;
  express_surcharge?: Decimal;
  estimated_delivery_hours?: number;
  is_active: boolean;
  sort_order: number;
  created_at: ISODateString;
  updated_at: ISODateString;
  // Relations
  neighborhood_mappings?: NeighborhoodMapping[];
}

export interface NeighborhoodMapping {
  id: UUID;
  neighborhood_name: string;
  normalized_name: string;
  postal_code?: string;
  postal_code_pattern?: string;
  shipping_zone_id: UUID;
  city?: string;
  province?: string;
  is_active: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
  // Relations
  shipping_zone?: ShippingZone;
}

export interface SaleShipping {
  id: UUID;
  sale_id: UUID;
  customer_id?: UUID;
  shipping_zone_id: UUID;
  // Delivery address
  delivery_address: string;
  delivery_neighborhood: string;
  delivery_city?: string;
  delivery_postal_code?: string;
  delivery_notes?: string;
  // Shipping cost breakdown
  base_rate: Decimal;
  weight_kg?: Decimal;
  weight_surcharge: Decimal;
  is_express: boolean;
  express_surcharge: Decimal;
  free_shipping_applied: boolean;
  free_shipping_threshold?: Decimal;
  total_shipping_cost: Decimal;
  // Delivery tracking
  delivery_status: DeliveryStatus;
  estimated_delivery_date?: ISODateString;
  actual_delivery_date?: ISODateString;
  delivered_by?: UUID;
  delivery_confirmation_signature?: string;
  delivery_confirmation_photo?: string;
  tracking_number?: string;
  created_at: ISODateString;
  updated_at: ISODateString;
  // Relations
  sale?: Sale;
  customer?: Customer;
  shipping_zone?: ShippingZone;
  delivery_person?: User;
}

export interface ShippingCalculation {
  zone_id: UUID;
  zone_name: string;
  base_rate: Decimal;
  weight_kg: Decimal;
  weight_surcharge: Decimal;
  is_express: boolean;
  express_surcharge: Decimal;
  free_shipping_applied: boolean;
  free_shipping_threshold?: Decimal;
  total_shipping_cost: Decimal;
  estimated_delivery_date?: ISODateString;
  estimated_delivery_hours?: number;
}

// Shipping form data types
export interface ShippingZoneFormData {
  name: string;
  description?: string;
  base_rate: number;
  free_shipping_threshold?: number;
  weight_surcharge_per_kg?: number;
  express_surcharge?: number;
  estimated_delivery_hours?: number;
  is_active: boolean;
  sort_order?: number;
}

export interface NeighborhoodMappingFormData {
  neighborhood_name: string;
  postal_code?: string;
  postal_code_pattern?: string;
  shipping_zone_id: UUID;
  city?: string;
  province?: string;
}

export interface ShippingCalculationRequest {
  neighborhood: string;
  postal_code?: string;
  subtotal: number;
  weight?: number;
  is_express?: boolean;
}

export interface CreateSaleShippingRequest {
  customer_id?: UUID;
  delivery_address?: string;
  delivery_neighborhood?: string;
  delivery_city?: string;
  delivery_postal_code?: string;
  delivery_notes?: string;
  weight_kg?: number;
  is_express?: boolean;
}

// ==================== EXPENSE MANAGEMENT ====================

export type ExpensePaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'CREDIT_CARD' | 'DEBIT_CARD';
export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED' | 'CANCELLED';
export type RecurrencePattern = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface ExpenseCategory {
  id: UUID;
  name: string;
  description?: string;
  color_hex?: string;
  is_system: boolean;
  is_active: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface Expense {
  id: UUID;
  expense_number: string;

  // Classification
  category_id: UUID;
  category?: ExpenseCategory;
  branch_id?: UUID;
  branch?: {
    id: UUID;
    name: string;
  };

  // Details
  description: string;
  amount: Decimal;
  payment_method: ExpensePaymentMethod;

  // Vendor
  vendor_name?: string;
  vendor_tax_id?: string;
  invoice_number?: string;

  // Dates
  expense_date: ISODateString;
  due_date?: ISODateString;
  paid_date?: ISODateString;

  // Status
  status: ExpenseStatus;

  // Recurring
  is_recurring: boolean;
  recurrence_pattern?: RecurrencePattern;
  recurrence_day?: number;
  parent_expense_id?: UUID;
  parent?: {
    id: UUID;
    expense_number: string;
    description: string;
  };

  // Attachments
  receipt_url?: string;
  attachment_urls?: string[];

  // Approval workflow
  submitted_by: UUID;
  submitter?: {
    id: UUID;
    first_name: string;
    last_name: string;
    email: string;
  };
  approved_by?: UUID;
  approver?: {
    id: UUID;
    first_name: string;
    last_name: string;
    email: string;
  };
  approved_at?: ISODateString;
  rejection_reason?: string;

  // Accounting
  account_code?: string;
  is_tax_deductible: boolean;
  tax_year?: number;

  notes?: string;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface ExpenseFormData {
  category_id: UUID;
  branch_id?: UUID;
  description: string;
  amount: number;
  payment_method: ExpensePaymentMethod;
  vendor_name?: string;
  vendor_tax_id?: string;
  invoice_number?: string;
  expense_date: string;
  due_date?: string;
  is_recurring?: boolean;
  recurrence_pattern?: RecurrencePattern;
  recurrence_day?: number;
  account_code?: string;
  is_tax_deductible?: boolean;
  tax_year?: number;
  notes?: string;
}

export interface ExpenseStats {
  total_amount: number;
  total_pending: number;
  total_approved: number;
  total_paid: number;
  count_pending: number;
  count_approved: number;
  count_paid: number;
  by_category: {
    category_id: UUID;
    category_name: string;
    color_hex: string;
    total: number;
    count: number;
  }[];
}

export interface ExpenseCategoryFormData {
  name: string;
  description?: string;
  color_hex?: string;
  is_system?: boolean;
  is_active?: boolean;
}


// Stock Transfer Request Types
export interface CreateTransferRequest {
  from_branch_id: UUID;
  to_branch_id: UUID;
  items: {
    product_id: UUID;
    quantity: number;
  }[];
  notes?: string;
}

export interface ApproveTransferRequest {
  items: {
    id: UUID;
    shipped_quantity: number;
  }[];
}

export interface ReceiveTransferRequest {
  items: {
    item_id: UUID;
    quantity_received: number;
    notes?: string;
  }[];
}

// Chat Types
export interface ChatConversation {
  id: UUID;
  conversation_type: 'DIRECT' | 'BRANCH' | 'GROUP';
  branch_a_id?: UUID;
  branch_b_id?: UUID;
  title?: string;
  created_at: ISODateString;
  updated_at: ISODateString;
  branchA?: Branch;
  branchB?: Branch;
  participants?: ChatParticipant[];
  messages?: ChatMessage[];
  unread_count?: number;
}

export interface ChatParticipant {
  id: UUID;
  conversation_id: UUID;
  user_id: UUID;
  joined_at: ISODateString;
  left_at?: ISODateString;
  last_read_at?: ISODateString;
  user?: User;
}

export interface ChatMessage {
  id: UUID;
  conversation_id: UUID;
  sender_id: UUID;
  message_type: 'TEXT' | 'IMAGE' | 'TRANSFER_REQUEST';
  content: string;
  transfer_id?: UUID;
  is_deleted: boolean;
  created_at: ISODateString;
  sender?: User;
  transfer?: StockTransfer;
}

export interface SendMessageRequest {
  content: string;
  message_type?: 'TEXT' | 'IMAGE' | 'TRANSFER_REQUEST';
  transfer_id?: UUID;
}

export interface CreateConversationRequest {
  branch_a_id: UUID;
  branch_b_id: UUID;
}
