import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import type {
  Cart,
  CartItem,
  POSProduct,
  Customer,
  PaymentMethod,
  Sale,
  SalePayment,
  UUID,
} from '../../types';
import { saleService, paymentService } from '../../services/api';
import { startLoading, stopLoading, showToast } from './uiSlice';
import { db, LocalSale, LocalSaleItem, LocalSalePayment } from '../../services/db';
import type { LocalSyncQueueItem } from '../../services/db';

interface POSState {
  // Cart state
  cart: Cart;

  // Payment state
  paymentMethods: PaymentMethod[];
  payments: SalePayment[];
  isPaymentMode: boolean;

  // Quick search results
  searchResults: POSProduct[];
  searchQuery: string;

  // Current sale being processed
  currentSale: Sale | null;

  // Last completed sale (for receipt) - can be Sale or LocalSale (offline)
  lastSale: Sale | LocalSale | null;

  // POS mode
  mode: 'sale' | 'return' | 'exchange';

  // Error state
  error: string | null;

  // Loyalty points being redeemed
  loyaltyPointsToRedeem: number;

  // Credit being used
  creditToUse: number;
}

const emptyCart: Cart = {
  items: [],
  subtotal: '0',
  discount_type: undefined,
  discount_value: 0,
  discount_amount: '0',
  discount_reason: undefined,
  discount_approved_by_pin: undefined,
  tax_amount: '0',
  total: '0',
};

const initialState: POSState = {
  cart: { ...emptyCart },
  paymentMethods: [],
  payments: [],
  isPaymentMode: false,
  searchResults: [],
  searchQuery: '',
  currentSale: null,
  lastSale: null,
  mode: 'sale',
  error: null,
  loyaltyPointsToRedeem: 0,
  creditToUse: 0,
};

// Helper to calculate cart totals
const calculateCartTotals = (cart: Cart): Cart => {
  let subtotal = 0;
  let taxAmount = 0;

  // Ensure items array exists
  const items = cart.items || [];
  items.forEach((item) => {
    subtotal += Number(item.subtotal);
    taxAmount += Number(item.tax_amount);
  });

  let discountAmount = 0;
  if (cart.discount_type === 'PERCENT' && cart.discount_value) {
    discountAmount = subtotal * (cart.discount_value / 100);
  } else if (cart.discount_type === 'FIXED' && cart.discount_value) {
    discountAmount = cart.discount_value;
  }

  // Apply wholesale discount if customer is wholesale
  if (cart.customer?.is_wholesale && cart.customer.wholesale_discount_percent) {
    const wholesaleDiscount = subtotal * (Number(cart.customer.wholesale_discount_percent) / 100);
    discountAmount += wholesaleDiscount;
  }

  const total = subtotal - discountAmount + taxAmount;

  return {
    ...cart,
    items, // Ensure items is always an array
    subtotal: String(subtotal),
    discount_amount: String(discountAmount),
    tax_amount: String(taxAmount),
    total: String(Math.max(0, total)),
  };
};

// Calculate item totals
const calculateItemTotals = (
  product: POSProduct,
  quantity: number,
  discountPercent: number = 0
): Omit<CartItem, 'id' | 'product_id' | 'product'> => {
  const unitPrice = Number(product.selling_price);
  const subtotal = unitPrice * quantity;
  const discountAmount = subtotal * (discountPercent / 100);
  const afterDiscount = subtotal - discountAmount;

  let taxAmount = 0;
  if (product.tax_rate) {
    if (product.is_tax_included) {
      // Tax is included in price - extract tax amount using reverse calculation
      // Formula: tax = lineTotal * taxRate / (100 + taxRate)
      taxAmount = afterDiscount * (Number(product.tax_rate) / (100 + Number(product.tax_rate)));
    } else {
      // Tax is not included - calculate tax on top of price
      taxAmount = afterDiscount * (Number(product.tax_rate) / 100);
    }
  }

  return {
    quantity,
    unit_price: String(unitPrice),
    discount_percent: discountPercent,
    discount_amount: String(discountAmount),
    tax_rate: String(Number(product.tax_rate) || 0),
    tax_amount: String(taxAmount),
    subtotal: String(subtotal),
    total: String(afterDiscount + (product.is_tax_included ? 0 : taxAmount)), // Add tax only if not included
  };
};

