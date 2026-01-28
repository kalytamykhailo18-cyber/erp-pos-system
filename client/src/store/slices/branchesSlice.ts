import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Branch, UUID } from '../../types';
import branchService, { CreateBranchData, UpdateBranchData } from '../../services/api/branch.service';
import { startLoading, stopLoading, showToast } from './uiSlice';

interface BranchesState {
  branches: Branch[];
  selectedBranch: Branch | null;
  loading: boolean;
  error: string | null;
}

const initialState: BranchesState = {
  branches: [],
  selectedBranch: null,
  loading: false,
  error: null,
};

// Async Thunks
export const loadBranches = createAsyncThunk<
  Branch[],
  { is_active?: string; search?: string } | void,
  { rejectValue: string }
>(
  'branches/loadBranches',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await branchService.getAll(params || undefined);

      if (!response.success) {
        throw new Error(response.error || 'Error al cargar sucursales');
      }

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar sucursales';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const createBranch = createAsyncThunk<
  Branch,
  CreateBranchData,
  { rejectValue: string }
>(
  'branches/createBranch',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Creando sucursal...'));
      const response = await branchService.create(data);

      if (!response.success) {
        throw new Error(response.error || 'Error al crear sucursal');
      }

      dispatch(showToast({
        type: 'success',
        message: `Sucursal "${response.data.name}" creada correctamente`,
      }));

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear sucursal';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const updateBranch = createAsyncThunk<
  Branch,
  { id: UUID; data: UpdateBranchData },
  { rejectValue: string }
>(
  'branches/updateBranch',
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Actualizando sucursal...'));
      const response = await branchService.update(id, data);

      if (!response.success) {
        throw new Error(response.error || 'Error al actualizar sucursal');
      }

      dispatch(showToast({
        type: 'success',
        message: 'Sucursal actualizada correctamente',
      }));

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar sucursal';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const deactivateBranch = createAsyncThunk<
  UUID,
  UUID,
  { rejectValue: string }
>(
  'branches/deactivateBranch',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Desactivando sucursal...'));
      const response = await branchService.deactivate(id);

      if (!response.success) {
        throw new Error(response.error || 'Error al desactivar sucursal');
      }

      dispatch(showToast({
        type: 'success',
        message: 'Sucursal desactivada correctamente',
      }));

      return id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al desactivar sucursal';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

const branchesSlice = createSlice({
  name: 'branches',
  initialState,
  reducers: {
    setSelectedBranch: (state, action: PayloadAction<Branch | null>) => {
      state.selectedBranch = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Load Branches
    builder
      .addCase(loadBranches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadBranches.fulfilled, (state, action) => {
        state.branches = action.payload;
        state.loading = false;
      })
      .addCase(loadBranches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error al cargar sucursales';
      });

    // Create Branch
    builder
      .addCase(createBranch.fulfilled, (state, action) => {
        state.branches.push(action.payload);
        state.error = null;
      })
      .addCase(createBranch.rejected, (state, action) => {
        state.error = action.payload || 'Error al crear sucursal';
      });

    // Update Branch
    builder
      .addCase(updateBranch.fulfilled, (state, action) => {
        const index = state.branches.findIndex(b => b.id === action.payload.id);
        if (index !== -1) {
          state.branches[index] = action.payload;
        }
        if (state.selectedBranch?.id === action.payload.id) {
          state.selectedBranch = action.payload;
        }
        state.error = null;
      })
      .addCase(updateBranch.rejected, (state, action) => {
        state.error = action.payload || 'Error al actualizar sucursal';
      });

    // Deactivate Branch
    builder
      .addCase(deactivateBranch.fulfilled, (state, action) => {
        const index = state.branches.findIndex(b => b.id === action.payload);
        if (index !== -1) {
          state.branches[index].is_active = false;
        }
        state.error = null;
      })
      .addCase(deactivateBranch.rejected, (state, action) => {
        state.error = action.payload || 'Error al desactivar sucursal';
      });
  },
});

export const { setSelectedBranch, clearError } = branchesSlice.actions;
export default branchesSlice.reducer;
