import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { NonSalesDeduction, DeductionType, DeductionApprovalStatus, UUID, Decimal } from '../../types';
import { nonSalesDeductionService } from '../../services/api/nonSalesDeduction.service';
import { startLoading, stopLoading, showToast } from './uiSlice';

interface NonSalesDeductionState {
  // Deductions list
  deductions: NonSalesDeduction[];
  pendingDeductions: NonSalesDeduction[];
  selectedDeduction: NonSalesDeduction | null;

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
    approval_status?: DeductionApprovalStatus;
    deduction_type?: DeductionType;
  };

  // Loading states
  loading: boolean;
  error: string | null;
}

const initialState: NonSalesDeductionState = {
  deductions: [],
  pendingDeductions: [],
  selectedDeduction: null,
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

export const loadNonSalesDeductions = createAsyncThunk<
  { deductions: NonSalesDeduction[]; total: number },
  {
    page?: number;
    limit?: number;
    branch_id?: UUID;
    approval_status?: DeductionApprovalStatus;
    deduction_type?: DeductionType;
  } | void,
  { rejectValue: string }
>(
  'nonSalesDeduction/loadAll',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await nonSalesDeductionService.getAll(params || {});

      if (!response.success) {
        throw new Error('Failed to load deductions');
      }

      return {
        deductions: response.data,
        total: response.pagination?.total_items || response.data.length,
      };
    } catch (error) {
      return rejectWithValue('Error loading deductions');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadPendingDeductions = createAsyncThunk<
  NonSalesDeduction[],
  { branch_id?: UUID } | void,
  { rejectValue: string }
>(
  'nonSalesDeduction/loadPending',
  async (params, { rejectWithValue }) => {
    try {
      const response = await nonSalesDeductionService.getPending(params || {});

      if (!response.success) {
        throw new Error('Failed to load pending deductions');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error loading pending deductions');
    }
  }
);

export const getNonSalesDeductionById = createAsyncThunk<
  NonSalesDeduction,
  UUID,
  { rejectValue: string }
>(
  'nonSalesDeduction/getById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await nonSalesDeductionService.getById(id);

      if (!response.success) {
        throw new Error('Failed to load deduction');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error loading deduction');
    }
  }
);

export const createNonSalesDeduction = createAsyncThunk<
  NonSalesDeduction,
  {
    branch_id: UUID;
    product_id: UUID;
    quantity: Decimal;
    deduction_type: DeductionType;
    reason?: string;
    recipient?: string;
  },
  { rejectValue: string }
>(
  'nonSalesDeduction/create',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Creando solicitud...'));
      const response = await nonSalesDeductionService.create(data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create deduction');
      }

      const typeName = data.deduction_type === 'FREE_SAMPLE' ? 'muestra gratis' : 'donación';
      dispatch(showToast({
        type: 'success',
        message: `Solicitud de ${typeName} creada. Pendiente de aprobación.`
      }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error creating deduction';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const approveNonSalesDeduction = createAsyncThunk<
  NonSalesDeduction,
  UUID,
  { rejectValue: string }
>(
  'nonSalesDeduction/approve',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Aprobando solicitud...'));
      const response = await nonSalesDeductionService.approve(id);

      if (!response.success) {
        throw new Error(response.error || 'Failed to approve deduction');
      }

      dispatch(showToast({
        type: 'success',
        message: 'Solicitud aprobada. Stock deducido correctamente.'
      }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error approving deduction';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const rejectNonSalesDeduction = createAsyncThunk<
  NonSalesDeduction,
  { id: UUID; rejection_reason?: string },
  { rejectValue: string }
>(
  'nonSalesDeduction/reject',
  async ({ id, rejection_reason }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Rechazando solicitud...'));
      const response = await nonSalesDeductionService.reject(id, { rejection_reason });

      if (!response.success) {
        throw new Error(response.error || 'Failed to reject deduction');
      }

      dispatch(showToast({
        type: 'info',
        message: 'Solicitud rechazada'
      }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error rejecting deduction';
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

const nonSalesDeductionSlice = createSlice({
  name: 'nonSalesDeduction',
  initialState,
  reducers: {
    setSelectedDeduction: (state, action: PayloadAction<NonSalesDeduction | null>) => {
      state.selectedDeduction = action.payload;
    },

    setFilters: (state, action: PayloadAction<NonSalesDeductionState['filters']>) => {
      state.filters = action.payload;
    },

    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },

    setLimit: (state, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1;
    },

    clearDeductions: (state) => {
      state.deductions = [];
      state.pendingDeductions = [];
      state.pagination = { page: 1, limit: 20, total: 0, pages: 0 };
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    // Load All Deductions
    builder
      .addCase(loadNonSalesDeductions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadNonSalesDeductions.fulfilled, (state, action) => {
        state.deductions = action.payload.deductions;
        state.pagination.total = action.payload.total;
        state.pagination.pages = Math.ceil(action.payload.total / state.pagination.limit);
        state.loading = false;
      })
      .addCase(loadNonSalesDeductions.rejected, (state, action) => {
        state.error = action.payload || 'Error loading deductions';
        state.loading = false;
      });

    // Load Pending Deductions
    builder
      .addCase(loadPendingDeductions.pending, (state) => {
        state.error = null;
      })
      .addCase(loadPendingDeductions.fulfilled, (state, action) => {
        state.pendingDeductions = action.payload;
      })
      .addCase(loadPendingDeductions.rejected, (state, action) => {
        state.error = action.payload || 'Error loading pending deductions';
      });

    // Get Deduction By ID
    builder.addCase(getNonSalesDeductionById.fulfilled, (state, action) => {
      state.selectedDeduction = action.payload;
    });

    // Create Deduction
    builder.addCase(createNonSalesDeduction.fulfilled, (state, action) => {
      state.deductions.unshift(action.payload);
      state.pendingDeductions.unshift(action.payload);
      state.pagination.total += 1;
      state.pagination.pages = Math.ceil(state.pagination.total / state.pagination.limit);
    });

    // Approve Deduction
    builder.addCase(approveNonSalesDeduction.fulfilled, (state, action) => {
      // Update in deductions list
      const deductionIndex = state.deductions.findIndex((d) => d.id === action.payload.id);
      if (deductionIndex >= 0) {
        state.deductions[deductionIndex] = action.payload;
      }

      // Remove from pending list
      state.pendingDeductions = state.pendingDeductions.filter((d) => d.id !== action.payload.id);

      // Update selected if it's the same one
      if (state.selectedDeduction?.id === action.payload.id) {
        state.selectedDeduction = action.payload;
      }
    });

    // Reject Deduction
    builder.addCase(rejectNonSalesDeduction.fulfilled, (state, action) => {
      // Update in deductions list
      const deductionIndex = state.deductions.findIndex((d) => d.id === action.payload.id);
      if (deductionIndex >= 0) {
        state.deductions[deductionIndex] = action.payload;
      }

      // Remove from pending list
      state.pendingDeductions = state.pendingDeductions.filter((d) => d.id !== action.payload.id);

      // Update selected if it's the same one
      if (state.selectedDeduction?.id === action.payload.id) {
        state.selectedDeduction = action.payload;
      }
    });
  },
});

export const {
  setSelectedDeduction,
  setFilters,
  setPage,
  setLimit,
  clearDeductions,
  clearError,
} = nonSalesDeductionSlice.actions;

export default nonSalesDeductionSlice.reducer;
