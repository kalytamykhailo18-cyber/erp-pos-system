import React, { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchDiscrepancyReport } from '../../store/slices/reportsSlice';
import Pagination, { type PaginationState } from '../../components/ui/Pagination';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const DiscrepancyReport: React.FC = () => {
  const dispatch = useAppDispatch();
  const { discrepancyReport, error } = useAppSelector((state) => state.reports);
  const loading = useAppSelector((state) => state.ui.loading);

  const [filters, setFilters] = useState({
    branch_id: '',
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  // Client-side pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Calculate paginated data
  const { paginatedData, pagination } = useMemo(() => {
    const discrepancies = discrepancyReport?.discrepancies || [];
    const total_items = discrepancies.length;
    const total_pages = Math.ceil(total_items / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      paginatedData: discrepancies.slice(startIndex, endIndex),
      pagination: {
        page,
        limit,
        total_items,
        total_pages,
      } as PaginationState,
    };
  }, [discrepancyReport?.discrepancies, page, limit]);

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
    dispatch(fetchDiscrepancyReport(filters));
  }, [dispatch, filters]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDiscrepancyColor = (amount: number) => {
    if (Math.abs(amount) < 100) return 'text-yellow-600 dark:text-yellow-400';
    if (Math.abs(amount) < 500) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400 font-bold';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-down duration-fast">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Reporte de Discrepancias de Caja</h2>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col flex-1 animate-flip-up duration-fast">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Desde:
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col flex-1 animate-flip-up duration-normal">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hasta:
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-sm p-4 animate-fade-up duration-fast">
          <p className="text-red-800 dark:text-red-200">Error: {error}</p>
        </div>
      ) : discrepancyReport ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-sm shadow-md p-6 text-white animate-fade-up duration-fast">
              <h3 className="text-sm font-medium opacity-90">Sesiones con Discrepancia</h3>
              <p className="text-2xl font-bold mt-2">{discrepancyReport.summary.total_sessions_with_discrepancy}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-sm shadow-md p-6 text-white animate-fade-up duration-normal">
              <h3 className="text-sm font-medium opacity-90">Discrepancia Total</h3>
              <p className="text-2xl font-bold mt-2">{formatCurrency(discrepancyReport.summary.total_discrepancy_overall)}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-sm shadow-md p-6 text-white animate-fade-up duration-light-slow">
              <h3 className="text-sm font-medium opacity-90">Efectivo</h3>
              <p className="text-2xl font-bold mt-2">{formatCurrency(discrepancyReport.summary.total_discrepancy_cash)}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-sm shadow-md p-6 text-white animate-fade-up duration-slow">
              <h3 className="text-sm font-medium opacity-90">Promedio por Sesión</h3>
              <p className="text-2xl font-bold mt-2">{formatCurrency(discrepancyReport.summary.avg_discrepancy)}</p>
            </div>
          </div>

          {/* By Branch Summary */}
          {discrepancyReport.by_branch && discrepancyReport.by_branch.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-up duration-normal">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resumen por Sucursal</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {discrepancyReport.by_branch.map((branch: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded-sm p-4 animate-zoom-in duration-fast">
                    <h4 className="font-medium text-gray-900 dark:text-white">{branch.branch}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Sesiones: {branch.count}
                    </p>
                    <p className={`text-lg font-bold mt-2 ${getDiscrepancyColor(branch.total_discrepancy)}`}>
                      {formatCurrency(branch.total_discrepancy)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discrepancies Table */}
          <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md overflow-hidden animate-fade-up duration-normal">
            {/* Top Pagination */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <PaginationNav />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-primary-600 dark:bg-primary-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Sucursal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Turno</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Cajero</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Efectivo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Tarjeta</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">QR</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Transferencia</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedData.map((disc: any) => (
                    <tr key={disc.session_id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${Math.abs(disc.total_discrepancy) > 500 ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{disc.branch}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{disc.branch_code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{disc.business_date}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDateTime(disc.opened_at)} - {disc.closed_at ? formatDateTime(disc.closed_at) : 'Abierta'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {disc.shift_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{disc.opened_by || 'N/A'}</div>
                        {disc.closed_by && disc.closed_by !== disc.opened_by && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">Cerrado: {disc.closed_by}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">Esp: {formatCurrency(disc.expected_cash)}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Dec: {formatCurrency(disc.declared_cash)}</div>
                        <div className={`text-sm font-medium ${getDiscrepancyColor(disc.discrepancy_cash)}`}>
                          {formatCurrency(disc.discrepancy_cash)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">Esp: {formatCurrency(disc.expected_card)}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Dec: {formatCurrency(disc.declared_card)}</div>
                        <div className={`text-sm font-medium ${getDiscrepancyColor(disc.discrepancy_card)}`}>
                          {formatCurrency(disc.discrepancy_card)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">Esp: {formatCurrency(disc.expected_qr)}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Dec: {formatCurrency(disc.declared_qr)}</div>
                        <div className={`text-sm font-medium ${getDiscrepancyColor(disc.discrepancy_qr)}`}>
                          {formatCurrency(disc.discrepancy_qr)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">Esp: {formatCurrency(disc.expected_transfer)}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Dec: {formatCurrency(disc.declared_transfer)}</div>
                        <div className={`text-sm font-medium ${getDiscrepancyColor(disc.discrepancy_transfer)}`}>
                          {formatCurrency(disc.discrepancy_transfer)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-lg font-bold ${getDiscrepancyColor(disc.total_discrepancy)}`}>
                          {formatCurrency(disc.total_discrepancy)}
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
        </>
      ) : null}
    </div>
  );
};

export default DiscrepancyReport;
