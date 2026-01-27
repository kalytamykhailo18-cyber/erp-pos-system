import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { userService, type CreateUserData, type UpdateUserData, type UserListParams } from '../../services/api/user.service';
import { startLoading, stopLoading, showToast } from './uiSlice';
import type { User } from '../../types';

interface UsersState {
  users: User[];
  currentUser: User | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: UserListParams;
  error: string | null;
}

const initialState: UsersState = {
  users: [],
  currentUser: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  filters: {
    page: 1,
    limit: 20,
  },
  error: null,
};

// Async Thunks

export const fetchUsers = createAsyncThunk<
  { users: User[]; pagination: { page: number; limit: number; total: number; pages: number } },
  UserListParams | undefined,
  { rejectValue: string }
>(
  'users/fetchUsers',
  async (params = {}, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Cargando usuarios...'));
      const response = await userService.getAll(params) as any;

      if (!response.success) {
        throw new Error(response.error || 'Error al cargar usuarios');
      }

      // Handle both response formats:
      // Format 1: { data: { users, pagination } }
      // Format 2: { data: [users], pagination } (current backend format)
      const users = Array.isArray(response.data) ? response.data : response.data?.users || [];
      const pagination = response.pagination || response.data?.pagination || { page: 1, limit: 20, total_items: 0, total_pages: 0 };

      return { users, pagination };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar usuarios';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const fetchUserById = createAsyncThunk<
  User,
  string,
  { rejectValue: string }
>(
  'users/fetchUserById',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Cargando usuario...'));
      const response = await userService.getById(id);

      if (!response.success) {
        throw new Error(response.error || 'Error al cargar usuario');
      }

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar usuario';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const createUser = createAsyncThunk<
  User,
  CreateUserData,
  { rejectValue: string }
>(
  'users/createUser',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Creando usuario...'));
      const response = await userService.create(data);

      if (!response.success) {
        throw new Error(response.error || 'Error al crear usuario');
      }

      dispatch(showToast({
        type: 'success',
        message: 'Usuario creado correctamente',
      }));

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear usuario';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const updateUser = createAsyncThunk<
  User,
  { id: string; data: UpdateUserData },
  { rejectValue: string }
>(
  'users/updateUser',
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Actualizando usuario...'));
      const response = await userService.update(id, data);

      if (!response.success) {
        throw new Error(response.error || 'Error al actualizar usuario');
      }

      dispatch(showToast({
        type: 'success',
        message: 'Usuario actualizado correctamente',
      }));

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar usuario';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const deactivateUser = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'users/deactivateUser',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Desactivando usuario...'));
      const response = await userService.deactivate(id);

      if (!response.success) {
        throw new Error(response.error || 'Error al desactivar usuario');
      }

      dispatch(showToast({
        type: 'success',
        message: 'Usuario desactivado correctamente',
      }));

      return id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al desactivar usuario';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const unlockUser = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'users/unlockUser',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Desbloqueando usuario...'));
      const response = await userService.unlock(id);

      if (!response.success) {
        throw new Error(response.error || 'Error al desbloquear usuario');
      }

      dispatch(showToast({
        type: 'success',
        message: 'Usuario desbloqueado correctamente',
      }));

      return id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al desbloquear usuario';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const resetUserPassword = createAsyncThunk<
  string,
  { id: string; newPassword: string },
  { rejectValue: string }
>(
  'users/resetPassword',
  async ({ id, newPassword }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Restableciendo contraseña...'));
      const response = await userService.resetPassword(id, newPassword);

      if (!response.success) {
        throw new Error(response.error || 'Error al restablecer contraseña');
      }

      dispatch(showToast({
        type: 'success',
        message: 'Contraseña restablecida correctamente',
      }));

      return id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al restablecer contraseña';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Slice

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<UserListParams>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearCurrentUser: (state) => {
      state.currentUser = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Users
    builder
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.users = action.payload.users;
        // Map backend pagination format to frontend format
        const p = action.payload.pagination as any;
        state.pagination = {
          page: p.page,
          limit: p.limit,
          total: p.total_items ?? p.total ?? 0,
          pages: p.total_pages ?? p.pages ?? 0,
        };
        state.error = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.error = action.payload || 'Error al cargar usuarios';
      });

    // Fetch User By ID
    builder
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.currentUser = action.payload;
        state.error = null;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.error = action.payload || 'Error al cargar usuario';
      });

    // Create User
    builder
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.unshift(action.payload);
        state.pagination.total += 1;
        state.error = null;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.error = action.payload || 'Error al crear usuario';
      });

    // Update User
    builder
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.currentUser?.id === action.payload.id) {
          state.currentUser = action.payload;
        }
        state.error = null;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.error = action.payload || 'Error al actualizar usuario';
      });

    // Deactivate User
    builder
      .addCase(deactivateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u.id === action.payload);
        if (index !== -1) {
          state.users[index].is_active = false;
        }
        state.error = null;
      })
      .addCase(deactivateUser.rejected, (state, action) => {
        state.error = action.payload || 'Error al desactivar usuario';
      });

    // Unlock User
    builder
      .addCase(unlockUser.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u.id === action.payload);
        if (index !== -1) {
          state.users[index].locked_until = null;
          state.users[index].failed_login_attempts = 0;
        }
        state.error = null;
      })
      .addCase(unlockUser.rejected, (state, action) => {
        state.error = action.payload || 'Error al desbloquear usuario';
      });
  },
});

export const { setFilters, clearCurrentUser, clearError } = usersSlice.actions;
export default usersSlice.reducer;