// Async Thunks
export const loadPaymentMethods = createAsyncThunk<PaymentMethod[], void, { rejectValue: string }>(
  'pos/loadPaymentMethods',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await paymentService.getMethods();

      if (!response.success) {
        throw new Error('Failed to load payment methods');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error loading payment methods');
    } finally {
      dispatch(stopLoading());
    }
  }
);

/**
 * Create sale offline and save to IndexedDB
 * Called when online sale creation fails or when offline
 */
const createOfflineSale = async (
  saleData: {
    branch_id: UUID;
    register_id: UUID;
    session_id: UUID;
    invoice_override?: {
      invoice_type?: 'A' | 'B' | 'C';
      customer_cuit?: string;
      customer_tax_condition?: string;
      customer_address?: string;
    };
    points_to_redeem?: number;
    credit_to_use?: number;
    change_as_credit?: boolean;
  },
  cart: Cart,
  payments: SalePayment[],
  userId: UUID
): Promise<LocalSale> => {
  const localId = uuidv4();
  const now = new Date().toISOString();

  // Calculate totals
  const subtotal = Number(cart.subtotal);
  const discountAmount = Number(cart.discount_amount);
  const taxAmount = Number(cart.tax_amount);
  const total = Number(cart.total);

  // Calculate loyalty values
  const pointsRedeemed = saleData.points_to_redeem || 0;
  const creditUsed = saleData.credit_to_use || 0;
  const pointsRedemptionValue = pointsRedeemed * 0.1; // 10 points = $1

  // Calculate actual total after loyalty deductions (matches backend calculation at sale.controller.js:466)
  const totalAfterLoyalty = total - pointsRedemptionValue - creditUsed;

  // Calculate change amount - just overpayment on final total
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const changeAmount = Math.max(0, totalPaid - totalAfterLoyalty);
  const changeAsCreditAmount = (saleData.change_as_credit && changeAmount > 10) ? changeAmount : 0;

  // Calculate points earned (0.01 points per peso as per helpers.js:134)
  const pointsEarned = cart.customer ? Math.floor(totalAfterLoyalty * 0.01) : 0;

  // Prepare local sale data matching LocalSale interface
  const localSale: LocalSale = {
    local_id: localId,
    local_created_at: now,
    branch_id: saleData.branch_id,
    register_id: saleData.register_id,
    session_id: saleData.session_id,
    customer_id: cart.customer?.id,
    subtotal,
    discount_amount: discountAmount,
    discount_percent: cart.discount_type === 'PERCENT' ? cart.discount_value || 0 : 0,
    tax_amount: taxAmount,
    total_amount: total,
    points_earned: pointsEarned,
    points_redeemed: pointsRedeemed,
    points_redemption_value: pointsRedemptionValue,
    credit_used: creditUsed,
    change_as_credit: changeAsCreditAmount,
    status: 'COMPLETED',
    created_by: userId,
    invoice_override: saleData.invoice_override, // Preserve invoice override for offline sales
    sync_status: 'PENDING',
    items: [],
    payments: [],
  };

  // Prepare sale items
  const localItems: LocalSaleItem[] = cart.items.map((item) => ({
    sale_local_id: localId,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: Number(item.unit_price),
    discount_percent: item.discount_percent,
    discount_amount: Number(item.discount_amount),
    tax_rate: Number(item.tax_rate) || 0,
    tax_amount: Number(item.tax_amount),
    line_total: Number(item.total),
    product_name: item.product.name,
    product_sku: item.product.sku,
  }));

  // Prepare sale payments
  const localPayments: LocalSalePayment[] = payments.map((p) => ({
    sale_local_id: localId,
    payment_method_id: p.payment_method_id,
    amount: Number(p.amount),
    reference_number: p.reference_number,
    card_last_four: p.card_last_four,
    card_brand: p.card_brand,
    authorization_code: p.authorization_code,
    qr_provider: p.qr_provider,
    qr_transaction_id: p.qr_transaction_id,
    payment_method_name: p.payment_method?.name,
  }));

  localSale.items = localItems;
  localSale.payments = localPayments;

  // Save to IndexedDB
  await db.sales.add(localSale);
  await db.saleItems.bulkAdd(localItems);
  await db.salePayments.bulkAdd(localPayments);

  // Create stock movements and deduct inventory for each item
  const stockMovements: any[] = [];
  for (const item of cart.items) {
    const stockMovementLocalId = uuidv4();

    // Get current cached stock
    const cachedProduct = await db.products.get(item.product_id);
    const currentStock = cachedProduct?.stock_quantity || 0;
    const quantityBefore = currentStock;
    const quantityAfter = Math.max(0, currentStock - item.quantity);

    // Create stock movement record
    const stockMovement = {
      local_id: stockMovementLocalId,
      local_created_at: now,
      branch_id: saleData.branch_id,
      product_id: item.product_id,
      movement_type: 'SALE' as const,
      quantity: item.quantity,
      quantity_before: quantityBefore,
      quantity_after: quantityAfter,
      reference_type: 'SALE',
      reference_id: localId, // Reference to offline sale's local_id
      adjustment_reason: null,
      related_branch_id: null,
      performed_by: userId,
      notes: `Offline sale - ${item.product.name}`,
      sync_status: 'PENDING' as const,
    };

    stockMovements.push(stockMovement);

    // Deduct from local cached inventory
    if (cachedProduct) {
      await db.products.update(item.product_id, {
        stock_quantity: quantityAfter,
      });
      console.log(
        `[POS] Stock deducted: ${item.product.name} (${quantityBefore} → ${quantityAfter})`
      );
    } else {
      console.warn(
        `[POS] Product ${item.product_id} not in cache - cannot deduct stock locally`
      );
    }

    // Add stock movement to sync queue
    const stockSyncItem: Omit<LocalSyncQueueItem, 'id'> = {
      entity_type: 'STOCK_MOVEMENT',
      entity_local_id: stockMovementLocalId,
      operation: 'INSERT',
      payload: stockMovement,
      status: 'PENDING',
      retry_count: 0,
      local_created_at: now,
      branch_id: saleData.branch_id,
    };
    await db.syncQueue.add(stockSyncItem as LocalSyncQueueItem);
  }

  // Save stock movements to IndexedDB
  await db.stockMovements.bulkAdd(stockMovements);

  // Add sale to sync queue
  const syncQueueItem: Omit<LocalSyncQueueItem, 'id'> = {
    entity_type: 'SALE',
    entity_local_id: localId,
    operation: 'INSERT',
    payload: {
      ...localSale,
      items: localItems,
      payments: localPayments,
    },
    status: 'PENDING',
    retry_count: 0,
    local_created_at: now,
    branch_id: saleData.branch_id,
    register_id: saleData.register_id,
  };

  await db.syncQueue.add(syncQueueItem as LocalSyncQueueItem);

  console.log(
    `[POS] Sale saved offline with local_id: ${localId}, ${stockMovements.length} stock movements created`
  );

  return localSale;
};

