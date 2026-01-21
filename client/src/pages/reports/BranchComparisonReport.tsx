import React, { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchBranchComparisonReport } from '../../store/slices/reportsSlice';
import Pagination, { type PaginationState } from '../../components/ui/Pagination';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const BranchComparisonReport: React.FC = () => {
  const dispatch = useAppDispatch();
  const { branchComparisonReport, error } = useAppSelector((state) => state.reports);
  const loading = useAppSelector((state) => state.ui.loading);

  const [filters, setFilters] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  // Client-side pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Calculate paginated data
  const { paginatedData, pagination } = useMemo(() => {
    const branches = branchComparisonReport?.branches || [];
    const total_items = branches.length;
    const total_pages = Math.ceil(total_items / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      paginatedData: branches.slice(startIndex, endIndex),
      pagination: {
        page,
        limit,
        total_items,
        total_pages,
      } as PaginationState,
    };
  }, [branchComparisonReport?.branches, page, limit]);

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
    dispatch(fetchBranchComparisonReport(filters));
  }, [dispatch, filters]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };

  const formatPercent = (value: string | number) => {
    return `${typeof value === 'string' ? value : value.toFixed(2)}%`;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (rank === 2) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    if (rank === 3) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-down duration-fast">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Comparación de Sucursales</h2>

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
      ) : branchComparisonReport ? (
        <>
          {/* Consolidated Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-sm shadow-md p-6 text-white animate-fade-up duration-fast">
              <h3 className="text-sm font-medium opacity-90">Ingresos Totales</h3>
              <p className="text-2xl font-bold mt-2">{formatCurrency(branchComparisonReport.consolidated.total_revenue)}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-sm shadow-md p-6 text-white animate-fade-up duration-normal">
              <h3 className="text-sm font-medium opacity-90">Ventas Totales</h3>
              <p className="text-2xl font-bold mt-2">{branchComparisonReport.consolidated.total_sales.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-sm shadow-md p-6 text-white animate-fade-up duration-light-slow">
              <h3 className="text-sm font-medium opacity-90">Valor Inventario</h3>
              <p className="text-2xl font-bold mt-2">{formatCurrency(branchComparisonReport.consolidated.total_inventory_value)}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-sm shadow-md p-6 text-white animate-fade-up duration-slow">
              <h3 className="text-sm font-medium opacity-90">Sucursales</h3>
              <p className="text-2xl font-bold mt-2">{branchComparisonReport.consolidated.branch_count}</p>
            </div>
          </div>

          {/* Branch Comparison Table */}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Ventas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Ingresos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Ticket Prom.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">% Ingresos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Inventario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Discrepancias</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Producto Top</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedData.map((branch: any) => (
                    <tr key={branch.branch_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{branch.branch_name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{branch.branch_code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {branch.sales.total_sales.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(branch.sales.total_revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(branch.sales.avg_ticket)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900 dark:text-white mr-2">
                            {formatPercent(branch.revenue_percentage)}
                          </span>
                          <div className="w-16 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${parseFloat(branch.revenue_percentage)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{formatCurrency(branch.inventory.cost_value)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{branch.inventory.unique_products} productos</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${branch.discrepancies.total_discrepancy !== 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          {formatCurrency(branch.discrepancies.total_discrepancy)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{branch.discrepancies.session_count} sesiones</div>
                      </td>
                      <td className="px-6 py-4">
                        {branch.top_product ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{branch.top_product.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{branch.top_product.sku}</div>
                            <div className="text-sm text-green-600 dark:text-green-400">{formatCurrency(branch.top_product.revenue)}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">N/A</span>
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

          {/* Rankings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* By Revenue */}
            <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-up duration-normal">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ranking por Ingresos</h3>
              <div className="space-y-3">
                {branchComparisonReport.rankings?.by_revenue?.slice(0, 5).map((branch: any, idx: number) => (
                  <div key={branch.branch_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-sm">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold mr-3 ${getRankBadge(idx + 1)}`}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{branch.branch_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{branch.branch_code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(branch.sales.total_revenue)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatPercent(branch.revenue_percentage)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By Sales Count */}
            <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-up duration-normal">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ranking por Cantidad de Ventas</h3>
              <div className="space-y-3">
                {branchComparisonReport.rankings?.by_sales_count?.slice(0, 5).map((branch: any, idx: number) => (
                  <div key={branch.branch_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-sm">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold mr-3 ${getRankBadge(idx + 1)}`}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{branch.branch_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{branch.branch_code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{branch.sales.total_sales.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatPercent(branch.sales_percentage)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By Average Ticket */}
            <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-up duration-normal">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ranking por Ticket Promedio</h3>
              <div className="space-y-3">
                {branchComparisonReport.rankings?.by_avg_ticket?.slice(0, 5).map((branch: any, idx: number) => (
                  <div key={branch.branch_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-sm">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold mr-3 ${getRankBadge(idx + 1)}`}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{branch.branch_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{branch.branch_code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(branch.sales.avg_ticket)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By Inventory Value */}
            <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-up duration-normal">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ranking por Valor de Inventario</h3>
              <div className="space-y-3">
                {branchComparisonReport.rankings?.by_inventory_value?.slice(0, 5).map((branch: any, idx: number) => (
                  <div key={branch.branch_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-sm">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold mr-3 ${getRankBadge(idx + 1)}`}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{branch.branch_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{branch.branch_code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(branch.inventory.cost_value)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{branch.inventory.unique_products} productos</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default BranchComparisonReport;
