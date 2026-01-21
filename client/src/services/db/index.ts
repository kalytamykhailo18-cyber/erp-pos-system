/**
 * IndexedDB Database for Offline POS Operations
 *
 * This database stores all data needed for offline operation:
 * - Pending sales (to be synced when online)
 * - Cached products, customers, payment methods
 * - Sync queue for tracking pending operations
 * - Local metadata (last sync time, etc.)
 *
 * Type matching: All types match server/src/types/* definitions
 */

import Dexie, { Table } from 'dexie';
import type { UUID } from '../../types';

/**
 * Local sale matching Sale entity from server/src/types/sale.ts
 * Used for offline sale creation
 */
export interface LocalSale {
  id?: number; // IndexedDB auto-increment
  local_id: string; // UUID generated on client
  local_created_at: string; // ISO date string

  // Core sale data matching CreateSaleRequest
  branch_id: UUID;
  register_id: UUID;
  session_id: UUID;
  customer_id?: UUID;
  seller_id?: UUID;

  // Amounts
  subtotal: number;
  discount_amount: number;
  discount_percent: number;
  tax_amount: number;
  total_amount: number;

  // Loyalty & Credit
  points_earned: number;
  points_redeemed: number;
  points_redemption_value: number;
  credit_used: number;
  change_as_credit: number;

  // Status
  status: 'PENDING' | 'COMPLETED' | 'VOIDED' | 'RETURNED';
  created_by: UUID;

  // Invoice override data (for Type A invoices)
  invoice_override?: {
    invoice_type?: 'A' | 'B' | 'C';
    customer_cuit?: string;
    customer_tax_condition?: string;
    customer_address?: string;
  };

  // Sync status
  sync_status: 'PENDING' | 'SYNCED' | 'CONFLICT';
  synced_at?: string;
  sync_error?: string;

  // Nested data
  items: LocalSaleItem[];
  payments: LocalSalePayment[];
}

/**
 * Local sale item matching SaleItem from server/src/types/sale.ts
 */
export interface LocalSaleItem {
  id?: number;
  sale_local_id: string; // References LocalSale.local_id
  product_id: UUID;
  quantity: number;
  unit_price: number;
  cost_price?: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
  notes?: string;

  // For offline display
  product_name?: string;
  product_sku?: string;
}

/**
 * Local sale payment matching CreateSalePaymentRequest
 */
export interface LocalSalePayment {
  id?: number;
  sale_local_id: string; // References LocalSale.local_id
  payment_method_id: UUID;
  amount: number;
  reference_number?: string;
  card_last_four?: string;
  card_brand?: string;
  authorization_code?: string;
  qr_provider?: string;
  qr_transaction_id?: string;

  // For offline display
  payment_method_name?: string;
}

/**
 * Sync queue item matching SyncQueue from server/src/types/sync.ts
 */
export interface LocalSyncQueueItem {
  id?: number;
  entity_type: 'SALE' | 'STOCK_MOVEMENT' | 'REGISTER_SESSION' | 'CUSTOMER';
  entity_local_id: string; // References local entity ID
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: object; // Full entity data

  // Status tracking
  status: 'PENDING' | 'PROCESSING' | 'SYNCED' | 'FAILED' | 'CONFLICT';
  error_message?: string;
  retry_count: number;

  // Conflict resolution
  conflict_type?: string;
  conflict_resolution?: 'LOCAL_WINS' | 'SERVER_WINS' | 'MERGED';

  // Timestamps
  local_created_at: string;
  synced_at?: string;

  // Context
  branch_id: UUID;
  register_id?: UUID;
}

/**
 * Cached product for offline search and sale creation
 */
export interface CachedProduct {
  id: UUID;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  category_id?: UUID;
  category_name?: string;
  unit_id?: UUID;
  unit_code?: string;
  base_price: number;
  cost_price?: number;
  tax_rate: number;
  is_active: boolean;

