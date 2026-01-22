import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Species, Variety, ProductType, UUID } from '../../types';
import { speciesService, varietyService, productTypeService } from '../../services/api/taxonomy.service';
import { startLoading, stopLoading, showToast } from './uiSlice';

interface TaxonomyState {
  // Species
  species: Species[];
  selectedSpecies: Species | null;

  // Varieties
  varieties: Variety[];
  varietiesBySpecies: Record<UUID, Variety[]>;
  selectedVariety: Variety | null;

  // Product Types
  productTypes: ProductType[];
  selectedProductType: ProductType | null;

  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };

  // Loading states
  loading: boolean;
  error: string | null;
}

const initialState: TaxonomyState = {
  species: [],
  selectedSpecies: null,
  varieties: [],
  varietiesBySpecies: {},
  selectedVariety: null,
  productTypes: [],
  selectedProductType: null,
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  },
  loading: false,
  error: null,
};

// ============================================
// SPECIES THUNKS
// ============================================

export const loadSpecies = createAsyncThunk<
  { species: Species[]; total: number },
  { page?: number; limit?: number; search?: string; is_active?: boolean } | void,
  { rejectValue: string }
>(
  'taxonomy/loadSpecies',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await speciesService.getAll(params || {});

      if (!response.success) {
        throw new Error('Failed to load species');
      }

      return {
        species: response.data,
        total: response.pagination?.total_items || response.data.length,
      };
    } catch (error) {
      return rejectWithValue('Error loading species');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const getSpeciesById = createAsyncThunk<
  Species,
  UUID,
  { rejectValue: string }
>(
  'taxonomy/getSpeciesById',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await speciesService.getById(id);

      if (!response.success) {
        throw new Error('Failed to load species');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error loading species');
    }
  }
);

export const createSpecies = createAsyncThunk<
  Species,
  { name: string; description?: string; sort_order?: number; is_active?: boolean },
  { rejectValue: string }
