import React, { useState, useEffect, useMemo } from 'react';
import { Button, Card, Pagination } from '../../components/ui';
import type { PaginationState } from '../../components/ui/Pagination';
import type { ImportPreview, ExtractedPrice } from './types';
import type { Product, UUID } from '../../types';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

interface PricePreviewTableProps {
  preview: ImportPreview;
  selectedItems: Set<number>;
  marginPercent: string;
  roundingRule: string;
  onToggleItem: (index: number) => void;
  onToggleAllMatched: () => void;
  onApply: () => void;
  onManualMatch: (index: number, productId: UUID) => void;
}

export const PricePreviewTable: React.FC<PricePreviewTableProps> = ({
  preview,
  selectedItems,
  marginPercent,
  roundingRule,
  onToggleItem,
  onToggleAllMatched,
  onApply,
  onManualMatch,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchingForItemIndex, setSearchingForItemIndex] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Client-side pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Calculate paginated data
  const { paginatedData, pagination } = useMemo(() => {
    const total_items = preview.items.length;
    const total_pages = Math.ceil(total_items / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      paginatedData: preview.items.slice(startIndex, endIndex),
      pagination: {
        page,
        limit,
        total_items,
        total_pages,
      } as PaginationState,
    };
  }, [preview.items, page, limit]);

  // Reset page when preview changes
  useEffect(() => {
    setPage(1);
  }, [preview]);

  // Pagination handlers
  const handlePageChange = (newPage: number) => setPage(newPage);
  const handlePageSizeChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  // Reusable pagination component
  const PaginationNav = () => (
    <Pagination
      pagination={pagination}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      loading={false}
      variant="extended"
      showPageSize
      pageSizeOptions={PAGE_SIZE_OPTIONS}
    />
  );

  // Search for products when user types
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const searchProducts = async () => {
      setIsSearching(true);
      try {
        const { productService } = await import('../../services/api/product.service');
        const response = await productService.getAll({ search: searchTerm, limit: 10 });
        if (response.success) {
          setSearchResults(response.data);
        }
      } catch (error) {
        console.error('Error searching products:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchProducts, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSelectProduct = (itemIndex: number, productId: UUID) => {
    onManualMatch(itemIndex, productId);
    setSearchingForItemIndex(null);
    setSearchTerm('');
    setSearchResults([]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const calculateSellPrice = (costPrice: number) => {
    const margin = parseFloat(marginPercent) / 100;
    let sellPrice = costPrice * (1 + margin);

    // Apply rounding
    switch (roundingRule) {
      case 'nearest_10':
        sellPrice = Math.round(sellPrice / 10) * 10;
        break;
      case 'nearest_50':
        sellPrice = Math.round(sellPrice / 50) * 50;
        break;
      case 'nearest_100':
        sellPrice = Math.round(sellPrice / 100) * 100;
        break;
      case 'up_10':
        sellPrice = Math.ceil(sellPrice / 10) * 10;
        break;
      case 'down_10':
        sellPrice = Math.floor(sellPrice / 10) * 10;
        break;
    }

    return sellPrice;
  };

  const getStatusBadge = (item: ExtractedPrice) => {
    // Check match status based on match_type
    if (item.match_type === 'UNMATCHED' || !item.product_id) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
          Sin coincidencia
        </span>
      );
    }

    // Check for large price change (> 20%)
    if (item.price_change_percent && Math.abs(item.price_change_percent) > 20) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400">
          Cambio grande
        </span>
      );
    }

    // Show match type
    switch (item.match_type) {
      case 'EXACT_CODE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            Coincide
          </span>
        );
      case 'FUZZY_NAME':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            Similar
          </span>
        );
      case 'MANUAL':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
            Manual
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 animate-fade-down duration-fast">
        <div className="flex items-center justify-between">
          <div className="animate-fade-right duration-normal">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              2. Vista Previa
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {preview.file_name} • {preview.total_rows_extracted || preview.items.length} productos encontrados
            </p>
          </div>
          <div className="flex items-center gap-4 animate-fade-left duration-normal">
            <div className="flex items-center gap-2 text-sm animate-zoom-in duration-fast">
              <span className="w-3 h-3 bg-green-500 rounded-full" />
              <span>{preview.rows_matched || preview.items.filter(i => i.product_id).length} coincidencias</span>
            </div>
            <div className="flex items-center gap-2 text-sm animate-zoom-in duration-normal">
              <span className="w-3 h-3 bg-gray-400 rounded-full" />
              <span>{preview.rows_unmatched || preview.items.filter(i => !i.product_id).length} sin coincidencia</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 flex items-center justify-between animate-fade-up duration-normal">
        <div className="flex items-center gap-4 animate-fade-right duration-fast">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preview.items
                .map((item, idx) => ({ item, idx }))
                .filter(({ item }) => item.product_id)
                .every(({ idx }) => selectedItems.has(idx))
              }
              onChange={onToggleAllMatched}
              className="w-4 h-4 text-primary-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Seleccionar todos los coincidentes
            </span>
          </label>
          <span className="text-sm text-gray-500 animate-flip-down duration-normal">
            {selectedItems.size} seleccionados
          </span>
        </div>
        <Button
          variant="primary"
          onClick={onApply}
          disabled={selectedItems.size === 0}
          className="animate-zoom-in duration-light-slow"
        >
          Aplicar Precios Seleccionados
        </Button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {paginatedData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No hay productos para mostrar
          </div>
        ) : (
          <div>
            {/* Top Pagination */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <PaginationNav />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary-600 dark:bg-primary-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-10"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Descripción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Producto Coincidente</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Precio Actual</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Nuevo Costo</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Nuevo Precio</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Cambio</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedData.map((item, index) => {
                    // Calculate the actual index in the full array for selection tracking
                    const actualIndex = (page - 1) * limit + index;
                    const newSellPrice = item.new_selling_price || calculateSellPrice(item.new_cost_price);
                    const priceChange = item.price_change_percent ?? (
                      item.current_selling_price
                        ? ((newSellPrice - item.current_selling_price) / item.current_selling_price) * 100
                        : null
                    );

                    return (
                      <tr
                        key={actualIndex}
                        className={`
                          hover:bg-gray-50 dark:hover:bg-gray-800
                          ${selectedItems.has(actualIndex) ? 'bg-primary-50 dark:bg-primary-900/10' : ''}
                        `}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(actualIndex)}
                            onChange={() => onToggleItem(actualIndex)}
                            disabled={!item.product_id}
                            className="w-4 h-4 text-primary-500 border-gray-300 rounded disabled:opacity-50"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {item.extracted_code}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                          {item.extracted_description}
                        </td>
                        <td className="px-6 py-4">
                          {item.product?.name ? (
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {item.product.name}
                              </p>
                              <p className="text-xs text-gray-500">SKU: {item.product.sku}</p>
                            </div>
                          ) : searchingForItemIndex === actualIndex ? (
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Buscar producto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                autoFocus
                              />
                              {isSearching && (
                                <div className="absolute right-3 top-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary-600"></div>
                                </div>
                              )}
                              {searchResults.length > 0 && (
                                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                                  {searchResults.map((product) => (
                                    <button
                                      key={product.id}
                                      onClick={() => handleSelectProduct(actualIndex, product.id)}
                                      className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                                    >
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {product.name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        SKU: {product.sku} {product.barcode && `• Código: ${product.barcode}`}
                                      </p>
                                    </button>
                                  ))}
                                </div>
                              )}
                              <button
                                onClick={() => {
                                  setSearchingForItemIndex(null);
                                  setSearchTerm('');
                                  setSearchResults([]);
                                }}
                                className="mt-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-400"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSearchingForItemIndex(actualIndex)}
                              className="text-sm text-primary-600 hover:text-primary-700 underline"
                            >
                              Asociar producto
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-500">
                          {item.current_selling_price ? formatCurrency(item.current_selling_price) : '-'}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-900 dark:text-white">
                          {formatCurrency(item.new_cost_price)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-primary-600">
                          {formatCurrency(newSellPrice)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {priceChange !== null && (
                            <span className={`text-sm font-medium ${
                              priceChange > 0 ? 'text-danger-500' :
                              priceChange < 0 ? 'text-green-500' : 'text-gray-500'
                            }`}>
                              {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}%
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {getStatusBadge(item)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Pagination */}
            <div className="border-t border-gray-200 dark:border-gray-700">
              <PaginationNav />
            </div>
          </div>
        )}
      </Card>
    </>
  );
};