  // Stock per branch
  branch_id: UUID;
  stock_quantity?: number;
  min_stock?: number;
  max_stock?: number;

  // Metadata
  cached_at: string;
}

/**
 * Cached customer for offline sale creation
 */
export interface CachedCustomer {
  id: UUID;
  full_name: string;
  email?: string;
  phone?: string;
  document_number?: string;
  document_type?: string;
  loyalty_points: number;
  credit_balance: number;
  is_active: boolean;

  // Metadata
  cached_at: string;
}

/**
 * Cached payment method for offline sale creation
 */
export interface CachedPaymentMethod {
  id: UUID;
  code: string;
  name: string;
  type: 'CASH' | 'CARD' | 'QR' | 'TRANSFER' | 'CREDIT' | 'OTHER';
  requires_reference: boolean;
  is_active: boolean;
  display_order: number;

  // Metadata
  cached_at: string;
}

/**
 * Cached category for offline product filtering
 */
export interface CachedCategory {
  id: UUID;
  name: string;
  description?: string;
  parent_id?: UUID;
  is_active: boolean;

  // Metadata
  cached_at: string;
}

/**
 * Local stock movement matching StockMovement from server/src/types/stock.ts
 * Used for offline stock tracking
 */
export interface LocalStockMovement {
  id?: number;
  local_id: string; // UUID generated on client
  local_created_at: string;

  branch_id: UUID;
  product_id: UUID;
  movement_type: 'SALE' | 'RETURN' | 'PURCHASE' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'ADJUSTMENT_PLUS' | 'ADJUSTMENT_MINUS' | 'SHRINKAGE' | 'INITIAL' | 'INVENTORY_COUNT';
  quantity: number;
  quantity_before: number;
  quantity_after: number;

  // Reference to source document
  reference_type: string | null;
  reference_id: string | null; // Can be local_id for offline refs

  // For adjustments
  adjustment_reason: string | null;

  // For transfers
  related_branch_id: UUID | null;

  performed_by: UUID | null;
  notes: string | null;

  // Sync status
  sync_status: 'PENDING' | 'SYNCED' | 'CONFLICT';
  synced_at?: string;
  sync_error?: string;
}

/**
 * Local register operation for tracking cash movements offline
 * Used for cash drops, withdrawals, and other register operations
 */
export interface LocalRegisterOperation {
  id?: number;
  local_id: string; // UUID generated on client
  local_created_at: string;

  session_id: UUID;
  register_id: UUID;
  branch_id: UUID;
  operation_type: 'OPEN' | 'CLOSE' | 'CASH_DROP' | 'CASH_WITHDRAWAL' | 'REOPEN';
  amount: number;
  notes: string | null;
  performed_by: UUID;

  // For session open/close
  declared_cash?: number;
  declared_card?: number;
  declared_qr?: number;
  declared_transfer?: number;

  // Sync status
  sync_status: 'PENDING' | 'SYNCED' | 'CONFLICT';
  synced_at?: string;
  sync_error?: string;
}

/**
 * Metadata for tracking sync state
 */
export interface SyncMetadata {
  key: string;
  value: string;
}

/**
 * Main POS Offline Database
 */
export class POSDatabase extends Dexie {
  // Offline sales
  sales!: Table<LocalSale, number>;
  saleItems!: Table<LocalSaleItem, number>;
  salePayments!: Table<LocalSalePayment, number>;

  // Stock movements
  stockMovements!: Table<LocalStockMovement, number>;

  // Register operations
  registerOperations!: Table<LocalRegisterOperation, number>;

  // Sync queue
  syncQueue!: Table<LocalSyncQueueItem, number>;

  // Cached data for offline operation
  products!: Table<CachedProduct, UUID>;
  customers!: Table<CachedCustomer, UUID>;
  paymentMethods!: Table<CachedPaymentMethod, UUID>;
  categories!: Table<CachedCategory, UUID>;

