import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { UUID, StockTransfer, StockTransferStatus } from '../../types';
import { stockService } from '../../services/api/stock.service';
import { startLoading, stopLoading, showToast } from './uiSlice';

interface TransferState {
  transfers: StockTransfer[];
  currentTransfer: StockTransfer | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const initialState: TransferState = {
  transfers: [],
  currentTransfer: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
  },
};

// Async Thunks

/**
 * Fetch all transfers with filters
 */
export const fetchTransfers = createAsyncThunk<
  { transfers: StockTransfer[]; total: number },
  {
    from_branch_id?: UUID;
    to_branch_id?: UUID;
    status?: StockTransferStatus;
    page?: number;
    limit?: number;
  },
  { rejectValue: string }
>(
  'transfer/fetchTransfers',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('transfers'));
      const response = await stockService.getTransfers(params);

      if (!response.success) {
        throw new Error('Failed to load transfers');
      }

      return {
        transfers: response.data,
        total: response.pagination?.total_items || response.data.length,
      };
    } catch (error) {
      dispatch(showToast({
        message: 'Error al cargar traslados',
        type: 'error'
      }));
      return rejectWithValue('Error al cargar traslados');
    } finally {
      dispatch(stopLoading());
    }
  }
);

/**
 * Fetch transfer by ID
 */
export const fetchTransferById = createAsyncThunk<
  StockTransfer,
  UUID,
  { rejectValue: string }
>(
  'transfer/fetchTransferById',
  async (transferId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('transfer'));
      const response = await stockService.getTransferById(transferId);

      if (!response.success) {
        throw new Error('Failed to load transfer');
      }

      return response.data;
    } catch (error) {
      dispatch(showToast({
        message: 'Error al cargar traslado',
        type: 'error'
      }));
      return rejectWithValue('Error al cargar traslado');
    } finally {
      dispatch(stopLoading());
    }
  }
);

/**
 * Create new transfer
 */
export const createTransfer = createAsyncThunk<
  StockTransfer,
  {
    from_branch_id: UUID;
    to_branch_id: UUID;
    notes?: string;
    items: Array<{
      product_id: UUID;
      quantity: number;
    }>;
  },
  { rejectValue: string }
>(
  'transfer/createTransfer',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('createTransfer'));
      const response = await stockService.createTransfer(data);

      if (!response.success) {
        throw new Error('Failed to create transfer');
      }

      dispatch(showToast({
        message: 'Traslado creado exitosamente',
        type: 'success'
      }));

      return response.data;
    } catch (error) {
      dispatch(showToast({
        message: 'Error al crear traslado',
        type: 'error'
      }));
      return rejectWithValue('Error al crear traslado');
    } finally {
      dispatch(stopLoading());
    }
  }
);

/**
 * Approve transfer (start transit)
 */
export const approveTransfer = createAsyncThunk<
  StockTransfer,
  {
    transferId: UUID;
    items: Array<{
      id: UUID;
      shipped_quantity: number;
    }>;
  },
  { rejectValue: string }
>(
  'transfer/approveTransfer',
  async ({ transferId, items }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('approveTransfer'));
      const response = await stockService.approveTransfer(transferId, items);

      if (!response.success) {
        throw new Error('Failed to approve transfer');
      }

      dispatch(showToast({
        message: 'Traslado aprobado y en tránsito',
        type: 'success'
      }));

      return response.data;
    } catch (error) {
      dispatch(showToast({
        message: 'Error al aprobar traslado',
        type: 'error'
      }));
      return rejectWithValue('Error al aprobar traslado');
    } finally {
      dispatch(stopLoading());
    }
  }
);

/**
 * Receive transfer at destination
 */
export const receiveTransfer = createAsyncThunk<
  StockTransfer,
  {
    transferId: UUID;
    items: Array<{
      item_id: UUID;
      quantity_received: number;
    }>;
    notes?: string;
  },
  { rejectValue: string }
>(
  'transfer/receiveTransfer',
  async ({ transferId, items, notes }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('receiveTransfer'));
      const response = await stockService.receiveTransfer(transferId, { items, notes });

      if (!response.success) {
        throw new Error('Failed to receive transfer');
      }

      dispatch(showToast({
        message: 'Traslado recibido exitosamente',
        type: 'success'
      }));

      return response.data;
    } catch (error) {
      dispatch(showToast({
        message: 'Error al recibir traslado',
        type: 'error'
      }));
      return rejectWithValue('Error al recibir traslado');
    } finally {
      dispatch(stopLoading());
    }
  }
);

/**
 * Cancel transfer
 */
export const cancelTransfer = createAsyncThunk<
  StockTransfer,
  { transferId: UUID; reason: string },
  { rejectValue: string }
>(
  'transfer/cancelTransfer',
  async ({ transferId, reason }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('cancelTransfer'));
      const response = await stockService.cancelTransfer(transferId, reason);

      if (!response.success) {
        throw new Error('Failed to cancel transfer');
      }

      dispatch(showToast({
        message: 'Traslado cancelado',
        type: 'success'
      }));

      return response.data;
    } catch (error) {
      dispatch(showToast({
        message: 'Error al cancelar traslado',
        type: 'error'
      }));
      return rejectWithValue('Error al cancelar traslado');
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Slice
const transferSlice = createSlice({
  name: 'transfer',
  initialState,
  reducers: {
    clearCurrentTransfer: (state) => {
      state.currentTransfer = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch transfers
      .addCase(fetchTransfers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransfers.fulfilled, (state, action) => {
        state.loading = false;
        state.transfers = action.payload.transfers;
        state.pagination.total = action.payload.total;
      })
      .addCase(fetchTransfers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error al cargar traslados';
      })

      // Fetch transfer by ID
      .addCase(fetchTransferById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransferById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTransfer = action.payload;
      })
      .addCase(fetchTransferById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error al cargar traslado';
      })

      // Create transfer
      .addCase(createTransfer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTransfer.fulfilled, (state, action) => {
        state.loading = false;
        state.transfers.unshift(action.payload);
        state.currentTransfer = action.payload;
      })
      .addCase(createTransfer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error al crear traslado';
      })

      // Approve transfer
      .addCase(approveTransfer.fulfilled, (state, action) => {
        const index = state.transfers.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.transfers[index] = action.payload;
        }
        if (state.currentTransfer?.id === action.payload.id) {
          state.currentTransfer = action.payload;
        }
      })

      // Receive transfer
      .addCase(receiveTransfer.fulfilled, (state, action) => {
        const index = state.transfers.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.transfers[index] = action.payload;
        }
        if (state.currentTransfer?.id === action.payload.id) {
          state.currentTransfer = action.payload;
        }
      })

      // Cancel transfer
      .addCase(cancelTransfer.fulfilled, (state, action) => {
        const index = state.transfers.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.transfers[index] = action.payload;
        }
        if (state.currentTransfer?.id === action.payload.id) {
          state.currentTransfer = action.payload;
        }
      });
  },
});

export const { clearCurrentTransfer, clearError } = transferSlice.actions;
export default transferSlice.reducer;
