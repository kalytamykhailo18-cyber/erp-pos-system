import React, { useState, useMemo } from 'react';
import type { ShippingZone } from '../../types';
import { Pagination } from '../../components/ui';
import type { PaginationState } from '../../components/ui/Pagination';
import { MdLocationOn } from 'react-icons/md';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

interface ShippingZonesTableProps {
  zones: ShippingZone[];
  loading: boolean;
  onEdit: (zone: ShippingZone) => void;
  onDelete: (id: string) => void;
  getNeighborhoodCount: (zoneId: string) => number;
}

export const ShippingZonesTable: React.FC<ShippingZonesTableProps> = ({
  zones,
  loading,
  onEdit,
  onDelete,
  getNeighborhoodCount,
}) => {
  // Client-side pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Calculate paginated data
  const { paginatedData, pagination } = useMemo(() => {
    const total_items = zones.length;
    const total_pages = Math.ceil(total_items / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      paginatedData: zones.slice(startIndex, endIndex),
      pagination: {
        page,
        limit,
        total_items,
        total_pages,
      } as PaginationState,
    };
  }, [zones, page, limit]);

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

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(value));
  };

  if (!loading && zones.length === 0) {
    return (
      <div className="text-center py-12">
        <MdLocationOn className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay zonas de envío</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Comienza creando una nueva zona de envío
        </p>
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
                Zona
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Tarifa Base
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Envío Gratis Desde
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Recargo por Peso
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Express
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Barrios
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map((zone) => (
              <tr
                key={zone.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {zone.name}
                </div>
                {zone.description && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {zone.description}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {Number(zone.base_rate) === 0 ? (
                    <span className="text-green-600 dark:text-green-400 font-medium">GRATIS</span>
                  ) : (
                    formatCurrency(zone.base_rate)
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {zone.free_shipping_threshold ? (
                    formatCurrency(zone.free_shipping_threshold)
                  ) : (
                    <span className="text-gray-400 dark:text-gray-600">—</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {zone.weight_surcharge_per_kg && Number(zone.weight_surcharge_per_kg) > 0 ? (
                    `${formatCurrency(zone.weight_surcharge_per_kg)}/kg`
                  ) : (
                    <span className="text-gray-400 dark:text-gray-600">—</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {zone.express_surcharge && Number(zone.express_surcharge) > 0 ? (
                    formatCurrency(zone.express_surcharge)
                  ) : (
                    <span className="text-gray-400 dark:text-gray-600">—</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {getNeighborhoodCount(zone.id)} barrios
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {zone.is_active ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                    Activa
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                    Inactiva
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onEdit(zone)}
                  className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4 transition-colors duration-fast"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(zone.id)}
                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-fast"
                >
                  Eliminar
                </button>
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