>(
  'taxonomy/createSpecies',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Creando especie...'));
      const response = await speciesService.create(data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create species');
      }

      dispatch(showToast({ type: 'success', message: 'Especie creada exitosamente' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error creating species';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const updateSpecies = createAsyncThunk<
  Species,
  { id: UUID; data: { name?: string; description?: string; sort_order?: number; is_active?: boolean } },
  { rejectValue: string }
>(
  'taxonomy/updateSpecies',
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Actualizando especie...'));
      const response = await speciesService.update(id, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update species');
      }

      dispatch(showToast({ type: 'success', message: 'Especie actualizada' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error updating species';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const deleteSpecies = createAsyncThunk<
  UUID,
  UUID,
  { rejectValue: string }
>(
  'taxonomy/deleteSpecies',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Eliminando especie...'));
      const response = await speciesService.delete(id);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete species');
      }

      dispatch(showToast({ type: 'success', message: 'Especie eliminada' }));
      return id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error deleting species';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const activateSpecies = createAsyncThunk<
  Species,
  UUID,
  { rejectValue: string }
>(
  'taxonomy/activateSpecies',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await speciesService.activate(id);

      if (!response.success) {
        throw new Error('Failed to activate species');
      }

      dispatch(showToast({ type: 'success', message: 'Especie activada' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error activating species';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    }
  }
);

export const deactivateSpecies = createAsyncThunk<
  Species,
  UUID,
  { rejectValue: string }
>(
  'taxonomy/deactivateSpecies',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await speciesService.deactivate(id);

      if (!response.success) {
        throw new Error('Failed to deactivate species');
      }

      dispatch(showToast({ type: 'success', message: 'Especie desactivada' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error deactivating species';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    }
  }
);

// ============================================
// VARIETY THUNKS
// ============================================

export const loadVarieties = createAsyncThunk<
  { varieties: Variety[]; total: number },
  { page?: number; limit?: number; species_id?: UUID; search?: string; is_active?: boolean } | void,
  { rejectValue: string }
>(
  'taxonomy/loadVarieties',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await varietyService.getAll(params || {});

      if (!response.success) {
        throw new Error('Failed to load varieties');
      }

      return {
        varieties: response.data,
        total: response.pagination?.total_items || response.data.length,
      };
    } catch (error) {
      return rejectWithValue('Error loading varieties');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadVarietiesBySpecies = createAsyncThunk<
  { speciesId: UUID; varieties: Variety[] },
  { speciesId: UUID; is_active?: boolean },
  { rejectValue: string }
>(
  'taxonomy/loadVarietiesBySpecies',
  async ({ speciesId, is_active }, { rejectWithValue }) => {
    try {
      const response = await varietyService.getBySpecies(speciesId, { is_active });

      if (!response.success) {
        throw new Error('Failed to load varieties');
      }

      return {
        speciesId,
        varieties: response.data,
      };
    } catch (error) {
      return rejectWithValue('Error loading varieties');
    }
  }
);

export const getVarietyById = createAsyncThunk<
  Variety,
  UUID,
  { rejectValue: string }
>(
  'taxonomy/getVarietyById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await varietyService.getById(id);

      if (!response.success) {
        throw new Error('Failed to load variety');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error loading variety');
    }
  }
);

export const createVariety = createAsyncThunk<
  Variety,
  { species_id: UUID; name: string; description?: string; sort_order?: number; is_active?: boolean },
  { rejectValue: string }
>(
  'taxonomy/createVariety',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Creando variedad...'));
      const response = await varietyService.create(data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create variety');
      }

      dispatch(showToast({ type: 'success', message: 'Variedad creada exitosamente' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error creating variety';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const updateVariety = createAsyncThunk<
  Variety,
  { id: UUID; data: { species_id?: UUID; name?: string; description?: string; sort_order?: number; is_active?: boolean } },
  { rejectValue: string }
>(
  'taxonomy/updateVariety',
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Actualizando variedad...'));
      const response = await varietyService.update(id, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update variety');
      }

      dispatch(showToast({ type: 'success', message: 'Variedad actualizada' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error updating variety';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const deleteVariety = createAsyncThunk<
  UUID,
  UUID,
  { rejectValue: string }
>(
  'taxonomy/deleteVariety',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Eliminando variedad...'));
      const response = await varietyService.delete(id);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete variety');
      }

      dispatch(showToast({ type: 'success', message: 'Variedad eliminada' }));
      return id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error deleting variety';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const activateVariety = createAsyncThunk<
  Variety,
  UUID,
  { rejectValue: string }
>(
  'taxonomy/activateVariety',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await varietyService.activate(id);

      if (!response.success) {
        throw new Error('Failed to activate variety');
      }

      dispatch(showToast({ type: 'success', message: 'Variedad activada' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error activating variety';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    }
  }
);

export const deactivateVariety = createAsyncThunk<
  Variety,
  UUID,
  { rejectValue: string }
>(
  'taxonomy/deactivateVariety',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await varietyService.deactivate(id);

      if (!response.success) {
        throw new Error('Failed to deactivate variety');
      }

      dispatch(showToast({ type: 'success', message: 'Variedad desactivada' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error deactivating variety';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    }
  }
);

// ============================================
// PRODUCT TYPE THUNKS
// ============================================

export const loadProductTypes = createAsyncThunk<
  { productTypes: ProductType[]; total: number },
  { page?: number; limit?: number; search?: string; is_active?: boolean } | void,
  { rejectValue: string }
>(
  'taxonomy/loadProductTypes',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await productTypeService.getAll(params || {});

      if (!response.success) {
        throw new Error('Failed to load product types');
      }

      return {
        productTypes: response.data,
        total: response.pagination?.total_items || response.data.length,
      };
    } catch (error) {
      return rejectWithValue('Error loading product types');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const getProductTypeById = createAsyncThunk<
  ProductType,
  UUID,
  { rejectValue: string }
>(
  'taxonomy/getProductTypeById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await productTypeService.getById(id);

      if (!response.success) {
        throw new Error('Failed to load product type');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error loading product type');
    }
  }
);

export const createProductType = createAsyncThunk<
  ProductType,
  { name: string; description?: string; sort_order?: number; is_active?: boolean },
  { rejectValue: string }
>(
  'taxonomy/createProductType',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Creando tipo de producto...'));
      const response = await productTypeService.create(data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create product type');
      }

      dispatch(showToast({ type: 'success', message: 'Tipo de producto creado' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error creating product type';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const updateProductType = createAsyncThunk<
  ProductType,
  { id: UUID; data: { name?: string; description?: string; sort_order?: number; is_active?: boolean } },
  { rejectValue: string }
>(
  'taxonomy/updateProductType',
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Actualizando tipo de producto...'));
      const response = await productTypeService.update(id, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update product type');
      }

      dispatch(showToast({ type: 'success', message: 'Tipo de producto actualizado' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error updating product type';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const deleteProductType = createAsyncThunk<
  UUID,
  UUID,
  { rejectValue: string }
>(
  'taxonomy/deleteProductType',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Eliminando tipo de producto...'));
      const response = await productTypeService.delete(id);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete product type');
      }

      dispatch(showToast({ type: 'success', message: 'Tipo de producto eliminado' }));
      return id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error deleting product type';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const activateProductType = createAsyncThunk<
  ProductType,
  UUID,
  { rejectValue: string }
>(
  'taxonomy/activateProductType',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await productTypeService.activate(id);

      if (!response.success) {
        throw new Error('Failed to activate product type');
      }

      dispatch(showToast({ type: 'success', message: 'Tipo de producto activado' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error activating product type';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    }
  }
);

export const deactivateProductType = createAsyncThunk<
  ProductType,
  UUID,
  { rejectValue: string }
>(
  'taxonomy/deactivateProductType',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await productTypeService.deactivate(id);

      if (!response.success) {
        throw new Error('Failed to deactivate product type');
      }

      dispatch(showToast({ type: 'success', message: 'Tipo de producto desactivado' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error deactivating product type';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    }
  }
);

// ============================================
// SLICE
// ============================================

const taxonomySlice = createSlice({
  name: 'taxonomy',
  initialState,
  reducers: {
    setSelectedSpecies: (state, action: PayloadAction<Species | null>) => {
      state.selectedSpecies = action.payload;
    },

    setSelectedVariety: (state, action: PayloadAction<Variety | null>) => {
      state.selectedVariety = action.payload;
    },

    setSelectedProductType: (state, action: PayloadAction<ProductType | null>) => {
      state.selectedProductType = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    // ============================================
    // SPECIES
    // ============================================

    // Load Species
    builder
      .addCase(loadSpecies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadSpecies.fulfilled, (state, action) => {
        state.species = action.payload.species;
        state.pagination.total = action.payload.total;
        state.pagination.pages = Math.ceil(action.payload.total / state.pagination.limit);
        state.loading = false;
      })
      .addCase(loadSpecies.rejected, (state, action) => {
        state.error = action.payload || 'Error loading species';
        state.loading = false;
      });

    // Get Species By ID
    builder.addCase(getSpeciesById.fulfilled, (state, action) => {
      state.selectedSpecies = action.payload;
    });

    // Create Species
    builder.addCase(createSpecies.fulfilled, (state, action) => {
      state.species.unshift(action.payload);
      state.pagination.total += 1;
    });

    // Update Species
    builder
      .addCase(updateSpecies.fulfilled, (state, action) => {
        const index = state.species.findIndex((s) => s.id === action.payload.id);
        if (index >= 0) {
          state.species[index] = action.payload;
        }
        if (state.selectedSpecies?.id === action.payload.id) {
          state.selectedSpecies = action.payload;
        }
      })
      .addCase(activateSpecies.fulfilled, (state, action) => {
        const index = state.species.findIndex((s) => s.id === action.payload.id);
        if (index >= 0) {
          state.species[index] = action.payload;
        }
      })
      .addCase(deactivateSpecies.fulfilled, (state, action) => {
        const index = state.species.findIndex((s) => s.id === action.payload.id);
        if (index >= 0) {
          state.species[index] = action.payload;
        }
      });

    // Delete Species
    builder.addCase(deleteSpecies.fulfilled, (state, action) => {
      state.species = state.species.filter((s) => s.id !== action.payload);
      state.pagination.total -= 1;
      if (state.selectedSpecies?.id === action.payload) {
        state.selectedSpecies = null;
      }
    });

    // ============================================
    // VARIETIES
    // ============================================

    // Load Varieties
    builder
      .addCase(loadVarieties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadVarieties.fulfilled, (state, action) => {
        state.varieties = action.payload.varieties;
        state.loading = false;
      })
      .addCase(loadVarieties.rejected, (state, action) => {
        state.error = action.payload || 'Error loading varieties';
        state.loading = false;
      });

    // Load Varieties By Species
    builder.addCase(loadVarietiesBySpecies.fulfilled, (state, action) => {
      state.varietiesBySpecies[action.payload.speciesId] = action.payload.varieties;
    });

    // Get Variety By ID
    builder.addCase(getVarietyById.fulfilled, (state, action) => {
      state.selectedVariety = action.payload;
    });

    // Create Variety
    builder.addCase(createVariety.fulfilled, (state, action) => {
      state.varieties.unshift(action.payload);

      // Update varietiesBySpecies cache
      if (action.payload.species_id) {
        const speciesVarieties = state.varietiesBySpecies[action.payload.species_id] || [];
        state.varietiesBySpecies[action.payload.species_id] = [action.payload, ...speciesVarieties];
      }
    });

    // Update Variety
    builder
      .addCase(updateVariety.fulfilled, (state, action) => {
        const index = state.varieties.findIndex((v) => v.id === action.payload.id);
        if (index >= 0) {
          state.varieties[index] = action.payload;
        }
        if (state.selectedVariety?.id === action.payload.id) {
          state.selectedVariety = action.payload;
        }

        // Update varietiesBySpecies cache
        if (action.payload.species_id) {
          const speciesVarieties = state.varietiesBySpecies[action.payload.species_id] || [];
          const vIndex = speciesVarieties.findIndex((v) => v.id === action.payload.id);
          if (vIndex >= 0) {
            speciesVarieties[vIndex] = action.payload;
          }
        }
      })
      .addCase(activateVariety.fulfilled, (state, action) => {
        const index = state.varieties.findIndex((v) => v.id === action.payload.id);
        if (index >= 0) {
          state.varieties[index] = action.payload;
        }
      })
      .addCase(deactivateVariety.fulfilled, (state, action) => {
        const index = state.varieties.findIndex((v) => v.id === action.payload.id);
        if (index >= 0) {
          state.varieties[index] = action.payload;
        }
      });

    // Delete Variety
    builder.addCase(deleteVariety.fulfilled, (state, action) => {
      state.varieties = state.varieties.filter((v) => v.id !== action.payload);
      if (state.selectedVariety?.id === action.payload) {
        state.selectedVariety = null;
      }

      // Update varietiesBySpecies cache
      Object.keys(state.varietiesBySpecies).forEach((speciesId) => {
        state.varietiesBySpecies[speciesId] = state.varietiesBySpecies[speciesId].filter(
          (v) => v.id !== action.payload
        );
      });
    });

    // ============================================
    // PRODUCT TYPES
    // ============================================

    // Load Product Types
    builder
      .addCase(loadProductTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadProductTypes.fulfilled, (state, action) => {
        state.productTypes = action.payload.productTypes;
        state.loading = false;
      })
      .addCase(loadProductTypes.rejected, (state, action) => {
        state.error = action.payload || 'Error loading product types';
        state.loading = false;
      });

    // Get Product Type By ID
    builder.addCase(getProductTypeById.fulfilled, (state, action) => {
      state.selectedProductType = action.payload;
    });

    // Create Product Type
    builder.addCase(createProductType.fulfilled, (state, action) => {
      state.productTypes.unshift(action.payload);
    });

    // Update Product Type
    builder
      .addCase(updateProductType.fulfilled, (state, action) => {
        const index = state.productTypes.findIndex((t) => t.id === action.payload.id);
        if (index >= 0) {
          state.productTypes[index] = action.payload;
        }
        if (state.selectedProductType?.id === action.payload.id) {
          state.selectedProductType = action.payload;
        }
      })
      .addCase(activateProductType.fulfilled, (state, action) => {
        const index = state.productTypes.findIndex((t) => t.id === action.payload.id);
        if (index >= 0) {
          state.productTypes[index] = action.payload;
        }
      })
      .addCase(deactivateProductType.fulfilled, (state, action) => {
        const index = state.productTypes.findIndex((t) => t.id === action.payload.id);
        if (index >= 0) {
          state.productTypes[index] = action.payload;
        }
      });

    // Delete Product Type
    builder.addCase(deleteProductType.fulfilled, (state, action) => {
      state.productTypes = state.productTypes.filter((t) => t.id !== action.payload);
      if (state.selectedProductType?.id === action.payload) {
        state.selectedProductType = null;
      }
    });
  },
});

export const {
  setSelectedSpecies,
  setSelectedVariety,
  setSelectedProductType,
  clearError,
} = taxonomySlice.actions;

export default taxonomySlice.reducer;
