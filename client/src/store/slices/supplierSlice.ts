import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { UUID } from '../../types';
import {
  supplierService,
  Supplier,
  PurchaseOrder,
  CreateSupplierData,
  UpdateSupplierData,
  CreatePurchaseOrderData,
  UpdatePurchaseOrderData,
  ReceivePurchaseOrderData,
} from '../../services/api/supplier.service';
import { startLoading, stopLoading, showToast } from './uiSlice';

interface SupplierState {
  suppliers: Supplier[];
  currentSupplier: Supplier | null;
  purchaseOrders: PurchaseOrder[];
  currentPurchaseOrder: PurchaseOrder | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const initialState: SupplierState = {
  suppliers: [],
  currentSupplier: null,
  purchaseOrders: [],
  currentPurchaseOrder: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
  },
};

// Supplier Async Thunks
export const loadSuppliers = createAsyncThunk<
  { suppliers: Supplier[]; total: number },
  {
    page?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  } | void,
  { rejectValue: string }
>(
  'supplier/loadSuppliers',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await supplierService.getAll(params || {});

      if (!response.success) {
        throw new Error('Failed to load suppliers');
      }

      return {
        suppliers: response.data,
        total: response.pagination?.total_items || response.data.length,
      };
    } catch (error) {
      return rejectWithValue('Error al cargar proveedores');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadSupplier = createAsyncThunk<
  Supplier,
  UUID,
  { rejectValue: string }
>(
  'supplier/loadSupplier',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await supplierService.getById(id);

      if (!response.success) {
        throw new Error('Failed to load supplier');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error al cargar proveedor');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const createSupplier = createAsyncThunk<
  Supplier,
  CreateSupplierData,
  { rejectValue: string }
>(
  'supplier/createSupplier',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await supplierService.create(data);

      if (!response.success) {
        throw new Error('Failed to create supplier');
      }

      dispatch(showToast({ message: 'Proveedor creado exitosamente', type: 'success' }));
      return response.data;
    } catch (error) {
      dispatch(showToast({ message: 'Error al crear proveedor', type: 'error' }));
      return rejectWithValue('Error al crear proveedor');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const updateSupplier = createAsyncThunk<
  Supplier,
  { id: UUID; data: UpdateSupplierData },
  { rejectValue: string }
>(
  'supplier/updateSupplier',
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await supplierService.update(id, data);

      if (!response.success) {
        throw new Error('Failed to update supplier');
      }

      dispatch(showToast({ message: 'Proveedor actualizado exitosamente', type: 'success' }));
      return response.data;
    } catch (error) {
      dispatch(showToast({ message: 'Error al actualizar proveedor', type: 'error' }));
      return rejectWithValue('Error al actualizar proveedor');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const deactivateSupplier = createAsyncThunk<
  UUID,
  UUID,
  { rejectValue: string }
>(
  'supplier/deactivateSupplier',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await supplierService.deactivate(id);

      if (!response.success) {
        throw new Error('Failed to deactivate supplier');
      }

      dispatch(showToast({ message: 'Proveedor desactivado', type: 'success' }));
      return id;
    } catch (error) {
      dispatch(showToast({ message: 'Error al desactivar proveedor', type: 'error' }));
      return rejectWithValue('Error al desactivar proveedor');
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Purchase Order Async Thunks
export const loadPurchaseOrders = createAsyncThunk<
  { orders: PurchaseOrder[]; total: number },
  {
    page?: number;
    limit?: number;
    supplier_id?: UUID;
    branch_id?: UUID;
    status?: PurchaseOrder['status'];
  } | void,
  { rejectValue: string }
>(
  'supplier/loadPurchaseOrders',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await supplierService.getPurchaseOrders(params || {});

      if (!response.success) {
        throw new Error('Failed to load purchase orders');
      }

      return {
        orders: response.data,
        total: response.pagination?.total_items || response.data.length,
      };
    } catch (error) {
      return rejectWithValue('Error al cargar órdenes de compra');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadPurchaseOrder = createAsyncThunk<
  PurchaseOrder,
  UUID,
  { rejectValue: string }
>(
  'supplier/loadPurchaseOrder',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await supplierService.getPurchaseOrderById(id);

      if (!response.success) {
        throw new Error('Failed to load purchase order');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error al cargar orden de compra');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const createPurchaseOrder = createAsyncThunk<
  PurchaseOrder,
  CreatePurchaseOrderData,
  { rejectValue: string }
>(
  'supplier/createPurchaseOrder',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await supplierService.createPurchaseOrder(data);

      if (!response.success) {
        throw new Error('Failed to create purchase order');
      }

      dispatch(showToast({ message: 'Orden de compra creada exitosamente', type: 'success' }));
      return response.data;
    } catch (error) {
      dispatch(showToast({ message: 'Error al crear orden de compra', type: 'error' }));
      return rejectWithValue('Error al crear orden de compra');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const updatePurchaseOrder = createAsyncThunk<
  PurchaseOrder,
  { id: UUID; data: UpdatePurchaseOrderData },
  { rejectValue: string }
>(
  'supplier/updatePurchaseOrder',
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await supplierService.updatePurchaseOrder(id, data);

      if (!response.success) {
        throw new Error('Failed to update purchase order');
      }

      dispatch(showToast({ message: 'Orden de compra actualizada', type: 'success' }));
      return response.data;
    } catch (error) {
      dispatch(showToast({ message: 'Error al actualizar orden de compra', type: 'error' }));
      return rejectWithValue('Error al actualizar orden de compra');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const submitPurchaseOrder = createAsyncThunk<
  PurchaseOrder,
  UUID,
  { rejectValue: string }
>(
  'supplier/submitPurchaseOrder',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await supplierService.submitPurchaseOrder(id);

      if (!response.success) {
        throw new Error('Failed to submit purchase order');
      }

      dispatch(showToast({ message: 'Orden enviada para aprobación', type: 'success' }));
      return response.data;
    } catch (error) {
      dispatch(showToast({ message: 'Error al enviar orden', type: 'error' }));
      return rejectWithValue('Error al enviar orden');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const approvePurchaseOrder = createAsyncThunk<
  PurchaseOrder,
  UUID,
  { rejectValue: string }
>(
  'supplier/approvePurchaseOrder',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await supplierService.approvePurchaseOrder(id);

      if (!response.success) {
        throw new Error('Failed to approve purchase order');
      }

      dispatch(showToast({ message: 'Orden aprobada', type: 'success' }));
      return response.data;
    } catch (error) {
      dispatch(showToast({ message: 'Error al aprobar orden', type: 'error' }));
      return rejectWithValue('Error al aprobar orden');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const receivePurchaseOrder = createAsyncThunk<
  PurchaseOrder,
  { id: UUID; data: ReceivePurchaseOrderData },
  { rejectValue: string }
>(
  'supplier/receivePurchaseOrder',
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await supplierService.receivePurchaseOrder(id, data);

      if (!response.success) {
        throw new Error('Failed to receive purchase order');
      }

      dispatch(showToast({ message: 'Recepción registrada exitosamente', type: 'success' }));
      return response.data;
    } catch (error) {
      dispatch(showToast({ message: 'Error al registrar recepción', type: 'error' }));
      return rejectWithValue('Error al registrar recepción');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const cancelPurchaseOrder = createAsyncThunk<
  UUID,
  { id: UUID; reason?: string },
  { rejectValue: string }
>(
  'supplier/cancelPurchaseOrder',
  async ({ id, reason }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await supplierService.cancelPurchaseOrder(id, reason);

      if (!response.success) {
        throw new Error('Failed to cancel purchase order');
      }

      dispatch(showToast({ message: 'Orden cancelada', type: 'success' }));
      return id;
    } catch (error) {
      dispatch(showToast({ message: 'Error al cancelar orden', type: 'error' }));
      return rejectWithValue('Error al cancelar orden');
    } finally {
      dispatch(stopLoading());
    }
  }
);

const supplierSlice = createSlice({
  name: 'supplier',
  initialState,
  reducers: {
    setCurrentSupplier: (state, action: PayloadAction<Supplier | null>) => {
      state.currentSupplier = action.payload;
    },

    setCurrentPurchaseOrder: (state, action: PayloadAction<PurchaseOrder | null>) => {
      state.currentPurchaseOrder = action.payload;
    },

    clearSupplierState: (state) => {
      state.suppliers = [];
      state.currentSupplier = null;
      state.purchaseOrders = [];
      state.currentPurchaseOrder = null;
      state.error = null;
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    // Load Suppliers
    builder
      .addCase(loadSuppliers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadSuppliers.fulfilled, (state, action) => {
        state.suppliers = action.payload.suppliers;
        state.pagination.total = action.payload.total;
        state.loading = false;
      })
      .addCase(loadSuppliers.rejected, (state, action) => {
        state.error = action.payload || 'Error loading suppliers';
        state.loading = false;
      });

    // Load Supplier
    builder.addCase(loadSupplier.fulfilled, (state, action) => {
      state.currentSupplier = action.payload;
    });

    // Create Supplier
    builder.addCase(createSupplier.fulfilled, (state, action) => {
      state.suppliers.push(action.payload);
      state.currentSupplier = action.payload;
    });

    // Update Supplier
    builder.addCase(updateSupplier.fulfilled, (state, action) => {
      const index = state.suppliers.findIndex((s) => s.id === action.payload.id);
      if (index >= 0) {
        state.suppliers[index] = action.payload;
      }
      if (state.currentSupplier?.id === action.payload.id) {
        state.currentSupplier = action.payload;
      }
    });

    // Deactivate Supplier
    builder.addCase(deactivateSupplier.fulfilled, (state, action) => {
      const index = state.suppliers.findIndex((s) => s.id === action.payload);
      if (index >= 0) {
        state.suppliers[index].is_active = false;
      }
      if (state.currentSupplier?.id === action.payload) {
        state.currentSupplier.is_active = false;
      }
    });

    // Load Purchase Orders
    builder
      .addCase(loadPurchaseOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadPurchaseOrders.fulfilled, (state, action) => {
        state.purchaseOrders = action.payload.orders;
        state.pagination.total = action.payload.total;
        state.loading = false;
      })
      .addCase(loadPurchaseOrders.rejected, (state, action) => {
        state.error = action.payload || 'Error loading purchase orders';
        state.loading = false;
      });

    // Load Purchase Order
    builder.addCase(loadPurchaseOrder.fulfilled, (state, action) => {
      state.currentPurchaseOrder = action.payload;
    });

    // Create Purchase Order
    builder.addCase(createPurchaseOrder.fulfilled, (state, action) => {
      state.purchaseOrders.unshift(action.payload);
      state.currentPurchaseOrder = action.payload;
    });

    // Update Purchase Order
    builder.addCase(updatePurchaseOrder.fulfilled, (state, action) => {
      const index = state.purchaseOrders.findIndex((po) => po.id === action.payload.id);
      if (index >= 0) {
        state.purchaseOrders[index] = action.payload;
      }
      if (state.currentPurchaseOrder?.id === action.payload.id) {
        state.currentPurchaseOrder = action.payload;
      }
    });

    // Submit Purchase Order
    builder.addCase(submitPurchaseOrder.fulfilled, (state, action) => {
      const index = state.purchaseOrders.findIndex((po) => po.id === action.payload.id);
      if (index >= 0) {
        state.purchaseOrders[index] = action.payload;
      }
      if (state.currentPurchaseOrder?.id === action.payload.id) {
        state.currentPurchaseOrder = action.payload;
      }
    });

    // Approve Purchase Order
    builder.addCase(approvePurchaseOrder.fulfilled, (state, action) => {
      const index = state.purchaseOrders.findIndex((po) => po.id === action.payload.id);
      if (index >= 0) {
        state.purchaseOrders[index] = action.payload;
      }
      if (state.currentPurchaseOrder?.id === action.payload.id) {
        state.currentPurchaseOrder = action.payload;
      }
    });

    // Receive Purchase Order
    builder.addCase(receivePurchaseOrder.fulfilled, (state, action) => {
      const index = state.purchaseOrders.findIndex((po) => po.id === action.payload.id);
      if (index >= 0) {
        state.purchaseOrders[index] = action.payload;
      }
      if (state.currentPurchaseOrder?.id === action.payload.id) {
        state.currentPurchaseOrder = action.payload;
      }
    });

    // Cancel Purchase Order
    builder.addCase(cancelPurchaseOrder.fulfilled, (state, action) => {
      const index = state.purchaseOrders.findIndex((po) => po.id === action.payload);
      if (index >= 0) {
        state.purchaseOrders[index].status = 'CANCELLED';
      }
      if (state.currentPurchaseOrder?.id === action.payload) {
        state.currentPurchaseOrder.status = 'CANCELLED';
      }
    });
  },
});

export const {
  setCurrentSupplier,
  setCurrentPurchaseOrder,
  clearSupplierState,
  clearError,
} = supplierSlice.actions;

export default supplierSlice.reducer;
