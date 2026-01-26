import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Product, Category, POSProduct, UUID } from '../../types';
import { productService, categoryService } from '../../services/api';
import { startLoading, stopLoading, showToast } from './uiSlice';
import { getCachedProducts } from '../../services/offline/syncService';

interface UnitOfMeasure {
  id: string;
  code: string;
  name: string;
  is_fractional: boolean;
}

interface ProductsState {
  // Products list
  products: Product[];
  posProducts: POSProduct[];

  // Advanced search results (PART 14)
  searchResults: {
    all_products: Product[];
    factory_direct: Product[];
    premium: Product[];
    count: number;
  } | null;

  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };

  // Categories
  categories: Category[];
  categoryTree: Category[];
  selectedCategory: UUID | null;

  // Units of measure
  units: UnitOfMeasure[];

  // Search and filter
  searchQuery: string;
  filters: {
    category_id?: UUID;
    is_active?: boolean;
    is_weighable?: boolean;
    page?: number;
    limit?: number;
  };

  // Loading states
  loading: boolean;
  error: string | null;
}

const initialState: ProductsState = {
  products: [],
  posProducts: [],
  searchResults: null, // PART 14: Advanced search results
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  categories: [],
  categoryTree: [],
  selectedCategory: null,
  units: [],
  searchQuery: '',
  filters: {},
  loading: false,
  error: null,
};

// Async Thunks
export const loadProducts = createAsyncThunk<
  { products: Product[]; total: number },
  { page?: number; limit?: number; search?: string; category_id?: UUID } | void,
  { rejectValue: string }
