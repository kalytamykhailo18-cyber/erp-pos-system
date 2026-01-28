import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import reportService from '../../services/api/report.service';
import type { OwnerDashboardData } from '../../types';
import { startLoading, stopLoading } from './uiSlice';

interface DashboardState {
  data: OwnerDashboardData | null;
  error: string | null;
}

const initialState: DashboardState = {
  data: null,
  error: null
};

export const fetchOwnerDashboard = createAsyncThunk(
  'dashboard/fetchOwnerDashboard',
  async (params: { start_date: string; end_date: string; branch_id?: string }, { dispatch }) => {
    dispatch(startLoading());
    try {
      const response = await reportService.getOwnerDashboard(params);
      if (!response.success) {
        throw new Error(response.error || 'Error al cargar el dashboard');
      }
      return response.data;
    } finally {
      dispatch(stopLoading());
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboard: (state) => {
      state.data = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOwnerDashboard.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchOwnerDashboard.fulfilled, (state, action: PayloadAction<OwnerDashboardData>) => {
        state.data = action.payload;
      })
      .addCase(fetchOwnerDashboard.rejected, (state, action) => {
        state.error = action.error.message || 'Error al cargar el dashboard';
      });
  }
});

export const { clearDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
