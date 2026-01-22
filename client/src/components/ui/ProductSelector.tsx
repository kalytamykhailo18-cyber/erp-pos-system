import React, { useState, useEffect } from 'react';
import { MdSearch, MdClose } from 'react-icons/md';
import type { Product, UUID } from '../../types';
import { productService } from '../../services/api';

interface ProductSelectorProps {
  value: UUID | '';
  onChange: (productId: UUID) => void;
  branchId?: UUID;
  weighableOnly?: boolean;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  value,
  onChange,
  branchId,
  weighableOnly = false,
  label = 'Producto',
  placeholder = 'Buscar producto...',
  required = false,
  error
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load selected product on mount
  useEffect(() => {
    if (value && !selectedProduct) {
      loadProductById(value);
    }
  }, [value]);

  // Search products
  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchProducts();
    } else {
      setProducts([]);
    }
  }, [searchQuery]);

  const loadProductById = async (id: UUID) => {
    try {
      const response = await productService.getById(id);
      if (response.success) {
        setSelectedProduct(response.data);
      }
    } catch (error) {
      console.error('Error loading product:', error);
    }
  };

  const searchProducts = async () => {
    try {
      setLoading(true);
      const params: any = {
        search: searchQuery,
        is_active: true,
        limit: 10
      };

      if (branchId) {
        params.branch_id = branchId;
      }

      if (weighableOnly) {
        params.is_weighable = true;
      }

      const response = await productService.getAll(params);
      if (response.success) {
        setProducts(response.data);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (product: Product) => {
    setSelectedProduct(product);
    onChange(product.id);
    setSearchQuery('');
    setShowDropdown(false);
    setProducts([]);
  };

  const handleClear = () => {
    setSelectedProduct(null);
    onChange('' as UUID);
    setSearchQuery('');
    setProducts([]);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear selection if user starts typing
    if (selectedProduct) {
      setSelectedProduct(null);
      onChange('' as UUID);
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {selectedProduct ? (
        // Selected product display
        <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-gray-50 dark:bg-gray-700">
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {selectedProduct.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              SKU: {selectedProduct.sku}
              {selectedProduct.is_weighable && ' • Pesable'}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            title="Limpiar selección"
          >
            <MdClose className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      ) : (
        // Search input
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => {
                if (products.length > 0) {
                  setShowDropdown(true);
                }
              }}
              placeholder={placeholder}
              className={`w-full pl-10 pr-3 py-2 border ${
                error
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
              } rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent`}
            />
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              </div>
            )}
          </div>

          {/* Search results dropdown */}
          {showDropdown && products.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-sm shadow-lg max-h-60 overflow-y-auto">
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleSelect(product)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-0 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {product.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    SKU: {product.sku}
                    {product.is_weighable && ' • Pesable'}
                    {product.protein_percent && ` • ${product.protein_percent}% Proteína`}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    ${parseFloat(product.selling_price).toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {searchQuery.length >= 2 && !loading && products.length === 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-sm shadow-lg p-4 text-center text-gray-500 dark:text-gray-400">
              No se encontraron productos
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Help text */}
      {!error && !selectedProduct && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Escribe al menos 2 caracteres para buscar
          {weighableOnly && ' (solo productos pesables)'}
        </p>
      )}
    </div>
  );
};
