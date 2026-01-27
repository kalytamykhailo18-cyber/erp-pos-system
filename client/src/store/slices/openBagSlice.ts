import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { OpenBag, UUID, Decimal } from '../../types';
import { openBagService } from '../../services/api/openBag.service';
import { startLoading, stopLoading, showToast } from './uiSlice';

interface OpenBagState {
  // Open bags list
  openBags: OpenBag[];
  lowStockBags: OpenBag[];
  selectedOpenBag: OpenBag | null;

  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };

  // Filters
  filters: {
    branch_id?: UUID;
    product_id?: UUID;
    status?: 'OPEN' | 'EMPTY';
  };

  // Loading states
  loading: boolean;
  error: string | null;
}

const initialState: OpenBagState = {
  openBags: [],
  lowStockBags: [],
  selectedOpenBag: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  filters: {},
  loading: false,
  error: null,
};

// ============================================
// ASYNC THUNKS
// ============================================

export const loadOpenBags = createAsyncThunk<
  { openBags: OpenBag[]; total: number },
  { page?: number; limit?: number; branch_id?: UUID; product_id?: UUID; status?: 'OPEN' | 'EMPTY' } | void,
  { rejectValue: string }
>(
  'openBag/loadOpenBags',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await openBagService.getAll(params || {});

      if (!response.success) {
        throw new Error('Failed to load open bags');
      }

      return {
        openBags: response.data,
        total: response.pagination?.total_items || response.data.length,
      };
    } catch (error) {
      return rejectWithValue('Error loading open bags');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadOpenBagsByBranch = createAsyncThunk<
  OpenBag[],
  UUID,
  { rejectValue: string }
>(
  'openBag/loadByBranch',
  async (branchId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await openBagService.getByBranch(branchId);

      if (!response.success) {
        throw new Error('Failed to load open bags');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error loading open bags');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadLowStockBags = createAsyncThunk<
  OpenBag[],
  { branch_id?: UUID } | void,
  { rejectValue: string }
>(
  'openBag/loadLowStock',
  async (params, { rejectWithValue }) => {
    try {
      const response = await openBagService.getLowStock(params || {});

      if (!response.success) {
        throw new Error('Failed to load low stock bags');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error loading low stock bags');
    }
  }
);

export const getOpenBagById = createAsyncThunk<
  OpenBag,
  UUID,
  { rejectValue: string }
>(
  'openBag/getById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await openBagService.getById(id);

      if (!response.success) {
        throw new Error('Failed to load open bag');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error loading open bag');
    }
  }
);

export const openBag = createAsyncThunk<
  OpenBag,
  {
    branch_id: UUID;
    product_id: UUID;
    original_weight: Decimal;
    low_stock_threshold?: Decimal;
    notes?: string;
  },
  { rejectValue: string }
>(
  'openBag/open',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Abriendo bolsa sellada...'));
      const response = await openBagService.create(data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to open bag');
      }

      dispatch(showToast({
        type: 'success',
        message: `Bolsa abierta: ${data.original_weight} kg disponibles`
      }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error opening bag';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const deductFromBag = createAsyncThunk<
  OpenBag,
  { id: UUID; quantity: Decimal; sale_id?: UUID },
  { rejectValue: string }
>(
  'openBag/deduct',
  async ({ id, quantity, sale_id }, { dispatch, rejectWithValue }) => {
    try {
      const response = await openBagService.deduct(id, { quantity, sale_id });

      if (!response.success) {
        throw new Error(response.error || 'Failed to deduct from bag');
      }

      // Check if low stock
      const bag = response.data;
      if (bag.low_stock_threshold && bag.remaining_weight <= bag.low_stock_threshold) {
        dispatch(showToast({
          type: 'warning',
          message: `Stock bajo en bolsa abierta: ${bag.remaining_weight} kg restantes`
        }));
      }

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error deducting from bag';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    }
  }
);

export const closeBag = createAsyncThunk<
  OpenBag,
  { id: UUID; notes?: string },
  { rejectValue: string }
>(
  'openBag/close',
  async ({ id, notes }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Cerrando bolsa...'));
      const response = await openBagService.close(id, { notes });

      if (!response.success) {
        throw new Error(response.error || 'Failed to close bag');
      }

      dispatch(showToast({ type: 'success', message: 'Bolsa cerrada exitosamente' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error closing bag';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// ============================================
// SLICE
// ============================================

const openBagSlice = createSlice({
  name: 'openBag',
  initialState,
  reducers: {
    setSelectedOpenBag: (state, action: PayloadAction<OpenBag | null>) => {
      state.selectedOpenBag = action.payload;
    },

    setFilters: (state, action: PayloadAction<OpenBagState['filters']>) => {
      state.filters = action.payload;
    },

    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },

    setLimit: (state, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1;
    },

    clearOpenBags: (state) => {
      state.openBags = [];
      state.lowStockBags = [];
      state.pagination = { page: 1, limit: 20, total: 0, pages: 0 };
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    // Load Open Bags
    builder
      .addCase(loadOpenBags.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadOpenBags.fulfilled, (state, action) => {
        state.openBags = action.payload.openBags;
        state.pagination.total = action.payload.total;
        state.pagination.pages = Math.ceil(action.payload.total / state.pagination.limit);
        state.loading = false;
      })
      .addCase(loadOpenBags.rejected, (state, action) => {
        state.error = action.payload || 'Error loading open bags';
        state.loading = false;
      });

    // Load Open Bags By Branch
    builder
      .addCase(loadOpenBagsByBranch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadOpenBagsByBranch.fulfilled, (state, action) => {
        state.openBags = action.payload;
        state.loading = false;
      })
      .addCase(loadOpenBagsByBranch.rejected, (state, action) => {
        state.error = action.payload || 'Error loading open bags';
        state.loading = false;
      });

    // Load Low Stock Bags
    builder
      .addCase(loadLowStockBags.pending, (state) => {
        state.error = null;
      })
      .addCase(loadLowStockBags.fulfilled, (state, action) => {
        state.lowStockBags = action.payload;
      })
      .addCase(loadLowStockBags.rejected, (state, action) => {
        state.error = action.payload || 'Error loading low stock bags';
      });

    // Get Open Bag By ID
    builder.addCase(getOpenBagById.fulfilled, (state, action) => {
      state.selectedOpenBag = action.payload;
    });

    // Open Bag
    builder.addCase(openBag.fulfilled, (state, action) => {
      state.openBags.unshift(action.payload);
      state.pagination.total += 1;
      state.pagination.pages = Math.ceil(state.pagination.total / state.pagination.limit);
    });

    // Deduct From Bag
    builder.addCase(deductFromBag.fulfilled, (state, action) => {
      const index = state.openBags.findIndex((bag) => bag.id === action.payload.id);
      if (index >= 0) {
        state.openBags[index] = action.payload;
      }

      // Update selected bag if it's the same one
      if (state.selectedOpenBag?.id === action.payload.id) {
        state.selectedOpenBag = action.payload;
      }

      // Update low stock bags if needed
      const lowStockIndex = state.lowStockBags.findIndex((bag) => bag.id === action.payload.id);
      if (action.payload.low_stock_threshold &&
          action.payload.remaining_weight <= action.payload.low_stock_threshold) {
        // Add to low stock if not already there
        if (lowStockIndex === -1) {
          state.lowStockBags.push(action.payload);
        } else {
          state.lowStockBags[lowStockIndex] = action.payload;
        }
      } else if (lowStockIndex >= 0) {
        // Remove from low stock if above threshold
        state.lowStockBags.splice(lowStockIndex, 1);
      }

      // If bag is now empty, update status
      if (action.payload.status === 'EMPTY') {
        // Remove from low stock bags
        if (lowStockIndex >= 0) {
          state.lowStockBags.splice(lowStockIndex, 1);
        }
      }
    });

    // Close Bag
    builder.addCase(closeBag.fulfilled, (state, action) => {
      const index = state.openBags.findIndex((bag) => bag.id === action.payload.id);
      if (index >= 0) {
        state.openBags[index] = action.payload;
      }

      // Remove from low stock bags
      state.lowStockBags = state.lowStockBags.filter((bag) => bag.id !== action.payload.id);

      // Update selected bag if it's the same one
      if (state.selectedOpenBag?.id === action.payload.id) {
        state.selectedOpenBag = action.payload;
      }
    });
  },
});

export const {
  setSelectedOpenBag,
  setFilters,
  setPage,
  setLimit,
  clearOpenBags,
  clearError,
} = openBagSlice.actions;

export default openBagSlice.reducer;
