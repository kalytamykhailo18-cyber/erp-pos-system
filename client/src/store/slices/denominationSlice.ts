import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
  DenominationConfig,
  DenominationConfigFormData,
  UUID
} from '../../types';
import { denominationService } from '../../services/api';
import { startLoading, stopLoading, showToast } from './uiSlice';

interface DenominationState {
  denominations: DenominationConfig[];
  selectedDenomination: DenominationConfig | null;
  loading: boolean;
  error: string | null;
}

const initialState: DenominationState = {
  denominations: [],
  selectedDenomination: null,
  loading: false,
  error: null,
};

// ==================== ASYNC THUNKS ====================

/**
 * PART 16: Load all bill denominations
 */
export const loadDenominations = createAsyncThunk<
  DenominationConfig[],
  { includeInactive?: boolean } | void,
  { rejectValue: string }
>(
  'denomination/loadDenominations',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await denominationService.getAllDenominations(params?.includeInactive);

      if (!response.success) {
        throw new Error(response.error || 'Failed to load denominations');
      }

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error loading denominations';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

/**
 * PART 16: Load denomination by ID
 */
export const loadDenominationById = createAsyncThunk<
  DenominationConfig,
  UUID,
  { rejectValue: string }
>(
  'denomination/loadDenominationById',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await denominationService.getDenominationById(id);

      if (!response.success) {
        throw new Error(response.error || 'Failed to load denomination');
      }

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error loading denomination';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

/**
 * PART 16: Create new denomination
 */
export const createDenomination = createAsyncThunk<
  DenominationConfig,
  DenominationConfigFormData,
  { rejectValue: string }
>(
  'denomination/createDenomination',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Creando denominación...'));
      const response = await denominationService.createDenomination(data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create denomination');
      }

      dispatch(showToast({ type: 'success', message: 'Denominación creada exitosamente' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error creating denomination';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

/**
 * PART 16: Update denomination
 */
export const updateDenomination = createAsyncThunk<
  DenominationConfig,
  { id: UUID; data: Partial<DenominationConfigFormData> },
  { rejectValue: string }
>(
  'denomination/updateDenomination',
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Actualizando denominación...'));
      const response = await denominationService.updateDenomination(id, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update denomination');
      }

      dispatch(showToast({ type: 'success', message: 'Denominación actualizada exitosamente' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error updating denomination';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

/**
 * PART 16: Delete (deactivate) denomination
 */
export const deleteDenomination = createAsyncThunk<
  UUID,
  UUID,
  { rejectValue: string }
>(
  'denomination/deleteDenomination',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Desactivando denominación...'));
      const response = await denominationService.deleteDenomination(id);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete denomination');
      }

      dispatch(showToast({ type: 'success', message: 'Denominación desactivada exitosamente' }));
      return id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error deleting denomination';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

/**
 * PART 16: Reorder denominations
 */
export const reorderDenominations = createAsyncThunk<
  DenominationConfig[],
  Array<{ id: UUID; display_order: number }>,
  { rejectValue: string }
>(
  'denomination/reorderDenominations',
  async (denominations, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Reordenando denominaciones...'));
      const response = await denominationService.reorderDenominations(denominations);

      if (!response.success) {
        throw new Error(response.error || 'Failed to reorder denominations');
      }

      dispatch(showToast({ type: 'success', message: 'Denominaciones reordenadas exitosamente' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error reordering denominations';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// ==================== SLICE ====================

const denominationSlice = createSlice({
  name: 'denomination',
  initialState,
  reducers: {
    setSelectedDenomination: (state, action: PayloadAction<DenominationConfig | null>) => {
      state.selectedDenomination = action.payload;
    },
    clearDenominationError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Load all denominations
      .addCase(loadDenominations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadDenominations.fulfilled, (state, action) => {
        state.loading = false;
        state.denominations = action.payload;
      })
      .addCase(loadDenominations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load denominations';
      })

      // Load denomination by ID
      .addCase(loadDenominationById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadDenominationById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedDenomination = action.payload;
      })
      .addCase(loadDenominationById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load denomination';
      })

      // Create denomination
      .addCase(createDenomination.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDenomination.fulfilled, (state, action) => {
        state.loading = false;
        state.denominations.push(action.payload);
        // Re-sort by display_order
        state.denominations.sort((a, b) => a.display_order - b.display_order);
      })
      .addCase(createDenomination.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create denomination';
      })

      // Update denomination
      .addCase(updateDenomination.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDenomination.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.denominations.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) {
          state.denominations[index] = action.payload;
          // Re-sort by display_order
          state.denominations.sort((a, b) => a.display_order - b.display_order);
        }
        if (state.selectedDenomination?.id === action.payload.id) {
          state.selectedDenomination = action.payload;
        }
      })
      .addCase(updateDenomination.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update denomination';
      })

      // Delete denomination
      .addCase(deleteDenomination.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDenomination.fulfilled, (state, action) => {
        state.loading = false;
        // Mark as inactive instead of removing
        const index = state.denominations.findIndex((d) => d.id === action.payload);
        if (index !== -1) {
          state.denominations[index].is_active = false;
        }
      })
      .addCase(deleteDenomination.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete denomination';
      })

      // Reorder denominations
      .addCase(reorderDenominations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reorderDenominations.fulfilled, (state, action) => {
        state.loading = false;
        // Update denominations with new order
        action.payload.forEach((updated) => {
          const index = state.denominations.findIndex((d) => d.id === updated.id);
          if (index !== -1) {
            state.denominations[index] = updated;
          }
        });
        // Re-sort by display_order
        state.denominations.sort((a, b) => a.display_order - b.display_order);
      })
      .addCase(reorderDenominations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to reorder denominations';
      });
  }
});

export const { setSelectedDenomination, clearDenominationError } = denominationSlice.actions;
export default denominationSlice.reducer;
