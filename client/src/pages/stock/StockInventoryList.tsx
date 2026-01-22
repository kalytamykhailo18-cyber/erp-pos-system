import React, { useState, useMemo } from 'react';
import { Card, Input, Pagination } from '../../components/ui';
import type { PaginationState } from '../../components/ui/Pagination';
import type { StockItem } from '../../services/api/stock.service';
import { MdSearch, MdEdit, MdRemove } from 'react-icons/md';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

interface StockInventoryListProps {
  stock: StockItem[];
  search: string;
  onSearchChange: (value: string) => void;
  showLowStock: boolean;
  onShowLowStockChange: (checked: boolean) => void;
  canAdjustStock: boolean;
  onAdjust: (item: StockItem) => void;
  onShrinkage: (item: StockItem) => void;
  loading: boolean;
}

const StockInventoryList: React.FC<StockInventoryListProps> = ({
  stock,
  search,
  onSearchChange,
  showLowStock,
  onShowLowStockChange,
  canAdjustStock,
  onAdjust,
  onShrinkage,
  loading,
}) => {
  // Client-side pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-AR').format(num);
  };

  // Client-side search filtering
  const filteredStock = useMemo(() => {
    return stock.filter((item) => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        item.product_name.toLowerCase().includes(searchLower) ||
        item.product_sku?.toLowerCase().includes(searchLower)
      );
    });
  }, [stock, search]);

  // Calculate paginated data
  const { paginatedData, pagination } = useMemo(() => {
    const total_items = filteredStock.length;
    const total_pages = Math.ceil(total_items / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      paginatedData: filteredStock.slice(startIndex, endIndex),
      pagination: {
        page,
        limit,
        total_items,
        total_pages,
      } as PaginationState,
    };
  }, [filteredStock, page, limit]);

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
      loading={loading}
      variant="extended"
      showPageSize
      pageSizeOptions={PAGE_SIZE_OPTIONS}
    />
  );

  return (
    <>
      {/* Filters */}
      <Card className="p-4 animate-fade-down duration-fast">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 animate-fade-right duration-normal">
            <Input
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              leftIcon={<MdSearch className="w-5 h-5" />}
            />
          </div>
          <label className="flex items-center gap-2 animate-fade-left duration-normal">
            <input
              type="checkbox"
              checked={showLowStock}
              onChange={(e) => onShowLowStockChange(e.target.checked)}
              className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Solo stock bajo
            </span>
          </label>
        </div>
      </Card>

      {/* Stock Table */}
      <Card className="overflow-hidden animate-fade-up duration-normal relative">
        {loading && (
          <div className="absolute top-4 right-4 z-10">
            <div className="animate-spin rounded-full h-6 w-6 border-4 border-gray-300 border-t-primary-600"></div>
          </div>
        )}
        {!loading && paginatedData.length === 0 ? (
          <div className="text-center py-12 text-gray-500 animate-zoom-in duration-normal">
            <p>No hay productos en el inventario</p>
          </div>
        ) : (
          <div>
            {/* Top Pagination */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <PaginationNav />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-primary-600 dark:bg-primary-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Stock Actual</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Mín / Máx</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Merma %</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedData.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.product_name}
                          </p>
                          <p className="text-sm text-gray-500">SKU: {item.product_sku}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-lg font-bold ${
                          item.quantity <= 0 ? 'text-danger-500' :
                          item.quantity <= 0 ? 'text-warning-500' : 'text-gray-900 dark:text-white'
                        }`}>
                          {formatNumber(item.quantity)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-500">
                        {0} / {999}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-500">
                        {item.expected_shrinkage ? `${item.expected_shrinkage}%` : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.quantity <= 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-100 text-danger-800 dark:bg-danger-900/20 dark:text-danger-400">
                            Sin stock
                          </span>
                        ) : item.quantity <= 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400">
                            Stock bajo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            OK
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {canAdjustStock ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => onAdjust(item)}
                              className="p-2 text-gray-400 hover:text-primary-500"
                              title="Ajustar stock"
                            >
                              <MdEdit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => onShrinkage(item)}
                              className="p-2 text-gray-400 hover:text-warning-500"
                              title="Registrar merma"
                            >
                              <MdRemove className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            Sin permisos
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
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

export default StockInventoryList;
