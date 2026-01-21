import React, { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchCategoryReport } from '../../store/slices/reportsSlice';
import Pagination, { type PaginationState } from '../../components/ui/Pagination';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const CategoryReport: React.FC = () => {
  const dispatch = useAppDispatch();
  const { categoryReport, error } = useAppSelector((state) => state.reports);
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
    const categories = categoryReport?.categories || [];
    const total_items = categories.length;
    const total_pages = Math.ceil(total_items / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      paginatedData: categories.slice(startIndex, endIndex),
      pagination: {
        page,
        limit,
        total_items,
        total_pages,
      } as PaginationState,
    };
  }, [categoryReport?.categories, page, limit]);

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
    dispatch(fetchCategoryReport(filters));
  }, [dispatch, filters]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };

  const formatPercent = (value: string | number) => {
    return `${typeof value === 'string' ? value : value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-down duration-fast">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Reporte de Ventas por Categoría</h2>

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
      ) : categoryReport ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-sm shadow-md p-6 text-white animate-fade-up duration-fast">
              <h3 className="text-sm font-medium opacity-90">Ingresos Totales</h3>
              <p className="text-2xl font-bold mt-2">{formatCurrency(categoryReport.totals.total_revenue)}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-sm shadow-md p-6 text-white animate-fade-up duration-normal">
              <h3 className="text-sm font-medium opacity-90">Costo Total</h3>
              <p className="text-2xl font-bold mt-2">{formatCurrency(categoryReport.totals.total_cost)}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-sm shadow-md p-6 text-white animate-fade-up duration-light-slow">
              <h3 className="text-sm font-medium opacity-90">Margen General</h3>
              <p className="text-2xl font-bold mt-2">{formatPercent(categoryReport.totals.overall_margin)}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-sm shadow-md p-6 text-white animate-fade-up duration-slow">
              <h3 className="text-sm font-medium opacity-90">Cantidad Total</h3>
              <p className="text-2xl font-bold mt-2">{categoryReport.totals.total_quantity.toLocaleString()}</p>
            </div>
          </div>

          {/* Category Table */}
          <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md overflow-hidden animate-fade-up duration-normal">
            {/* Top Pagination */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <PaginationNav />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-primary-600 dark:bg-primary-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Categoría</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Cantidad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Ingresos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Costo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Transacciones</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Venta Prom.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Margen %</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedData.map((category: any) => (
                    <tr key={category.category_id || 'uncategorized'} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{category.category_name}</div>
                        {category.category_description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">{category.category_description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{category.total_quantity.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(category.total_revenue)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(category.total_cost)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{category.transaction_count.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(category.avg_sale)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          parseFloat(category.margin_percent) >= 30 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          parseFloat(category.margin_percent) >= 20 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {formatPercent(category.margin_percent)}
                        </span>
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

export default CategoryReport;
