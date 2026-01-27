import React, { useState, useMemo } from 'react';
import { Card, Pagination } from '../../components/ui';
import type { PaginationState } from '../../components/ui/Pagination';
import type { StockMovement } from '../../services/api/stock.service';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

interface StockMovementsListProps {
  movements: StockMovement[];
  loading: boolean;
}

const StockMovementsList: React.FC<StockMovementsListProps> = ({
  movements,
  loading,
}) => {
  // Client-side pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-AR').format(num);
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMovementStyle = (type: string) => {
    const styles: Record<string, { label: string; color: string }> = {
      SALE: { label: 'Venta', color: 'text-danger-500' },
      PURCHASE: { label: 'Compra', color: 'text-green-500' },
      ADJUSTMENT: { label: 'Ajuste', color: 'text-blue-500' },
      ADJUSTMENT_PLUS: { label: 'Ajuste (+)', color: 'text-green-500' },
      ADJUSTMENT_MINUS: { label: 'Ajuste (-)', color: 'text-danger-500' },
      TRANSFER_IN: { label: 'Transferencia (entrada)', color: 'text-green-500' },
      TRANSFER_OUT: { label: 'Transferencia (salida)', color: 'text-warning-500' },
      SHRINKAGE: { label: 'Merma', color: 'text-warning-500' },
      COUNT: { label: 'Conteo', color: 'text-purple-500' },
      INVENTORY_COUNT: { label: 'Conteo Físico', color: 'text-purple-500' },
      INITIAL: { label: 'Inicial', color: 'text-blue-500' },
      RETURN: { label: 'Devolución', color: 'text-green-500' },
    };
    return styles[type] || { label: type, color: 'text-gray-500' };
  };

  // Calculate paginated data
  const { paginatedData, pagination } = useMemo(() => {
    const total_items = movements.length;
    const total_pages = Math.ceil(total_items / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      paginatedData: movements.slice(startIndex, endIndex),
      pagination: {
        page,
        limit,
        total_items,
        total_pages,
      } as PaginationState,
    };
  }, [movements, page, limit]);

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
    <Card className="overflow-hidden animate-zoom-in duration-normal relative">
      {loading && (
        <div className="absolute top-4 right-4 z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-4 border-gray-300 border-t-primary-600"></div>
        </div>
      )}
      {!loading && paginatedData.length === 0 ? (
        <div className="text-center py-12 text-gray-500 animate-fade-up duration-normal">
          <p>No hay movimientos registrados</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Cantidad</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Stock Antes</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Stock Después</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Usuario</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedData.map((mov) => {
                  const style = getMovementStyle(mov.movement_type);
                  return (
                    <tr
                      key={mov.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDateTime(mov.created_at)}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {mov.product_name}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${style.color}`}>
                          {style.label}
                        </span>
                        {(mov.notes || mov.adjustment_reason) && (
                          <p className="text-xs text-gray-400">{mov.notes || mov.adjustment_reason}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-medium ${
                          mov.quantity > 0 ? 'text-green-500' : 'text-danger-500'
                        }`}>
                          {mov.quantity > 0 ? '+' : ''}{formatNumber(mov.quantity)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500">
                        {formatNumber(mov.quantity_before)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900 dark:text-white">
                        {formatNumber(mov.quantity_after)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {mov.performed_by_name || '-'}
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
  );
};

export default StockMovementsList;
