import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Invoice, UUID } from '../../types';
import invoiceService, { type InvoiceFilters, type InvoiceStats } from '../../services/api/invoice.service';
import { startLoading, stopLoading, showToast } from './uiSlice';

interface InvoicesState {
  invoices: Invoice[];
  currentInvoice: Invoice | null;
  stats: InvoiceStats | null;
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  };
  filters: InvoiceFilters;
  error: string | null;
}

const initialState: InvoicesState = {
  invoices: [],
  currentInvoice: null,
  stats: null,
  pagination: {
    page: 1,
    limit: 20,
    total_items: 0,
    total_pages: 0,
  },
  filters: {},
  error: null,
};

// Async thunks
export const fetchInvoices = createAsyncThunk<
  { invoices: Invoice[]; pagination: InvoicesState['pagination'] },
  InvoiceFilters,
  { rejectValue: string }
>(
  'invoices/fetchInvoices',
  async (filters, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Cargando facturas...'));
      const response = await invoiceService.getAll(filters);

      if (!response.success) {
        throw new Error(response.error || 'Error al cargar facturas');
      }

      return {
        invoices: response.data,
        pagination: response.pagination,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar facturas';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const fetchInvoiceById = createAsyncThunk<
  Invoice,
  UUID,
  { rejectValue: string }
>(
  'invoices/fetchInvoiceById',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Cargando factura...'));
      const response = await invoiceService.getById(id);

      if (!response.success) {
        throw new Error(response.error || 'Error al cargar factura');
      }

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar factura';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const fetchInvoiceStats = createAsyncThunk<
  InvoiceStats,
  { branch_id?: string; start_date?: string; end_date?: string } | void,
  { rejectValue: string }
>(
  'invoices/fetchStats',
  async (filters, { rejectWithValue }) => {
    try {
      const params = filters || {};
      const response = await invoiceService.getStats(params);

      if (!response.success) {
        throw new Error(response.error || 'Error al cargar estadísticas');
      }

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar estadísticas';
      return rejectWithValue(message);
    }
  }
);

export const retryPendingInvoices = createAsyncThunk<
  { processed: number; failed: number },
  string | void,
  { rejectValue: string }
>(
  'invoices/retryPending',
  async (branchId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Reintentando facturas pendientes...'));
      const response = await invoiceService.retryPending(branchId || undefined);

      if (!response.success) {
        throw new Error(response.error || 'Error al reintentar facturas');
      }

      dispatch(showToast({
        type: 'success',
        message: `Procesadas: ${response.data.processed}, Fallidas: ${response.data.failed}`,
      }));

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al reintentar facturas';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const retryInvoice = createAsyncThunk<
  Invoice,
  string,
  { rejectValue: string }
>(
  'invoices/retryInvoice',
  async (invoiceId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Reintentando factura...'));
      const response = await invoiceService.retryInvoice(invoiceId);

      if (!response.success) {
        throw new Error(response.error || 'Error al reintentar factura');
      }

      dispatch(showToast({
        type: 'success',
        message: response.message || 'Factura reintentada exitosamente',
      }));

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al reintentar factura';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<InvoiceFilters>) => {
      state.filters = action.payload;
      state.pagination.page = 1;
    },
    resetFilters: (state) => {
      state.filters = {};
      state.pagination.page = 1;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1;
    },
    clearCurrentInvoice: (state) => {
      state.currentInvoice = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch invoices
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.invoices = action.payload.invoices;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.error = action.payload || 'Error al cargar facturas';
      })

      // Fetch invoice by ID
      .addCase(fetchInvoiceById.fulfilled, (state, action) => {
        state.currentInvoice = action.payload;
        state.error = null;
      })
      .addCase(fetchInvoiceById.rejected, (state, action) => {
        state.error = action.payload || 'Error al cargar factura';
      })

      // Fetch stats
      .addCase(fetchInvoiceStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })

      // Retry pending
      .addCase(retryPendingInvoices.fulfilled, (state) => {
        state.error = null;
      })

      // Retry single invoice
      .addCase(retryInvoice.fulfilled, (state, action) => {
        // Update the invoice in the list if it exists
        const index = state.invoices.findIndex(inv => inv.id === action.payload.id);
        if (index !== -1) {
          state.invoices[index] = action.payload;
        }
        // Update current invoice if it's the one being retried
        if (state.currentInvoice?.id === action.payload.id) {
          state.currentInvoice = action.payload;
        }
        state.error = null;
      })
      .addCase(retryInvoice.rejected, (state, action) => {
        state.error = action.payload || 'Error al reintentar factura';
      });
  },
});

export const { setFilters, resetFilters, setPage, setLimit, clearCurrentInvoice, clearError } = invoicesSlice.actions;

export default invoicesSlice.reducer;
