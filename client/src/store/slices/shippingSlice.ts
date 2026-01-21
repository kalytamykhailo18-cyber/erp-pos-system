import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
  ShippingZone,
  NeighborhoodMapping,
  SaleShipping,
  ShippingCalculation,
  ShippingZoneFormData,
  NeighborhoodMappingFormData,
  ShippingCalculationRequest,
  CreateSaleShippingRequest,
  DeliveryStatus,
  UUID
} from '../../types';
import { shippingService } from '../../services/api';
import { startLoading, stopLoading, showToast } from './uiSlice';

interface ShippingState {
  // Zones
  zones: ShippingZone[];
  selectedZone: ShippingZone | null;

  // Neighborhoods
  neighborhoods: NeighborhoodMapping[];

  // Calculation
  calculation: ShippingCalculation | null;

  // Shipments
  shipments: SaleShipping[];
  selectedShipment: SaleShipping | null;

  // Loading states
  loading: boolean;
  error: string | null;
}

const initialState: ShippingState = {
  zones: [],
  selectedZone: null,
  neighborhoods: [],
  calculation: null,
  shipments: [],
  selectedShipment: null,
  loading: false,
  error: null,
};

// ==================== ASYNC THUNKS - ZONES ====================

export const loadZones = createAsyncThunk<
  ShippingZone[],
  { includeInactive?: boolean } | void,
  { rejectValue: string }
