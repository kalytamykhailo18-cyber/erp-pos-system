import React, { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { loadShipments, loadZones } from '../../store/slices/shippingSlice';
import { Card, Pagination } from '../../components/ui';
import { MdLocalShipping } from 'react-icons/md';
import type { PaginationState } from '../../components/ui/Pagination';
import type { DeliveryStatus } from '../../types';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const ShipmentsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { shipments, zones } = useAppSelector((state) => state.shipping);
  const loading = useAppSelector((state) => state.ui.loading);

  const [filters, setFilters] = useState<{
    status?: DeliveryStatus;
    zone_id?: string;
  }>({});

  // Client-side pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Calculate paginated data
  const { paginatedData, pagination } = useMemo(() => {
    const total_items = shipments.length;
    const total_pages = Math.ceil(total_items / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      paginatedData: shipments.slice(startIndex, endIndex),
      pagination: {
        page,
        limit,
        total_items,
        total_pages,
      } as PaginationState,
    };
  }, [shipments, page, limit]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

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

  useEffect(() => {
    dispatch(loadShipments(filters));
    dispatch(loadZones());
  }, [dispatch, filters]);

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(value));
  };

  const getStatusBadge = (status: DeliveryStatus) => {
    const statusConfig = {
      PENDING: { label: 'Pendiente', color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' },
      PROCESSING: { label: 'Procesando', color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' },
      IN_TRANSIT: { label: 'En Tránsito', color: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200' },
      OUT_FOR_DELIVERY: { label: 'En Reparto', color: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' },
      DELIVERED: { label: 'Entregado', color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' },
      FAILED: { label: 'Fallido', color: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' },
      CANCELLED: { label: 'Cancelado', color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' },
    };

    const config = statusConfig[status] || statusConfig.PENDING;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="animate-fade-down duration-fast">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Envíos</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Gestiona y rastrea todos los envíos realizados
        </p>
      </div>

      {/* Filters */}
      <Card className="animate-fade-up duration-normal">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="animate-fade-right duration-fast">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estado
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as DeliveryStatus || undefined })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="PENDING">Pendiente</option>
              <option value="PROCESSING">Procesando</option>
              <option value="IN_TRANSIT">En Tránsito</option>
              <option value="OUT_FOR_DELIVERY">En Reparto</option>
              <option value="DELIVERED">Entregado</option>
              <option value="FAILED">Fallido</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>

          <div className="animate-fade-left duration-fast">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Zona
            </label>
            <select
              value={filters.zone_id || ''}
              onChange={(e) => setFilters({ ...filters, zone_id: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Todas las zonas</option>
              {zones.filter((z) => z.is_active).map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-up duration-normal">
        <Card className="animate-fade-right duration-fast">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Envíos</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {shipments.length}
          </div>
        </Card>

        <Card className="animate-fade-up duration-light-slow">
          <div className="text-sm text-gray-500 dark:text-gray-400">En Tránsito</div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {shipments.filter((s) => s.delivery_status === 'IN_TRANSIT' || s.delivery_status === 'OUT_FOR_DELIVERY').length}
          </div>
        </Card>

        <Card className="animate-fade-down duration-normal">
          <div className="text-sm text-gray-500 dark:text-gray-400">Entregados</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {shipments.filter((s) => s.delivery_status === 'DELIVERED').length}
          </div>
        </Card>

        <Card className="animate-fade-left duration-fast">
          <div className="text-sm text-gray-500 dark:text-gray-400">Pendientes</div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
            {shipments.filter((s) => s.delivery_status === 'PENDING' || s.delivery_status === 'PROCESSING').length}
          </div>
        </Card>
      </div>

      {/* Shipments Table */}
      <Card className="animate-fade-up duration-normal overflow-hidden relative">
        {loading && (
          <div className="absolute top-4 right-4 z-10">
            <div className="animate-spin rounded-full h-6 w-6 border-4 border-gray-300 border-t-primary-600"></div>
          </div>
        )}
        {!loading && shipments.length === 0 ? (
          <div className="text-center py-12">
            <MdLocalShipping className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay envíos</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Los envíos aparecerán aquí cuando se realicen ventas con entrega
            </p>
          </div>
        ) : (
          <div>
            {/* Top Pagination */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <PaginationNav />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-primary-600 dark:bg-primary-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Dirección
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Barrio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Costo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Fecha Estimada
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedData.map((shipment) => (
                    <tr
                      key={shipment.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {shipment.delivery_address}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {shipment.delivery_neighborhood}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {shipment.free_shipping_applied ? (
                            <span className="text-green-600 dark:text-green-400 font-medium">GRATIS</span>
                          ) : (
                            formatCurrency(shipment.total_shipping_cost)
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(shipment.delivery_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {shipment.estimated_delivery_date ? (
                            new Date(shipment.estimated_delivery_date).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })
                          ) : (
                            <span className="text-gray-400 dark:text-gray-600">—</span>
                          )}
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
        )}
      </Card>
    </div>
  );
};

export default ShipmentsPage;
