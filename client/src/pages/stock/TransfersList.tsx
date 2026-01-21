import React, { useState, useMemo } from 'react';
import { Card, Button, Pagination } from '../../components/ui';
import type { PaginationState } from '../../components/ui/Pagination';
import type { StockTransfer, StockTransferStatus } from '../../types';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

interface TransfersListProps {
  transfers: StockTransfer[];
  loading: boolean;
  onViewDetails: (transfer: StockTransfer) => void;
}

const TransfersList: React.FC<TransfersListProps> = ({
  transfers,
  loading,
  onViewDetails,
}) => {
  // Client-side pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const formatDateTime = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusStyle = (status: StockTransferStatus) => {
    const styles: Record<StockTransferStatus, { label: string; className: string }> = {
      PENDING: {
        label: 'Pendiente',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      },
      APPROVED: {
        label: 'Aprobado',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      },
      IN_TRANSIT: {
        label: 'En tránsito',
        className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      },
      RECEIVED: {
        label: 'Recibido',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      },
      CANCELLED: {
        label: 'Cancelado',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      }
    };
    return styles[status];
  };

  // Calculate paginated data
  const { paginatedData, pagination } = useMemo(() => {
    const total_items = transfers.length;
    const total_pages = Math.ceil(total_items / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      paginatedData: transfers.slice(startIndex, endIndex),
      pagination: {
        page,
        limit,
        total_items,
        total_pages,
      } as PaginationState,
    };
  }, [transfers, page, limit]);

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
          <p>No hay traslados registrados</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Desde
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Hacia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedData.map((transfer) => {
                  const statusStyle = getStatusStyle(transfer.status);
                  return (
                    <tr
                      key={transfer.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                          {transfer.transfer_number}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {transfer.source_branch?.name || 'Sucursal Origen'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {transfer.destination_branch?.name || 'Sucursal Destino'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusStyle.className}`}>
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-gray-900 dark:text-white font-medium">
                          {transfer.items?.length || 0} productos
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div>{formatDateTime(transfer.requested_at)}</div>
                        {transfer.status === 'IN_TRANSIT' && transfer.shipped_at && (
                          <div className="text-xs text-gray-400">
                            Enviado: {formatDateTime(transfer.shipped_at)}
                          </div>
                        )}
                        {transfer.status === 'RECEIVED' && transfer.received_at && (
                          <div className="text-xs text-gray-400">
                            Recibido: {formatDateTime(transfer.received_at)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onViewDetails(transfer)}
                        >
                          Ver Detalles
                        </Button>
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

export default TransfersList;
