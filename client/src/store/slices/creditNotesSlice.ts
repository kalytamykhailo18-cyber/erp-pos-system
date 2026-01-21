import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { CreditNote, PaginatedResponse } from '../../types';
import invoiceService from '../../services/api/invoice.service';
import { showToast } from './uiSlice';

interface CreditNotesState {
  creditNotes: CreditNote[];
  currentCreditNote: CreditNote | null;
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  };
  filters: {
    branch_id?: string;
    status?: string;
    from_date?: string;
    to_date?: string;
  };
  loading: boolean;
  error: string | null;
}

const initialState: CreditNotesState = {
  creditNotes: [],
  currentCreditNote: null,
  pagination: {
    page: 1,
    limit: 10,
    total_items: 0,
    total_pages: 0,
  },
  filters: {},
  loading: false,
  error: null,
};

// Thunks

/**
 * Fetch credit notes with filters and pagination
 */
export const fetchCreditNotes = createAsyncThunk<
  PaginatedResponse<CreditNote>,
  {
    page?: number;
    limit?: number;
    branch_id?: string;
    status?: string;
    from_date?: string;
    to_date?: string;
  } | void,
  { rejectValue: string }
>(
  'creditNotes/fetchAll',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      const filters = params || {};
      const response = await invoiceService.getCreditNotes({
        page: filters.page || 1,
        limit: filters.limit || 10,
        branch_id: filters.branch_id,
        status: filters.status,
        from_date: filters.from_date,
        to_date: filters.to_date,
      });

      if (!response.success) {
        throw new Error(response.error || 'Error al cargar notas de crédito');
      }

      return response;
    } catch (error: any) {
      const message = error.message || 'Error al cargar notas de crédito';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    }
  }
);

/**
 * Fetch single credit note by ID
 */
export const fetchCreditNoteById = createAsyncThunk<
  CreditNote,
  string,
  { rejectValue: string }
>(
  'creditNotes/fetchById',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await invoiceService.getCreditNoteById(id);

      if (!response.success) {
        throw new Error(response.error || 'Error al cargar nota de crédito');
      }

      return response.data;
    } catch (error: any) {
      const message = error.message || 'Error al cargar nota de crédito';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    }
  }
);

/**
 * Create credit note for an invoice
 */
export const createCreditNote = createAsyncThunk<
  CreditNote,
  {
    invoiceId: string;
    reason: string;
    items?: Array<{ amount: number }>;
  },
  { rejectValue: string }
>(
  'creditNotes/create',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      const response = await invoiceService.createCreditNote(data.invoiceId, {
        reason: data.reason,
        items: data.items,
      });

      if (!response.success) {
        throw new Error(response.error || 'Error al crear nota de crédito');
      }

      dispatch(showToast({
        type: 'success',
        message: 'Nota de crédito creada exitosamente. Se enviará a AFIP.',
      }));

      return response.data;
    } catch (error: any) {
      const message = error.message || 'Error al crear nota de crédito';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    }
  }
);

/**
 * Retry failed credit note
 */
export const retryCreditNote = createAsyncThunk<
  CreditNote,
  string,
  { rejectValue: string }
>(
  'creditNotes/retry',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await invoiceService.retryCreditNote(id);

      if (!response.success) {
        throw new Error(response.error || 'Error al reintentar nota de crédito');
      }

      dispatch(showToast({
        type: 'success',
        message: response.data.status === 'ISSUED'
          ? `Nota de crédito emitida exitosamente - CAE: ${response.data.cae}`
          : 'Reintento iniciado, se procesará en segundo plano',
      }));

      return response.data;
    } catch (error: any) {
      const message = error.message || 'Error al reintentar nota de crédito';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    }
  }
);

// Slice

const creditNotesSlice = createSlice({
  name: 'creditNotes',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<CreditNotesState['filters']>) => {
      state.filters = action.payload;
      state.pagination.page = 1; // Reset to first page on filter change
    },
    clearFilters: (state) => {
      state.filters = {};
      state.pagination.page = 1;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    clearCurrentCreditNote: (state) => {
      state.currentCreditNote = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch All Credit Notes
    builder
      .addCase(fetchCreditNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCreditNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.creditNotes = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchCreditNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error desconocido';
      });

    // Fetch Credit Note By ID
    builder
      .addCase(fetchCreditNoteById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCreditNoteById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCreditNote = action.payload;
      })
      .addCase(fetchCreditNoteById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error desconocido';
      });

    // Create Credit Note
    builder
      .addCase(createCreditNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCreditNote.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCreditNote = action.payload;
        // Add to list if not already there
        if (!state.creditNotes.find(cn => cn.id === action.payload.id)) {
          state.creditNotes.unshift(action.payload);
          state.pagination.total_items += 1;
        }
      })
      .addCase(createCreditNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error desconocido';
      });

    // Retry Credit Note
    builder
      .addCase(retryCreditNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(retryCreditNote.fulfilled, (state, action) => {
        state.loading = false;
        // Update in list
        const index = state.creditNotes.findIndex(cn => cn.id === action.payload.id);
        if (index !== -1) {
          state.creditNotes[index] = action.payload;
        }
        // Update current if it's the same one
        if (state.currentCreditNote?.id === action.payload.id) {
          state.currentCreditNote = action.payload;
        }
      })
      .addCase(retryCreditNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error desconocido';
      });
  },
});

export const { setFilters, clearFilters, setPage, clearCurrentCreditNote } = creditNotesSlice.actions;

export default creditNotesSlice.reducer;
