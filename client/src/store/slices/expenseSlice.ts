import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
  Expense,
  ExpenseCategory,
  ExpenseFormData,
  ExpenseCategoryFormData,
  ExpenseStats,
  ExpenseStatus,
  UUID
} from '../../types';
import { expenseService } from '../../services/api';
import { startLoading, stopLoading, showToast } from './uiSlice';

interface ExpenseState {
  // Expenses
  expenses: Expense[];
  selectedExpense: Expense | null;

  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };

  // Categories
  categories: ExpenseCategory[];

  // Statistics
  stats: ExpenseStats | null;

  // Recurring expenses
  recurringExpenses: Expense[];

  // Filters
  filters: {
    from_date?: string;
    to_date?: string;
    category_id?: UUID;
    branch_id?: UUID;
    status?: ExpenseStatus;
    search?: string;
    page?: number;
    limit?: number;
  };

  // Loading states
  loading: boolean;
  error: string | null;
}

const initialState: ExpenseState = {
  expenses: [],
  selectedExpense: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  categories: [],
  stats: null,
  recurringExpenses: [],
  filters: {},
  loading: false,
  error: null,
};

// ==================== ASYNC THUNKS - EXPENSES ====================

interface LoadExpensesResult {
  expenses: Expense[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const loadExpenses = createAsyncThunk<
  LoadExpensesResult,
  {
    from_date?: string;
    to_date?: string;
    category_id?: UUID;
    branch_id?: UUID;
    status?: ExpenseStatus;
    search?: string;
    page?: number;
    limit?: number;
  } | void,
  { rejectValue: string }
>(
  'expense/loadExpenses',
  async (filters, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await expenseService.getAll(filters || undefined);

      if (!response.success) {
        throw new Error(response.error || 'Failed to load expenses');
      }

      return {
        expenses: response.data,
        pagination: {
          page: response.pagination?.page || 1,
          limit: response.pagination?.limit || 20,
          total: response.pagination?.total_items || 0,
          pages: response.pagination?.total_pages || 0,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error loading expenses';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadExpenseById = createAsyncThunk<
  Expense,
  UUID,
  { rejectValue: string }
>(
  'expense/loadExpenseById',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await expenseService.getById(id);

      if (!response.success) {
        throw new Error(response.error || 'Failed to load expense');
      }

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error loading expense';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const createExpense = createAsyncThunk<
  Expense,
  ExpenseFormData,
  { rejectValue: string }
>(
  'expense/createExpense',
  async (expenseData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Creando gasto...'));
      const response = await expenseService.create(expenseData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create expense');
      }

      dispatch(showToast({ type: 'success', message: 'Gasto creado exitosamente' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error creating expense';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const updateExpense = createAsyncThunk<
  Expense,
  { id: UUID; data: Partial<ExpenseFormData> },
  { rejectValue: string }
>(
  'expense/updateExpense',
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Actualizando gasto...'));
      const response = await expenseService.update(id, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update expense');
      }

      dispatch(showToast({ type: 'success', message: 'Gasto actualizado exitosamente' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error updating expense';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const deleteExpense = createAsyncThunk<
  UUID,
  UUID,
  { rejectValue: string }
>(
  'expense/deleteExpense',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Eliminando gasto...'));
      const response = await expenseService.delete(id);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete expense');
      }

      dispatch(showToast({ type: 'success', message: 'Gasto eliminado exitosamente' }));
      return id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error deleting expense';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const approveExpense = createAsyncThunk<
  Expense,
  UUID,
  { rejectValue: string }
>(
  'expense/approveExpense',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Aprobando gasto...'));
      const response = await expenseService.approve(id);

      if (!response.success) {
        throw new Error(response.error || 'Failed to approve expense');
      }

      dispatch(showToast({ type: 'success', message: 'Gasto aprobado exitosamente' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error approving expense';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const rejectExpense = createAsyncThunk<
  Expense,
  { id: UUID; reason: string },
  { rejectValue: string }
>(
  'expense/rejectExpense',
  async ({ id, reason }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Rechazando gasto...'));
      const response = await expenseService.reject(id, reason);

      if (!response.success) {
        throw new Error(response.error || 'Failed to reject expense');
      }

      dispatch(showToast({ type: 'success', message: 'Gasto rechazado exitosamente' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error rejecting expense';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const markExpenseAsPaid = createAsyncThunk<
  Expense,
  { id: UUID; paid_date?: string },
  { rejectValue: string }
>(
  'expense/markExpenseAsPaid',
  async ({ id, paid_date }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Marcando gasto como pagado...'));
      const response = await expenseService.markAsPaid(id, paid_date);

      if (!response.success) {
        throw new Error(response.error || 'Failed to mark expense as paid');
      }

      dispatch(showToast({ type: 'success', message: 'Gasto marcado como pagado exitosamente' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error marking expense as paid';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// ==================== ASYNC THUNKS - STATISTICS ====================

export const loadExpenseStats = createAsyncThunk<
  ExpenseStats,
  {
    from_date?: string;
    to_date?: string;
    branch_id?: UUID;
  } | void,
  { rejectValue: string }
>(
  'expense/loadExpenseStats',
  async (filters, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await expenseService.getStats(filters || undefined);

      if (!response.success) {
        throw new Error(response.error || 'Failed to load expense statistics');
      }

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error loading expense statistics';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// ==================== ASYNC THUNKS - RECURRING ====================

export const loadRecurringExpenses = createAsyncThunk<
  Expense[],
  void,
  { rejectValue: string }
>(
  'expense/loadRecurringExpenses',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await expenseService.getRecurring();

      if (!response.success) {
        throw new Error(response.error || 'Failed to load recurring expenses');
      }

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error loading recurring expenses';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const createRecurringInstance = createAsyncThunk<
  Expense,
  UUID,
  { rejectValue: string }
>(
  'expense/createRecurringInstance',
  async (parent_id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Creando instancia de gasto recurrente...'));
      const response = await expenseService.createRecurringInstance(parent_id);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create recurring instance');
      }

      dispatch(showToast({ type: 'success', message: 'Instancia de gasto recurrente creada exitosamente' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error creating recurring instance';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// ==================== ASYNC THUNKS - RECEIPTS ====================

export const uploadReceipt = createAsyncThunk<
  Expense,
  { id: UUID; receipt_url: string },
  { rejectValue: string }
>(
  'expense/uploadReceipt',
  async ({ id, receipt_url }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Subiendo recibo...'));
      const response = await expenseService.uploadReceipt(id, receipt_url);

      if (!response.success) {
        throw new Error(response.error || 'Failed to upload receipt');
      }

      dispatch(showToast({ type: 'success', message: 'Recibo subido exitosamente' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error uploading receipt';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// ==================== ASYNC THUNKS - CATEGORIES ====================

export const loadCategories = createAsyncThunk<
  ExpenseCategory[],
  { includeInactive?: boolean } | void,
  { rejectValue: string }
>(
  'expense/loadCategories',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await expenseService.getAllCategories(params?.includeInactive);

      if (!response.success) {
        throw new Error(response.error || 'Failed to load expense categories');
      }

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error loading expense categories';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadCategoryById = createAsyncThunk<
  ExpenseCategory,
  UUID,
  { rejectValue: string }
>(
  'expense/loadCategoryById',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await expenseService.getCategoryById(id);

      if (!response.success) {
        throw new Error(response.error || 'Failed to load expense category');
      }

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error loading expense category';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const createCategory = createAsyncThunk<
  ExpenseCategory,
  ExpenseCategoryFormData,
  { rejectValue: string }
>(
  'expense/createCategory',
  async (categoryData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Creando categoría de gasto...'));
      const response = await expenseService.createCategory(categoryData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create expense category');
      }

      dispatch(showToast({ type: 'success', message: 'Categoría de gasto creada exitosamente' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error creating expense category';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const updateCategory = createAsyncThunk<
  ExpenseCategory,
  { id: UUID; data: Partial<ExpenseCategoryFormData> },
  { rejectValue: string }
>(
  'expense/updateCategory',
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Actualizando categoría de gasto...'));
      const response = await expenseService.updateCategory(id, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update expense category');
      }

      dispatch(showToast({ type: 'success', message: 'Categoría de gasto actualizada exitosamente' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error updating expense category';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const deleteCategory = createAsyncThunk<
  UUID,
  UUID,
  { rejectValue: string }
>(
  'expense/deleteCategory',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Eliminando categoría de gasto...'));
      const response = await expenseService.deleteCategory(id);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete expense category');
      }

      dispatch(showToast({ type: 'success', message: 'Categoría de gasto eliminada exitosamente' }));
      return id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error deleting expense category';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// ==================== SLICE ====================

const expenseSlice = createSlice({
  name: 'expense',
  initialState,
  reducers: {
    setSelectedExpense: (state, action: PayloadAction<Expense | null>) => {
      state.selectedExpense = action.payload;
    },

    setFilters: (state, action: PayloadAction<ExpenseState['filters']>) => {
      state.filters = action.payload;
    },

    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },

    setLimit: (state, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1;
    },

    clearFilters: (state) => {
      state.filters = {};
      state.pagination.page = 1;
    },

    clearStats: (state) => {
      state.stats = null;
    },

    clearError: (state) => {
      state.error = null;
    },

    clearExpenses: (state) => {
      state.expenses = [];
      state.selectedExpense = null;
      state.categories = [];
      state.stats = null;
      state.recurringExpenses = [];
      state.filters = {};
    },
  },

  extraReducers: (builder) => {
    // ==================== EXPENSES ====================

    // Load Expenses
    builder
      .addCase(loadExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadExpenses.fulfilled, (state, action) => {
        state.expenses = action.payload.expenses;
        state.pagination = action.payload.pagination;
        state.loading = false;
      })
      .addCase(loadExpenses.rejected, (state, action) => {
        state.error = action.payload || 'Error loading expenses';
        state.loading = false;
      });

    // Load Expense By ID
    builder
      .addCase(loadExpenseById.fulfilled, (state, action) => {
        state.selectedExpense = action.payload;
      });

    // Create Expense
    builder
      .addCase(createExpense.fulfilled, (state, action) => {
        state.expenses.unshift(action.payload);
      });

    // Update Expense
    builder
      .addCase(updateExpense.fulfilled, (state, action) => {
        const index = state.expenses.findIndex((e) => e.id === action.payload.id);
        if (index >= 0) {
          state.expenses[index] = action.payload;
        }
        if (state.selectedExpense?.id === action.payload.id) {
          state.selectedExpense = action.payload;
        }
      });

    // Delete Expense
    builder
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.filter((e) => e.id !== action.payload);
        if (state.selectedExpense?.id === action.payload) {
          state.selectedExpense = null;
        }
      });

    // Approve Expense
    builder
      .addCase(approveExpense.fulfilled, (state, action) => {
        const index = state.expenses.findIndex((e) => e.id === action.payload.id);
        if (index >= 0) {
          state.expenses[index] = action.payload;
        }
        if (state.selectedExpense?.id === action.payload.id) {
          state.selectedExpense = action.payload;
        }
      });

    // Reject Expense
    builder
      .addCase(rejectExpense.fulfilled, (state, action) => {
        const index = state.expenses.findIndex((e) => e.id === action.payload.id);
        if (index >= 0) {
          state.expenses[index] = action.payload;
        }
        if (state.selectedExpense?.id === action.payload.id) {
          state.selectedExpense = action.payload;
        }
      });

    // Mark Expense As Paid
    builder
      .addCase(markExpenseAsPaid.fulfilled, (state, action) => {
        const index = state.expenses.findIndex((e) => e.id === action.payload.id);
        if (index >= 0) {
          state.expenses[index] = action.payload;
        }
        if (state.selectedExpense?.id === action.payload.id) {
          state.selectedExpense = action.payload;
        }
      });

    // ==================== STATISTICS ====================

    // Load Expense Stats
    builder
      .addCase(loadExpenseStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadExpenseStats.fulfilled, (state, action) => {
        state.stats = action.payload;
        state.loading = false;
      })
      .addCase(loadExpenseStats.rejected, (state, action) => {
        state.error = action.payload || 'Error loading expense statistics';
        state.loading = false;
      });

    // ==================== RECURRING ====================

    // Load Recurring Expenses
    builder
      .addCase(loadRecurringExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadRecurringExpenses.fulfilled, (state, action) => {
        state.recurringExpenses = action.payload;
        state.loading = false;
      })
      .addCase(loadRecurringExpenses.rejected, (state, action) => {
        state.error = action.payload || 'Error loading recurring expenses';
        state.loading = false;
      });

    // Create Recurring Instance
    builder
      .addCase(createRecurringInstance.fulfilled, (state, action) => {
        state.expenses.unshift(action.payload);
      });

    // ==================== RECEIPTS ====================

    // Upload Receipt
    builder
      .addCase(uploadReceipt.fulfilled, (state, action) => {
        const index = state.expenses.findIndex((e) => e.id === action.payload.id);
        if (index >= 0) {
          state.expenses[index] = action.payload;
        }
        if (state.selectedExpense?.id === action.payload.id) {
          state.selectedExpense = action.payload;
        }
      });

    // ==================== CATEGORIES ====================

    // Load Categories
    builder
      .addCase(loadCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
        state.loading = false;
      })
      .addCase(loadCategories.rejected, (state, action) => {
        state.error = action.payload || 'Error loading expense categories';
        state.loading = false;
      });

    // Load Category By ID (no state update needed, used for editing)
    builder
      .addCase(loadCategoryById.fulfilled, () => {
        // Category loaded for editing, could be added to a selectedCategory field if needed
      });

    // Create Category
    builder
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      });

    // Update Category
    builder
      .addCase(updateCategory.fulfilled, (state, action) => {
        const index = state.categories.findIndex((c) => c.id === action.payload.id);
        if (index >= 0) {
          state.categories[index] = action.payload;
        }
      });

    // Delete Category
    builder
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter((c) => c.id !== action.payload);
      });
  },
});

export const {
  setSelectedExpense,
  setFilters,
  setPage,
  setLimit,
  clearFilters,
  clearStats,
  clearError,
  clearExpenses,
} = expenseSlice.actions;

export default expenseSlice.reducer;