>(
  'products/loadProducts',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await productService.getAll(params || {});

      if (!response.success) {
        throw new Error('Failed to load products');
      }

      return {
        products: response.data,
        total: response.pagination?.total_items || response.data.length,
      };
    } catch (error) {
      return rejectWithValue('Error loading products');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadPOSProducts = createAsyncThunk<
  POSProduct[],
  { branch_id: UUID; category_id?: UUID; search?: string },
  { rejectValue: string }
>(
  'products/loadPOSProducts',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());

      // Check if online
      const isOnline = navigator.onLine;

      if (isOnline) {
        // Try online load first
        try {
          const response = await productService.getForPOS(params);

          if (!response.success) {
            throw new Error('Failed to load POS products');
          }

          return response.data;
        } catch (error) {
          // Network error - fallback to offline cache
          console.warn('[Products] Online load failed, using cached data', error);
          const cachedProducts = await getCachedProducts(params.branch_id, params.search);
          return cachedProducts as POSProduct[];
        }
      } else {
        // Offline mode - use cached data
        console.log('[Products] Offline mode, using cached data');
        const cachedProducts = await getCachedProducts(params.branch_id, params.search);
        return cachedProducts as POSProduct[];
      }
    } catch (error) {
      return rejectWithValue('Error loading products');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const searchProducts = createAsyncThunk<
  POSProduct[],
  { branch_id: UUID; query: string },
  { rejectValue: string }
>(
  'products/searchProducts',
  async ({ branch_id, query }, { rejectWithValue }) => {
    try {
      // Check if online
      const isOnline = navigator.onLine;

      if (isOnline) {
        // Try online search first
        try {
          const response = await productService.getForPOS({
            branch_id,
            search: query,
          });

          if (!response.success) {
            throw new Error('Failed to search products');
          }

          return response.data;
        } catch (error) {
          // Network error - fallback to offline cache
          console.warn('[Products] Online search failed, using cached data', error);
          const cachedProducts = await getCachedProducts(branch_id, query);
          return cachedProducts as POSProduct[];
        }
      } else {
        // Offline mode - use cached data
        console.log('[Products] Offline mode, using cached data');
        const cachedProducts = await getCachedProducts(branch_id, query);
        return cachedProducts as POSProduct[];
      }
    } catch (error) {
      return rejectWithValue('Error searching products');
    }
  }
);

export const getProductByBarcode = createAsyncThunk<
  Product,
  string,
  { rejectValue: string }
>(
  'products/getByBarcode',
  async (barcode, { dispatch, rejectWithValue }) => {
    try {
      const response = await productService.getByBarcode(barcode);

      if (!response.success) {
        throw new Error('Product not found');
      }

      return response.data;
    } catch (error) {
      dispatch(showToast({ type: 'error', message: 'Producto no encontrado' }));
      return rejectWithValue('Product not found');
    }
  }
);

export const loadCategories = createAsyncThunk<Category[], void, { rejectValue: string }>(
  'products/loadCategories',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await categoryService.getAll();

      if (!response.success) {
        throw new Error('Failed to load categories');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error loading categories');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadCategoryTree = createAsyncThunk<Category[], void, { rejectValue: string }>(
  'products/loadCategoryTree',
  async (_, { rejectWithValue }) => {
    try {
      const response = await categoryService.getTree();

      if (!response.success) {
        throw new Error('Failed to load category tree');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error loading categories');
    }
  }
);

export const loadUnits = createAsyncThunk<UnitOfMeasure[], void, { rejectValue: string }>(
  'products/loadUnits',
  async (_, { rejectWithValue }) => {
    try {
      const response = await productService.getUnits();

      if (!response.success) {
        throw new Error('Failed to load units');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error loading units');
    }
  }
);

export const createProduct = createAsyncThunk<
  Product,
  Partial<Product>,
  { rejectValue: string }
>(
  'products/create',
  async (productData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Creando producto...'));
      const response = await productService.create(productData);

      if (!response.success) {
        // Handle validation errors with specific field messages
        if (response.errors && response.errors.length > 0) {
          const errorMessages = response.errors.map(err => `${err.field}: ${err.message}`).join(', ');
          dispatch(showToast({ type: 'error', message: errorMessages }));
          throw new Error(errorMessages);
        }
        throw new Error(response.error || 'Failed to create product');
      }

      dispatch(showToast({ type: 'success', message: 'Producto creado' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error creating product';
      if (!message.includes(':')) {
        // Only show toast if we haven't already shown validation errors
        dispatch(showToast({ type: 'error', message }));
      }
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const updateProduct = createAsyncThunk<
  Product,
  { id: UUID; data: Partial<Product> },
  { rejectValue: string }
>(
  'products/update',
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Actualizando producto...'));
      const response = await productService.update(id, data);

      if (!response.success) {
        // Handle validation errors with specific field messages
        if (response.errors && response.errors.length > 0) {
          const errorMessages = response.errors.map(err => `${err.field}: ${err.message}`).join(', ');
          dispatch(showToast({ type: 'error', message: errorMessages }));
          throw new Error(errorMessages);
        }
        throw new Error(response.error || 'Failed to update product');
      }

      dispatch(showToast({ type: 'success', message: 'Producto actualizado' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error updating product';
      if (!message.includes(':')) {
        // Only show toast if we haven't already shown validation errors
        dispatch(showToast({ type: 'error', message }));
      }
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const deleteProduct = createAsyncThunk<
  UUID,
  UUID,
  { rejectValue: string }
>(
  'products/delete',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Eliminando producto...'));
      const response = await productService.deactivate(id);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete product');
      }

      dispatch(showToast({ type: 'success', message: 'Producto eliminado' }));
      return id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error deleting product';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Advanced product search (PART 14: Product Search & Recommendations)
export const advancedProductSearch = createAsyncThunk<
  {
    all_products: Product[];
    factory_direct: Product[];
    premium: Product[];
    count: number;
  },
  {
    species_id?: UUID;
    variety_id?: UUID;
    product_type_id?: UUID;
    protein_min?: number;
    protein_max?: number;
    is_factory_direct?: boolean;
    search?: string;
    branch_id?: UUID;
  },
  { rejectValue: string }
>(
  'products/advancedSearch',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await productService.advancedSearch(params);

      if (!response.success) {
        throw new Error('Failed to search products');
      }

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error searching products';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    setSelectedCategory: (state, action: PayloadAction<UUID | null>) => {
      state.selectedCategory = action.payload;
    },

    setFilters: (state, action: PayloadAction<ProductsState['filters']>) => {
      state.filters = action.payload;
    },

    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },

    setLimit: (state, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1;
    },

    setPagination: (state, action: PayloadAction<{ page?: number; limit?: number }>) => {
      if (action.payload.page !== undefined) {
        state.pagination.page = action.payload.page;
      }
      if (action.payload.limit !== undefined) {
        state.pagination.limit = action.payload.limit;
      }
    },

    clearProducts: (state) => {
      state.products = [];
      state.posProducts = [];
      state.pagination = { page: 1, limit: 20, total: 0, pages: 0 };
    },

    clearSearchResults: (state) => {
      state.searchResults = null;
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    // Load Products
    builder
      .addCase(loadProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadProducts.fulfilled, (state, action) => {
        state.products = action.payload.products;
        state.pagination.total = action.payload.total;
        state.pagination.pages = Math.ceil(action.payload.total / state.pagination.limit);
        state.loading = false;
      })
      .addCase(loadProducts.rejected, (state, action) => {
        state.error = action.payload || 'Error loading products';
        state.loading = false;
      });

    // Load POS Products
    builder
      .addCase(loadPOSProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadPOSProducts.fulfilled, (state, action) => {
        state.posProducts = action.payload;
        state.loading = false;
      })
      .addCase(loadPOSProducts.rejected, (state, action) => {
        state.error = action.payload || 'Error loading products';
        state.loading = false;
      });

    // Search Products
    builder.addCase(searchProducts.fulfilled, (state, action) => {
      state.posProducts = action.payload;
    });

    // Load Categories
    builder.addCase(loadCategories.fulfilled, (state, action) => {
      state.categories = action.payload;
    });

    // Load Category Tree
    builder.addCase(loadCategoryTree.fulfilled, (state, action) => {
      state.categoryTree = action.payload;
    });

    // Load Units
    builder.addCase(loadUnits.fulfilled, (state, action) => {
      state.units = action.payload;
    });

    // Create Product
    builder.addCase(createProduct.fulfilled, (state, action) => {
      state.products.unshift(action.payload);
      state.pagination.total += 1;
      state.pagination.pages = Math.ceil(state.pagination.total / state.pagination.limit);
    });

    // Update Product
    builder.addCase(updateProduct.fulfilled, (state, action) => {
      const index = state.products.findIndex((p) => p.id === action.payload.id);
      if (index >= 0) {
        state.products[index] = action.payload;
      }
    });

    // Delete Product
    builder.addCase(deleteProduct.fulfilled, (state, action) => {
      state.products = state.products.filter((p) => p.id !== action.payload);
      state.pagination.total -= 1;
      state.pagination.pages = Math.ceil(state.pagination.total / state.pagination.limit);
    });

    // Advanced Search (PART 14)
    builder
      .addCase(advancedProductSearch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(advancedProductSearch.fulfilled, (state, action) => {
        state.searchResults = action.payload;
        state.loading = false;
      })
      .addCase(advancedProductSearch.rejected, (state, action) => {
        state.error = action.payload || 'Error searching products';
        state.loading = false;
        state.searchResults = null;
      });
  },
});

export const {
  setSearchQuery,
  setSelectedCategory,
  setFilters,
  setPage,
  setLimit,
  setPagination,
  clearProducts,
  clearSearchResults,
  clearError,
} = productsSlice.actions;

export default productsSlice.reducer;