export const completeSale = createAsyncThunk<
  Sale | LocalSale,
  {
    branch_id: UUID;
    register_id: UUID;
    session_id: UUID;
    user_id: UUID;
    // Invoice override parameters
    invoice_override?: {
      invoice_type?: 'A' | 'B' | 'C';
      customer_cuit?: string;
      customer_tax_condition?: string;
      customer_address?: string;
    };
    // Loyalty parameters
    points_to_redeem?: number;
    credit_to_use?: number;
    change_as_credit?: boolean;
  },
  { rejectValue: string }
>(
  'pos/completeSale',
  async (saleData, { getState, dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Procesando venta...'));

      const state = getState() as { pos: POSState };
      const { cart, payments } = state.pos;

      if (cart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      if (totalPaid < Number(cart.total)) {
        throw new Error('Insufficient payment');
      }

      const salePayload = {
        branch_id: saleData.branch_id,
        register_id: saleData.register_id,
        session_id: saleData.session_id,
        customer_id: cart.customer?.id,
        items: cart.items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
          discount_percent: item.discount_percent,
        })),
        payments: payments.map((p) => ({
          payment_method_id: p.payment_method_id,
          amount: Number(p.amount),
          reference_number: p.reference_number,
          authorization_code: p.authorization_code,
          card_last_four: p.card_last_four,
          card_brand: p.card_brand,
          qr_provider: p.qr_provider,
          qr_transaction_id: p.qr_transaction_id,
        })),
        discount_type: cart.discount_type,
        discount_value: cart.discount_value,
        discount_reason: cart.discount_reason,
        discount_approved_by_pin: cart.discount_approved_by_pin,
        // Include invoice override data if provided
        invoice_override: saleData.invoice_override,
        // Include loyalty data if provided
        points_redeemed: saleData.points_to_redeem || 0,
        credit_used: saleData.credit_to_use || 0,
        change_as_credit: saleData.change_as_credit && saleData.change_as_credit ? true : false,
      };

      // Check if online
      const isOnline = navigator.onLine;

      if (isOnline) {
        // Try to create sale online
        try {
          const response = await saleService.create(salePayload);

          if (!response.success) {
            throw new Error(response.error || 'Failed to complete sale');
          }

          dispatch(showToast({
            type: 'success',
            message: `Venta ${response.data.sale_number} completada!`,
          }));

          return response.data;
        } catch (error) {
          // Network error - fallback to offline
          console.warn('[POS] Online sale failed, falling back to offline mode', error);
          const offlineSale = await createOfflineSale(
            saleData,
            cart,
            payments,
            saleData.user_id
          );

          dispatch(showToast({
            type: 'warning',
            message: 'Venta guardada en modo offline. Se sincronizará automáticamente.',
          }));

          // Return offline sale as Sale-like object for UI
          return offlineSale as any;
        }
      } else {
        // Offline mode - create sale locally
        console.log('[POS] Offline mode detected, creating sale locally');
        const offlineSale = await createOfflineSale(
          saleData,
          cart,
          payments,
          saleData.user_id
        );

        dispatch(showToast({
          type: 'warning',
          message: 'Sin conexión. Venta guardada offline.',
        }));

        return offlineSale as any;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al procesar venta';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const voidSale = createAsyncThunk<
  Sale,
  { sale_id: UUID; reason: string },
  { rejectValue: string }
>(
  'pos/voidSale',
  async ({ sale_id, reason }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Anulando venta...'));

      const response = await saleService.void(sale_id, reason);

      if (!response.success) {
        throw new Error(response.error || 'Failed to void sale');
      }

      dispatch(showToast({ type: 'success', message: 'Venta anulada' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al anular venta';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

const posSlice = createSlice({
  name: 'pos',
  initialState,
  reducers: {
    // Add item to cart
    addToCart: (state, action: PayloadAction<{ product: POSProduct; quantity?: number }>) => {
      const { product, quantity = 1 } = action.payload;

      // Check if product already in cart
      const existingIndex = state.cart.items.findIndex(
        (item) => item.product_id === product.id
      );

      if (existingIndex >= 0) {
        // Update quantity
        const existingItem = state.cart.items[existingIndex];
        const newQuantity = existingItem.quantity + quantity;
        const totals = calculateItemTotals(product, newQuantity, existingItem.discount_percent);

        state.cart.items[existingIndex] = {
          ...existingItem,
          ...totals,
        };
      } else {
        // Add new item
        const totals = calculateItemTotals(product, quantity);
        const newItem: CartItem = {
          id: uuidv4(),
          product_id: product.id,
          product,
          ...totals,
        };
        state.cart.items.push(newItem);
      }

      state.cart = calculateCartTotals(state.cart);
    },

    // Update item quantity
    updateCartItemQuantity: (
      state,
      action: PayloadAction<{ itemId: string; quantity: number }>
    ) => {
      const { itemId, quantity } = action.payload;
      const itemIndex = state.cart.items.findIndex((item) => item.id === itemId);

      if (itemIndex >= 0) {
        if (quantity <= 0) {
          // Remove item
          state.cart.items.splice(itemIndex, 1);
        } else {
          // Update quantity
          const item = state.cart.items[itemIndex];
          const totals = calculateItemTotals(item.product, quantity, item.discount_percent);
          state.cart.items[itemIndex] = { ...item, ...totals };
        }
        state.cart = calculateCartTotals(state.cart);
      }
    },

    // Apply item discount
    applyItemDiscount: (
      state,
      action: PayloadAction<{ itemId: string; discountPercent: number }>
    ) => {
      const { itemId, discountPercent } = action.payload;
      const itemIndex = state.cart.items.findIndex((item) => item.id === itemId);

      if (itemIndex >= 0) {
        const item = state.cart.items[itemIndex];
        const totals = calculateItemTotals(item.product, item.quantity, discountPercent);
        state.cart.items[itemIndex] = { ...item, ...totals };
        state.cart = calculateCartTotals(state.cart);
      }
    },

    // Remove item from cart
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.cart.items = state.cart.items.filter((item) => item.id !== action.payload);
      state.cart = calculateCartTotals(state.cart);
    },

    // Clear cart
    clearCart: (state) => {
      state.cart = { ...emptyCart };
      state.payments = [];
      state.isPaymentMode = false;
      state.loyaltyPointsToRedeem = 0;
      state.creditToUse = 0;
    },

    // Set customer
    setCustomer: (state, action: PayloadAction<Customer | undefined>) => {
      state.cart.customer = action.payload;
      state.cart = calculateCartTotals(state.cart);
    },

    // Apply cart discount
    applyCartDiscount: (
      state,
      action: PayloadAction<{
        type: 'PERCENT' | 'FIXED';
        value: number;
        reason: string;
        managerPin?: string;
      }>
    ) => {
      state.cart.discount_type = action.payload.type;
      state.cart.discount_value = action.payload.value;
      state.cart.discount_reason = action.payload.reason;
      state.cart.discount_approved_by_pin = action.payload.managerPin;
      state.cart = calculateCartTotals(state.cart);
    },

    // Clear cart discount
    clearCartDiscount: (state) => {
      state.cart.discount_type = undefined;
      state.cart.discount_value = 0;
      state.cart.discount_reason = undefined;
      state.cart.discount_approved_by_pin = undefined;
      state.cart = calculateCartTotals(state.cart);
    },

    // Enter payment mode
    enterPaymentMode: (state) => {
      if (state.cart.items.length > 0) {
        state.isPaymentMode = true;
      }
    },

    // Exit payment mode
    exitPaymentMode: (state) => {
      state.isPaymentMode = false;
      state.payments = [];
    },

    // Add payment
    addPayment: (state, action: PayloadAction<SalePayment>) => {
      state.payments.push(action.payload);
    },

    // Remove payment
    removePayment: (state, action: PayloadAction<number>) => {
      state.payments.splice(action.payload, 1);
    },

    // Update payment amount
    updatePaymentAmount: (
      state,
      action: PayloadAction<{ index: number; amount: number }>
    ) => {
      if (state.payments[action.payload.index]) {
        state.payments[action.payload.index].amount = String(action.payload.amount);
      }
    },

    // Clear payments
    clearPayments: (state) => {
      state.payments = [];
    },

    // Set search results
    setSearchResults: (state, action: PayloadAction<POSProduct[]>) => {
      state.searchResults = action.payload;
    },

    // Set search query
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    // Set POS mode
    setMode: (state, action: PayloadAction<'sale' | 'return' | 'exchange'>) => {
      state.mode = action.payload;
    },

    // Set loyalty points to redeem
    setLoyaltyPointsToRedeem: (state, action: PayloadAction<number>) => {
      state.loyaltyPointsToRedeem = action.payload;
    },

    // Set credit to use
    setCreditToUse: (state, action: PayloadAction<number>) => {
      state.creditToUse = action.payload;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Reset POS state (for new sale)
    resetPOS: (state) => {
      state.cart = { ...emptyCart };
      state.payments = [];
      state.isPaymentMode = false;
      state.currentSale = null;
      state.error = null;
      state.loyaltyPointsToRedeem = 0;
      state.creditToUse = 0;
      state.mode = 'sale';
    },
  },

  extraReducers: (builder) => {
    // Load Payment Methods
    builder.addCase(loadPaymentMethods.fulfilled, (state, action) => {
      state.paymentMethods = action.payload;
    });

    // Complete Sale
    builder
      .addCase(completeSale.pending, (state) => {
        state.error = null;
      })
      .addCase(completeSale.fulfilled, (state, action) => {
        state.lastSale = action.payload;
        state.currentSale = null;
        // Reset for next sale
        state.cart = { ...emptyCart };
        state.payments = [];
        state.isPaymentMode = false;
        state.loyaltyPointsToRedeem = 0;
        state.creditToUse = 0;
      })
      .addCase(completeSale.rejected, (state, action) => {
        state.error = action.payload || 'Error processing sale';
      });

    // Void Sale
    builder
      .addCase(voidSale.fulfilled, (state, action) => {
        if (state.lastSale?.id === action.payload.id) {
          state.lastSale = action.payload;
        }
      });
  },
});

export const {
  addToCart,
  updateCartItemQuantity,
  applyItemDiscount,
  removeFromCart,
  clearCart,
  setCustomer,
  applyCartDiscount,
  clearCartDiscount,
  enterPaymentMode,
  exitPaymentMode,
  addPayment,
  removePayment,
  updatePaymentAmount,
  clearPayments,
  setSearchResults,
  setSearchQuery,
  setMode,
  setLoyaltyPointsToRedeem,
  setCreditToUse,
  clearError,
  resetPOS,
} = posSlice.actions;

export default posSlice.reducer;