  // Metadata
  metadata!: Table<SyncMetadata, string>;

  constructor() {
    super('POSOfflineDB');

    // Database schema version 1 (legacy - for existing installations)
    this.version(1).stores({
      // Sales tables - indexed for efficient queries
      sales: '++id, local_id, branch_id, session_id, sync_status, local_created_at, customer_id',
      saleItems: '++id, sale_local_id, product_id',
      salePayments: '++id, sale_local_id, payment_method_id',

      // Sync queue - indexed by status and entity for efficient sync processing
      syncQueue: '++id, entity_local_id, status, entity_type, local_created_at, branch_id',

      // Cached data - indexed for fast offline search
      products: 'id, sku, barcode, branch_id, name, category_id',
      customers: 'id, email, phone, document_number, full_name',
      paymentMethods: 'id, code, type, display_order',
      categories: 'id, name, parent_id',

      // Metadata - simple key-value store
      metadata: 'key',
    });

    // Database schema version 2 - Add stock movements and register operations
    this.version(2).stores({
      // Sales tables - indexed for efficient queries
      sales: '++id, local_id, branch_id, session_id, sync_status, local_created_at, customer_id',
      saleItems: '++id, sale_local_id, product_id',
      salePayments: '++id, sale_local_id, payment_method_id',

      // Stock movements - indexed for audit trail
      stockMovements: '++id, local_id, branch_id, product_id, movement_type, sync_status, local_created_at',

      // Register operations - indexed for cash reconciliation
      registerOperations: '++id, local_id, session_id, register_id, branch_id, operation_type, sync_status, local_created_at',

      // Sync queue - indexed by status and entity for efficient sync processing
      syncQueue: '++id, entity_local_id, status, entity_type, local_created_at, branch_id',

      // Cached data - indexed for fast offline search
      products: 'id, sku, barcode, branch_id, name, category_id, stock_quantity',
      customers: 'id, email, phone, document_number, full_name',
      paymentMethods: 'id, code, type, display_order',
      categories: 'id, name, parent_id',

      // Metadata - simple key-value store
      metadata: 'key',
    });
  }

  /**
   * Clear all offline data (use with caution)
   */
  async clearAllData(): Promise<void> {
    await this.sales.clear();
    await this.saleItems.clear();
    await this.salePayments.clear();
    await this.stockMovements.clear();
    await this.registerOperations.clear();
    await this.syncQueue.clear();
    await this.products.clear();
    await this.customers.clear();
    await this.paymentMethods.clear();
    await this.categories.clear();
    await this.metadata.clear();
  }

  /**
   * Clear only cached data (keep pending sales)
   */
  async clearCachedData(): Promise<void> {
    await this.products.clear();
    await this.customers.clear();
    await this.paymentMethods.clear();
    await this.categories.clear();
  }

  /**
   * Get last sync timestamp
   */
  async getLastSyncTime(): Promise<string | null> {
    const metadata = await this.metadata.get('last_sync_time');
    return metadata?.value || null;
  }

  /**
   * Set last sync timestamp
   */
  async setLastSyncTime(timestamp: string): Promise<void> {
    await this.metadata.put({ key: 'last_sync_time', value: timestamp });
  }

  /**
   * Get pending sync count
   */
  async getPendingSyncCount(): Promise<number> {
    return await this.syncQueue
      .where('status')
      .equals('PENDING')
      .count();
  }

  /**
   * Get failed sync count
   */
  async getFailedSyncCount(): Promise<number> {
    return await this.syncQueue
      .where('status')
      .equals('FAILED')
      .count();
  }

  /**
   * Get conflict count
   */
  async getConflictCount(): Promise<number> {
    return await this.syncQueue
      .where('status')
      .equals('CONFLICT')
      .count();
  }
}

// Global database instance
export const db = new POSDatabase();

// Export for testing and utilities
export default db;
