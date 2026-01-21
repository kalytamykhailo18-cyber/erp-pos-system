/**
 * Offline Sync Service
 *
 * Handles downloading data from server for offline use
 * and caching it in IndexedDB
 *
 * Data flow (Online Mode):
 * Server → API → syncService → IndexedDB cache
 *
 * Data flow (Offline Mode):
 * IndexedDB cache → Components
 */

import { db } from '../db';
import syncService from '../api/sync.service';
import type { UUID } from '../../types';

/**
 * Download and cache data for offline use
 * Called on app startup and when network is restored
 *
 * @param branchId - Branch to download data for
 * @returns Promise<boolean> - Success status
 */
export const downloadDataForOffline = async (
  branchId: UUID
): Promise<boolean> => {
  try {
    console.log('[SyncService] Starting data download for offline use...');

    // Get last sync time to only fetch updates
    const lastSyncTime = await db.getLastSyncTime();

    // Call sync/pull endpoint
    const response = await syncService.pull({
      branch_id: branchId,
      last_sync_at: lastSyncTime || null,
    });

    if (!response.success || !response.data) {
      console.error('[SyncService] Failed to download data:', response);
      return false;
    }

    // The API response wraps data in response.data, and the actual sync data is in response.data
    // Server returns: { success, data: { products, customers, payment_methods, categories, download_timestamp } }
    const data = response.data as any;
    const now = new Date().toISOString();

    // Cache products
    if (data.products && data.products.length > 0) {
      const products = data.products.map((p: any) => ({
        ...p,
        branch_id: branchId,
        cached_at: now,
      }));
      await db.products.bulkPut(products);
      console.log(`[SyncService] Cached ${products.length} products`);
    }

    // Cache customers
    if (data.customers && data.customers.length > 0) {
      const customers = data.customers.map((c: any) => ({
        ...c,
        cached_at: now,
      }));
      await db.customers.bulkPut(customers);
      console.log(`[SyncService] Cached ${customers.length} customers`);
    }

    // Cache payment methods
    if (data.payment_methods && data.payment_methods.length > 0) {
      const paymentMethods = data.payment_methods.map((pm: any) => ({
        ...pm,
        cached_at: now,
      }));
      await db.paymentMethods.bulkPut(paymentMethods);
      console.log(
        `[SyncService] Cached ${paymentMethods.length} payment methods`
      );
    }

    // Cache categories
    if (data.categories && data.categories.length > 0) {
      const categories = data.categories.map((cat: any) => ({
        ...cat,
        cached_at: now,
      }));
      await db.categories.bulkPut(categories);
      console.log(`[SyncService] Cached ${categories.length} categories`);
    }

    // Update last sync time (server returns download_timestamp)
    await db.setLastSyncTime(data.download_timestamp || now);

    console.log('[SyncService] Data download completed successfully');
    return true;
  } catch (error) {
    console.error('[SyncService] Error downloading data for offline:', error);
    return false;
  }
};

/**
 * Get cached products from IndexedDB
 * Used for offline product search
 *
 * @param branchId - Branch to get products for
 * @param searchTerm - Optional search term
 * @returns Promise<CachedProduct[]>
 */
export const getCachedProducts = async (
  branchId: UUID,
  searchTerm?: string
): Promise<any[]> => {
  try {
    let products = await db.products
      .where('branch_id')
      .equals(branchId)
      .toArray();

    // Filter by search term if provided
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term) ||
          (p.barcode && p.barcode.toLowerCase().includes(term))
      );
    }

    return products;
  } catch (error) {
    console.error('[SyncService] Error getting cached products:', error);
    return [];
  }
};

/**
 * Get cached product by ID
 *
 * @param productId - Product ID
 * @returns Promise<CachedProduct | null>
 */
export const getCachedProductById = async (
  productId: UUID
): Promise<any | null> => {
  try {
    const product = await db.products.get(productId);
    return product || null;
  } catch (error) {
    console.error('[SyncService] Error getting cached product:', error);
    return null;
  }
};

/**
 * Get cached customers from IndexedDB
 * Used for offline customer search
 *
 * @param searchTerm - Optional search term
 * @returns Promise<CachedCustomer[]>
 */
export const getCachedCustomers = async (
  searchTerm?: string
): Promise<any[]> => {
  try {
    let customers = await db.customers.toArray();

    // Filter by search term if provided
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      customers = customers.filter(
        (c) =>
          c.full_name.toLowerCase().includes(term) ||
          (c.email && c.email.toLowerCase().includes(term)) ||
          (c.phone && c.phone.includes(term)) ||
          (c.document_number && c.document_number.includes(term))
      );
    }

    return customers;
  } catch (error) {
    console.error('[SyncService] Error getting cached customers:', error);
    return [];
  }
};

/**
 * Get cached customer by ID
 *
 * @param customerId - Customer ID
 * @returns Promise<CachedCustomer | null>
 */
export const getCachedCustomerById = async (
  customerId: UUID
): Promise<any | null> => {
  try {
    const customer = await db.customers.get(customerId);
    return customer || null;
  } catch (error) {
    console.error('[SyncService] Error getting cached customer:', error);
    return null;
  }
};

/**
 * Get cached payment methods from IndexedDB
 * Used for offline payment selection
 *
 * @returns Promise<CachedPaymentMethod[]>
 */
export const getCachedPaymentMethods = async (): Promise<any[]> => {
  try {
    const methods = await db.paymentMethods.orderBy('display_order').toArray();
    return methods.filter((m) => m.is_active);
  } catch (error) {
    console.error('[SyncService] Error getting cached payment methods:', error);
    return [];
  }
};

/**
 * Get cached categories from IndexedDB
 * Used for offline product filtering
 *
 * @returns Promise<CachedCategory[]>
 */
export const getCachedCategories = async (): Promise<any[]> => {
  try {
    const categories = await db.categories.toArray();
    return categories.filter((c) => c.is_active);
  } catch (error) {
    console.error('[SyncService] Error getting cached categories:', error);
    return [];
  }
};

/**
 * Check if cached data is stale (older than 1 hour)
 * Used to determine if we should refresh cache
 *
 * @returns Promise<boolean>
 */
export const isCacheStale = async (): Promise<boolean> => {
  try {
    const lastSyncTime = await db.getLastSyncTime();
    if (!lastSyncTime) {
      return true; // No sync yet, cache is stale
    }

    const lastSync = new Date(lastSyncTime);
    const now = new Date();
    const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

    // Cache is stale if older than 1 hour
    return hoursSinceSync > 1;
  } catch (error) {
    console.error('[SyncService] Error checking cache staleness:', error);
    return true;
  }
};

/**
 * Clear all cached data
 * Used when logging out or switching branches
 */
export const clearCache = async (): Promise<void> => {
  try {
    await db.clearCachedData();
    console.log('[SyncService] Cache cleared');
  } catch (error) {
    console.error('[SyncService] Error clearing cache:', error);
  }
};

export default {
  downloadDataForOffline,
  getCachedProducts,
  getCachedProductById,
  getCachedCustomers,
  getCachedCustomerById,
  getCachedPaymentMethods,
  getCachedCategories,
  isCacheStale,
  clearCache,
};