>(
  'shipping/loadZones',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await shippingService.getAllZones(params?.includeInactive);

      if (!response.success) {
        throw new Error(response.error || 'Failed to load shipping zones');
      }

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error loading shipping zones';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadZoneById = createAsyncThunk<
  ShippingZone,
  UUID,
  { rejectValue: string }
>(
  'shipping/loadZoneById',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await shippingService.getZoneById(id);

      if (!response.success) {
        throw new Error(response.error || 'Failed to load shipping zone');
      }

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error loading shipping zone';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const createZone = createAsyncThunk<
  ShippingZone,
  ShippingZoneFormData,
  { rejectValue: string }
>(
  'shipping/createZone',
  async (zoneData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Creando zona de envío...'));
      const response = await shippingService.createZone(zoneData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create shipping zone');
      }

      dispatch(showToast({ type: 'success', message: 'Zona de envío creada exitosamente' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error creating shipping zone';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const updateZone = createAsyncThunk<
  ShippingZone,
  { id: UUID; data: Partial<ShippingZoneFormData> },
  { rejectValue: string }
>(
  'shipping/updateZone',
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Actualizando zona de envío...'));
      const response = await shippingService.updateZone(id, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update shipping zone');
      }

      dispatch(showToast({ type: 'success', message: 'Zona de envío actualizada exitosamente' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error updating shipping zone';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const deleteZone = createAsyncThunk<
  UUID,
  UUID,
  { rejectValue: string }
>(
  'shipping/deleteZone',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Eliminando zona de envío...'));
      const response = await shippingService.deleteZone(id);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete shipping zone');
      }

      dispatch(showToast({ type: 'success', message: 'Zona de envío eliminada exitosamente' }));
      return id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error deleting shipping zone';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// ==================== ASYNC THUNKS - NEIGHBORHOODS ====================

export const loadNeighborhoods = createAsyncThunk<
  NeighborhoodMapping[],
  { zoneId?: UUID } | void,
  { rejectValue: string }
>(
  'shipping/loadNeighborhoods',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await shippingService.getAllNeighborhoods(params?.zoneId);

      if (!response.success) {
        throw new Error(response.error || 'Failed to load neighborhood mappings');
      }

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error loading neighborhood mappings';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const createNeighborhood = createAsyncThunk<
  NeighborhoodMapping,
  NeighborhoodMappingFormData,
  { rejectValue: string }
>(
  'shipping/createNeighborhood',
  async (mappingData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Creando mapeo de barrio...'));
      const response = await shippingService.createNeighborhood(mappingData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create neighborhood mapping');
      }

      dispatch(showToast({ type: 'success', message: 'Mapeo de barrio creado exitosamente' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error creating neighborhood mapping';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const updateNeighborhood = createAsyncThunk<
  NeighborhoodMapping,
  { id: UUID; data: Partial<NeighborhoodMappingFormData> },
  { rejectValue: string }
>(
  'shipping/updateNeighborhood',
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Actualizando mapeo de barrio...'));
      const response = await shippingService.updateNeighborhood(id, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update neighborhood mapping');
      }

      dispatch(showToast({ type: 'success', message: 'Mapeo de barrio actualizado exitosamente' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error updating neighborhood mapping';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const deleteNeighborhood = createAsyncThunk<
  UUID,
  UUID,
  { rejectValue: string }
>(
  'shipping/deleteNeighborhood',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Eliminando mapeo de barrio...'));
      const response = await shippingService.deleteNeighborhood(id);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete neighborhood mapping');
      }

      dispatch(showToast({ type: 'success', message: 'Mapeo de barrio eliminado exitosamente' }));
      return id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error deleting neighborhood mapping';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// ==================== ASYNC THUNKS - CALCULATION ====================

export const calculateShipping = createAsyncThunk<
  ShippingCalculation,
  ShippingCalculationRequest,
  { rejectValue: string }
>(
  'shipping/calculateShipping',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      const response = await shippingService.calculateShipping(params);

      if (!response.success) {
        throw new Error(response.error || 'Failed to calculate shipping');
      }

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error calculating shipping';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    }
  }
);

export const findZoneForLocation = createAsyncThunk<
  ShippingZone,
  { neighborhood: string; postalCode?: string },
  { rejectValue: string }
>(
  'shipping/findZoneForLocation',
  async ({ neighborhood, postalCode }, { rejectWithValue }) => {
    try {
      const response = await shippingService.findZoneForLocation(neighborhood, postalCode);

      if (!response.success) {
        throw new Error(response.error || 'Failed to find shipping zone');
      }

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error finding shipping zone';
      return rejectWithValue(message);
    }
  }
);

// ==================== ASYNC THUNKS - SALE SHIPPING ====================

export const createSaleShipping = createAsyncThunk<
  SaleShipping,
  { saleId: UUID; data: CreateSaleShippingRequest },
  { rejectValue: string }
>(
  'shipping/createSaleShipping',
  async ({ saleId, data }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Creando registro de envío...'));
      const response = await shippingService.createSaleShipping(saleId, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create sale shipping');
      }

      dispatch(showToast({ type: 'success', message: 'Registro de envío creado exitosamente' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error creating sale shipping';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadShippingBySaleId = createAsyncThunk<
  SaleShipping | null,
  UUID,
  { rejectValue: string }
>(
  'shipping/loadShippingBySaleId',
  async (saleId, { rejectWithValue }) => {
    try {
      const response = await shippingService.getShippingBySaleId(saleId);

      if (!response.success) {
        throw new Error(response.error || 'Failed to load sale shipping');
      }

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error loading sale shipping';
      return rejectWithValue(message);
    }
  }
);

export const updateDeliveryStatus = createAsyncThunk<
  SaleShipping,
  { id: UUID; status: DeliveryStatus; signature?: string; photo?: string },
  { rejectValue: string }
>(
  'shipping/updateDeliveryStatus',
  async ({ id, status, signature, photo }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Actualizando estado de entrega...'));
      const response = await shippingService.updateDeliveryStatus(id, status, { signature, photo });

      if (!response.success) {
        throw new Error(response.error || 'Failed to update delivery status');
      }

      dispatch(showToast({ type: 'success', message: 'Estado de entrega actualizado exitosamente' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error updating delivery status';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// ==================== ASYNC THUNKS - SHIPMENTS ====================

export const loadShipments = createAsyncThunk<
  SaleShipping[],
  {
    status?: DeliveryStatus;
    zone_id?: UUID;
    customer_id?: UUID;
    from_date?: string;
    to_date?: string;
  } | void,
  { rejectValue: string }
>(
  'shipping/loadShipments',
  async (filters, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await shippingService.getAllShipments(filters || undefined);

      if (!response.success) {
        throw new Error(response.error || 'Failed to load shipments');
      }

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error loading shipments';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// ==================== SLICE ====================

const shippingSlice = createSlice({
  name: 'shipping',
  initialState,
  reducers: {
    setSelectedZone: (state, action: PayloadAction<ShippingZone | null>) => {
      state.selectedZone = action.payload;
    },

    setSelectedShipment: (state, action: PayloadAction<SaleShipping | null>) => {
      state.selectedShipment = action.payload;
    },

    clearCalculation: (state) => {
      state.calculation = null;
    },

    clearError: (state) => {
      state.error = null;
    },

    clearShipping: (state) => {
      state.zones = [];
      state.neighborhoods = [];
      state.calculation = null;
      state.shipments = [];
      state.selectedZone = null;
      state.selectedShipment = null;
    },
  },

  extraReducers: (builder) => {
    // ==================== ZONES ====================

    // Load Zones
    builder
      .addCase(loadZones.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadZones.fulfilled, (state, action) => {
        state.zones = action.payload;
        state.loading = false;
      })
      .addCase(loadZones.rejected, (state, action) => {
        state.error = action.payload || 'Error loading shipping zones';
        state.loading = false;
      });

    // Load Zone By ID
    builder
      .addCase(loadZoneById.fulfilled, (state, action) => {
        state.selectedZone = action.payload;
      });

    // Create Zone
    builder
      .addCase(createZone.fulfilled, (state, action) => {
        state.zones.push(action.payload);
      });

    // Update Zone
    builder
      .addCase(updateZone.fulfilled, (state, action) => {
        const index = state.zones.findIndex((z) => z.id === action.payload.id);
        if (index >= 0) {
          state.zones[index] = action.payload;
        }
        if (state.selectedZone?.id === action.payload.id) {
          state.selectedZone = action.payload;
        }
      });

    // Delete Zone
    builder
      .addCase(deleteZone.fulfilled, (state, action) => {
        state.zones = state.zones.filter((z) => z.id !== action.payload);
        if (state.selectedZone?.id === action.payload) {
          state.selectedZone = null;
        }
      });

    // ==================== NEIGHBORHOODS ====================

    // Load Neighborhoods
    builder
      .addCase(loadNeighborhoods.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadNeighborhoods.fulfilled, (state, action) => {
        state.neighborhoods = action.payload;
        state.loading = false;
      })
      .addCase(loadNeighborhoods.rejected, (state, action) => {
        state.error = action.payload || 'Error loading neighborhood mappings';
        state.loading = false;
      });

    // Create Neighborhood
    builder
      .addCase(createNeighborhood.fulfilled, (state, action) => {
        state.neighborhoods.push(action.payload);
      });

    // Update Neighborhood
    builder
      .addCase(updateNeighborhood.fulfilled, (state, action) => {
        const index = state.neighborhoods.findIndex((n) => n.id === action.payload.id);
        if (index >= 0) {
          state.neighborhoods[index] = action.payload;
        }
      });

    // Delete Neighborhood
    builder
      .addCase(deleteNeighborhood.fulfilled, (state, action) => {
        state.neighborhoods = state.neighborhoods.filter((n) => n.id !== action.payload);
      });

    // ==================== CALCULATION ====================

    // Calculate Shipping
    builder
      .addCase(calculateShipping.fulfilled, (state, action) => {
        state.calculation = action.payload;
      })
      .addCase(calculateShipping.rejected, (state, action) => {
        state.error = action.payload || 'Error calculating shipping';
        state.calculation = null;
      });

    // Find Zone For Location
    builder
      .addCase(findZoneForLocation.fulfilled, (state, action) => {
        state.selectedZone = action.payload;
      });

    // ==================== SALE SHIPPING ====================

    // Create Sale Shipping
    builder
      .addCase(createSaleShipping.fulfilled, (state, action) => {
        state.shipments.push(action.payload);
        state.selectedShipment = action.payload;
      });

    // Load Shipping By Sale ID
    builder
      .addCase(loadShippingBySaleId.fulfilled, (state, action) => {
        state.selectedShipment = action.payload;
      });

    // Update Delivery Status
    builder
      .addCase(updateDeliveryStatus.fulfilled, (state, action) => {
        const index = state.shipments.findIndex((s) => s.id === action.payload.id);
        if (index >= 0) {
          state.shipments[index] = action.payload;
        }
        if (state.selectedShipment?.id === action.payload.id) {
          state.selectedShipment = action.payload;
        }
      });

    // ==================== SHIPMENTS ====================

    // Load Shipments
    builder
      .addCase(loadShipments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadShipments.fulfilled, (state, action) => {
        state.shipments = action.payload;
        state.loading = false;
      })
      .addCase(loadShipments.rejected, (state, action) => {
        state.error = action.payload || 'Error loading shipments';
        state.loading = false;
      });
  },
});

export const {
  setSelectedZone,
  setSelectedShipment,
  clearCalculation,
  clearError,
  clearShipping,
} = shippingSlice.actions;

export default shippingSlice.reducer;
