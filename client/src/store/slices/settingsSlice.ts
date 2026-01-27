import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import settingsService, { SystemSettingsData, UpdateSystemSettingsData } from '../../services/api/settings.service';
import { startLoading, stopLoading, showToast } from './uiSlice';

interface SettingsState {
  settings: SystemSettingsData | null;
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  settings: null,
  loading: false,
  error: null,
};

// Async Thunks

export const fetchSettings = createAsyncThunk<
  SystemSettingsData,
  void,
  { rejectValue: string }
>(
  'settings/fetchSettings',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Cargando configuracion...'));
      const response = await settingsService.get();

      if (!response.success) {
        throw new Error(response.error || 'Error al cargar configuracion');
      }

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar configuracion';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const updateSettings = createAsyncThunk<
  SystemSettingsData,
  UpdateSystemSettingsData,
  { rejectValue: string }
>(
  'settings/updateSettings',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Guardando configuracion...'));
      const response = await settingsService.update(data);

      if (!response.success) {
        throw new Error(response.error || 'Error al guardar configuracion');
      }

      dispatch(showToast({
        type: 'success',
        message: 'Configuracion guardada correctamente',
      }));

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al guardar configuracion';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Slice

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Settings
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error al cargar configuracion';
      });

    // Update Settings
    builder
      .addCase(updateSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error al guardar configuracion';
      });
  },
});

export const { clearError } = settingsSlice.actions;
export default settingsSlice.reducer;
