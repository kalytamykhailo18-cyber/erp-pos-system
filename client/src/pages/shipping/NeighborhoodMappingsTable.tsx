import React, { useState, useMemo } from 'react';
import type { NeighborhoodMapping, ShippingZone } from '../../types';
import { Pagination } from '../../components/ui';
import type { PaginationState } from '../../components/ui/Pagination';
import { MdHome } from 'react-icons/md';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

interface NeighborhoodMappingsTableProps {
  neighborhoods: NeighborhoodMapping[];
  zones: ShippingZone[];
  loading: boolean;
  onEdit: (mapping: NeighborhoodMapping) => void;
  onDelete: (id: string) => void;
}

export const NeighborhoodMappingsTable: React.FC<NeighborhoodMappingsTableProps> = ({
  neighborhoods,
  zones,
  loading,
  onEdit,
  onDelete,
}) => {
  // Client-side pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Calculate paginated data
  const { paginatedData, pagination } = useMemo(() => {
    const total_items = neighborhoods.length;
    const total_pages = Math.ceil(total_items / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      paginatedData: neighborhoods.slice(startIndex, endIndex),
      pagination: {
        page,
        limit,
        total_items,
        total_pages,
      } as PaginationState,
    };
  }, [neighborhoods, page, limit]);

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

  const getZoneName = (zoneId: string) => {
    const zone = zones.find((z) => z.id === zoneId);
    return zone?.name || 'Zona desconocida';
  };

  if (!loading && neighborhoods.length === 0) {
    return (
      <div className="text-center py-12">
        <MdHome className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay mapeos de barrios</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Comienza creando un nuevo mapeo de barrio
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
                Barrio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Código Postal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Ciudad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Zona de Envío
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
            {paginatedData.map((mapping) => (
              <tr
                key={mapping.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {mapping.neighborhood_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {mapping.postal_code || (
                      <span className="text-gray-400 dark:text-gray-600">—</span>
                    )}
                  </div>
                  {mapping.postal_code_pattern && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Patrón: {mapping.postal_code_pattern}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {mapping.city || <span className="text-gray-400 dark:text-gray-600">—</span>}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
                    {getZoneName(mapping.shipping_zone_id)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {mapping.is_active ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                      Inactivo
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(mapping)}
                    className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(mapping.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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
