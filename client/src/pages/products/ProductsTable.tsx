import React from 'react';
import { Button } from '../../components/ui';
import Pagination, { type PaginationState } from '../../components/ui/Pagination';
import type { Product } from '../../types';
import { MdInventory, MdEdit, MdDelete } from 'react-icons/md';

interface ProductsTableProps {
  products: Product[];
  loading: boolean;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  loading,
  onEdit,
  onDelete,
  onCreate,
  pagination,
  onPageChange,
  onPageSizeChange,
}) => {
  // Reusable pagination component for top and bottom
  const PaginationNav = () => (
    <Pagination
      pagination={pagination}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      loading={loading}
      variant="extended"
      showPageSize
      pageSizeOptions={PAGE_SIZE_OPTIONS}
    />
  );
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity === undefined || product.stock_quantity === null) {
      return null;
    }
    if (product.stock_quantity <= 0) {
      return <span className="text-xs text-danger-500">Sin stock</span>;
    }
    if (product.stock_quantity <= 5) {
      return <span className="text-xs text-warning-500">Stock bajo</span>;
    }
    return <span className="text-xs text-green-500">{product.stock_quantity} en stock</span>;
  };

  if (!loading && products.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400 animate-fade-up duration-normal">
        <MdInventory className="w-12 h-12 mx-auto mb-4 opacity-50 animate-zoom-in duration-fast" />
        <p className="animate-fade-up duration-light-slow">No hay productos</p>
        <Button variant="primary" className="mt-4 animate-zoom-in duration-slow" onClick={onCreate}>
          Crear primer producto
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute top-4 right-4 z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-4 border-gray-300 border-t-primary-600"></div>
        </div>
      )}
      {/* Top Pagination */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <PaginationNav />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-primary-600 dark:bg-primary-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Producto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                Costo
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                Precio
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {products.map((product) => (
            <tr
              key={product.id}
              className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 animate-fade-up duration-normal`}
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-sm flex items-center justify-center animate-zoom-in duration-fast">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-sm"
                      />
                    ) : (
                      <MdInventory className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white animate-fade-right duration-fast">
                      {product.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 animate-fade-right duration-normal">
                      SKU: {product.sku || 'N/A'}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-gray-600 dark:text-gray-300 animate-fade-up duration-fast">
                  {product.category?.name || '-'}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <span className="text-sm text-gray-600 dark:text-gray-300 animate-flip-up duration-normal">
                  {formatCurrency(Number(product.cost_price || 0))}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <span className="text-sm font-medium text-gray-900 dark:text-white animate-flip-up duration-light-slow">
                  {formatCurrency(Number(product.selling_price || 0))}
                </span>
              </td>
              <td className="px-6 py-4 text-center animate-zoom-in duration-normal">
                {getStockStatus(product)}
              </td>
              <td className="px-6 py-4 text-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium animate-zoom-in duration-light-slow ${
                  product.is_active
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {product.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2 animate-fade-left duration-fast">
                  <button
                    onClick={() => onEdit(product)}
                    className="p-2 text-gray-400 hover:text-primary-500 animate-zoom-in duration-very-fast"
                  >
                    <MdEdit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDelete(product.id)}
                    className="p-2 text-gray-400 hover:text-danger-500 animate-zoom-in duration-fast"
                  >
                    <MdDelete className="w-5 h-5" />
                  </button>
                </div>
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
  );
};
