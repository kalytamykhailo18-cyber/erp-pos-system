import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Customer, QuickSearchCustomer, UUID } from '../../types';
import { customerService } from '../../services/api';
import { startLoading, stopLoading, showToast } from './uiSlice';
import { getCachedCustomers, getCachedCustomerById } from '../../services/offline/syncService';

interface CustomersState {
  customers: Customer[];
  quickSearchResults: QuickSearchCustomer[];
  selectedCustomer: Customer | null;
  searchQuery: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: CustomersState = {
  customers: [],
  quickSearchResults: [],
  selectedCustomer: null,
  searchQuery: '',
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  loading: false,
  error: null,
};

// Async Thunks
export const loadCustomers = createAsyncThunk<
  { customers: Customer[]; total: number },
  { page?: number; limit?: number; search?: string } | void,
  { rejectValue: string }
>(
  'customers/loadCustomers',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await customerService.getAll(params || {});

      if (!response.success) {
        throw new Error('Failed to load customers');
      }

      return {
        customers: response.data,
        total: response.pagination?.total_items || response.data.length,
      };
    } catch (error) {
      return rejectWithValue('Error loading customers');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const quickSearchCustomers = createAsyncThunk<
  QuickSearchCustomer[],
  string,
  { rejectValue: string }
>(
  'customers/quickSearch',
  async (query, { rejectWithValue }) => {
    try {
      if (query.length < 2) {
        return [];
      }

      // Check if online
      const isOnline = navigator.onLine;

      if (isOnline) {
        // Try online search first
        try {
          const response = await customerService.quickSearch(query);

          if (!response.success) {
            throw new Error('Failed to search customers');
          }

          return response.data;
        } catch (error) {
          // Network error - fallback to offline cache
          console.warn('[Customers] Online search failed, using cached data', error);
          const cachedCustomers = await getCachedCustomers(query);
          return cachedCustomers as QuickSearchCustomer[];
        }
      } else {
        // Offline mode - use cached data
        console.log('[Customers] Offline mode, using cached data');
        const cachedCustomers = await getCachedCustomers(query);
        return cachedCustomers as QuickSearchCustomer[];
      }
    } catch (error) {
      return rejectWithValue('Error searching customers');
    }
  }
);

export const getCustomerByQRCode = createAsyncThunk<
  Customer,
  string,
  { rejectValue: string }
>(
  'customers/getByQRCode',
  async (qrCode, { dispatch, rejectWithValue }) => {
    try {
      const response = await customerService.getByQRCode(qrCode);

      if (!response.success) {
        throw new Error('Customer not found');
      }

      dispatch(showToast({
        type: 'success',
        message: `Cliente: ${response.data.company_name || response.data.first_name}`,
      }));

      return response.data;
    } catch (error) {
      dispatch(showToast({ type: 'error', message: 'Cliente no encontrado' }));
      return rejectWithValue('Customer not found');
    }
  }
);

export const getCustomerById = createAsyncThunk<
  Customer,
  UUID,
  { rejectValue: string }
>(
  'customers/getById',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());

      // Check if online
      const isOnline = navigator.onLine;

      if (isOnline) {
        // Try online fetch first
        try {
          const response = await customerService.getById(id);

          if (!response.success) {
            throw new Error('Customer not found');
          }

          return response.data;
        } catch (error) {
          // Network error - fallback to offline cache
          console.warn('[Customers] Online fetch failed, using cached data', error);
          const cachedCustomer = await getCachedCustomerById(id);
          if (!cachedCustomer) {
            throw new Error('Customer not found in cache');
          }
          return cachedCustomer as Customer;
        }
      } else {
        // Offline mode - use cached data
        console.log('[Customers] Offline mode, using cached data');
        const cachedCustomer = await getCachedCustomerById(id);
        if (!cachedCustomer) {
          throw new Error('Customer not found in cache');
        }
        return cachedCustomer as Customer;
      }
    } catch (error) {
      return rejectWithValue('Customer not found');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const createCustomer = createAsyncThunk<
  Customer,
  Partial<Customer>,
  { rejectValue: string }
>(
  'customers/create',
  async (customerData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Creando cliente...'));
      const response = await customerService.create(customerData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create customer');
      }

      dispatch(showToast({ type: 'success', message: 'Cliente creado' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error creating customer';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const updateCustomer = createAsyncThunk<
  Customer,
  { id: UUID; data: Partial<Customer> },
  { rejectValue: string }
>(
  'customers/update',
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Actualizando cliente...'));
      const response = await customerService.update(id, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update customer');
      }

      dispatch(showToast({ type: 'success', message: 'Cliente actualizado' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error updating customer';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const addLoyaltyPoints = createAsyncThunk<
  { new_balance: number },
  { customer_id: UUID; points: number; description?: string },
  { rejectValue: string }
>(
  'customers/addLoyaltyPoints',
  async ({ customer_id, points, description }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await customerService.addLoyaltyPoints(customer_id, points, description);

      if (!response.success) {
        throw new Error('Failed to add points');
      }

      dispatch(showToast({
        type: 'success',
        message: `${points > 0 ? '+' : ''}${points} puntos`,
      }));

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error adding points';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const addCredit = createAsyncThunk<
  { new_balance: number },
  { customer_id: UUID; amount: number; description?: string },
  { rejectValue: string }
>(
  'customers/addCredit',
  async ({ customer_id, amount, description }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await customerService.addCredit(customer_id, amount, description);

      if (!response.success) {
        throw new Error('Failed to add credit');
      }

      dispatch(showToast({
        type: 'success',
        message: `${amount > 0 ? '+' : ''}$${amount} crédito`,
      }));

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error adding credit';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const deleteCustomer = createAsyncThunk<
  UUID,
  UUID,
  { rejectValue: string }
>(
  'customers/delete',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Eliminando cliente...'));
      const response = await customerService.deactivate(id);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete customer');
      }

      dispatch(showToast({ type: 'success', message: 'Cliente eliminado' }));
      return id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error deleting customer';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    setSelectedCustomer: (state, action: PayloadAction<Customer | null>) => {
      state.selectedCustomer = action.payload;
    },

    clearQuickSearchResults: (state) => {
      state.quickSearchResults = [];
    },

    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },

    setLimit: (state, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1;
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    // Load Customers
    builder
      .addCase(loadCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCustomers.fulfilled, (state, action) => {
        state.customers = action.payload.customers;
        state.pagination.total = action.payload.total;
        state.pagination.pages = Math.ceil(action.payload.total / state.pagination.limit);
        state.loading = false;
      })
      .addCase(loadCustomers.rejected, (state, action) => {
        state.error = action.payload || 'Error loading customers';
        state.loading = false;
      });

    // Quick Search
    builder.addCase(quickSearchCustomers.fulfilled, (state, action) => {
      state.quickSearchResults = action.payload;
    });

    // Get by QR Code
    builder.addCase(getCustomerByQRCode.fulfilled, (state, action) => {
      state.selectedCustomer = action.payload;
    });

    // Get by ID
    builder.addCase(getCustomerById.fulfilled, (state, action) => {
      state.selectedCustomer = action.payload;
    });

    // Create Customer
    builder.addCase(createCustomer.fulfilled, (state, action) => {
      state.customers.unshift(action.payload);
      state.pagination.total += 1;
      state.pagination.pages = Math.ceil(state.pagination.total / state.pagination.limit);
      state.selectedCustomer = action.payload;
    });

    // Update Customer
    builder.addCase(updateCustomer.fulfilled, (state, action) => {
      const index = state.customers.findIndex((c) => c.id === action.payload.id);
      if (index >= 0) {
        state.customers[index] = action.payload;
      }
      if (state.selectedCustomer?.id === action.payload.id) {
        state.selectedCustomer = action.payload;
      }
    });

    // Add Loyalty Points
    builder.addCase(addLoyaltyPoints.fulfilled, (state, action) => {
      if (state.selectedCustomer) {
        state.selectedCustomer.loyalty_points = action.payload.new_balance;
      }
    });

    // Add Credit
    builder.addCase(addCredit.fulfilled, (state, action) => {
      if (state.selectedCustomer) {
        state.selectedCustomer.credit_balance = String(action.payload.new_balance);
      }
    });

    // Delete Customer
    builder.addCase(deleteCustomer.fulfilled, (state, action) => {
      state.customers = state.customers.filter((c) => c.id !== action.payload);
      state.pagination.total -= 1;
      state.pagination.pages = Math.ceil(state.pagination.total / state.pagination.limit);
      if (state.selectedCustomer?.id === action.payload) {
        state.selectedCustomer = null;
      }
    });
  },
});

export const {
  setSearchQuery,
  setSelectedCustomer,
  clearQuickSearchResults,
  setPage,
  setLimit,
  clearError,
} = customersSlice.actions;

export default customersSlice.reducer;
