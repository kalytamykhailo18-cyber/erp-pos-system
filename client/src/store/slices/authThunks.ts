// Additional auth thunks for user profile and password management
import { createAsyncThunk } from '@reduxjs/toolkit';
import type { User } from '../../types';
import { authService } from '../../services/api';
import { userService } from '../../services/api/user.service';
import { startLoading, stopLoading, showToast } from './uiSlice';

export const updateProfile = createAsyncThunk<
  User,
  { first_name?: string; last_name?: string; email?: string },
  { rejectValue: string }
>(
  'auth/updateProfile',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Guardando cambios...'));
      const response = await userService.updateProfile(data);

      if (!response.success) {
        throw new Error(response.error || 'Error al actualizar perfil');
      }

      dispatch(showToast({
        type: 'success',
        message: 'Perfil actualizado correctamente',
      }));

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar perfil';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const changePassword = createAsyncThunk<
  void,
  { currentPassword: string; newPassword: string },
  { rejectValue: string }
>(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Cambiando contraseña...'));
      const response = await authService.changePassword(currentPassword, newPassword);

      if (!response.success) {
        throw new Error(response.error || 'Error al cambiar contraseña');
      }

      dispatch(showToast({
        type: 'success',
        message: 'Contraseña cambiada correctamente. Todas las demás sesiones se han cerrado.',
      }));

      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cambiar contraseña';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);
