import React, { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchPaymentMethodReport } from '../../store/slices/reportsSlice';
import Pagination, { type PaginationState } from '../../components/ui/Pagination';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const PaymentMethodReport: React.FC = () => {
  const dispatch = useAppDispatch();
  const { paymentMethodReport, error } = useAppSelector((state) => state.reports);
  const loading = useAppSelector((state) => state.ui.loading);

  const [filters, setFilters] = useState({
    branch_id: '',
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  // Client-side pagination for daily breakdown
  const [dailyPage, setDailyPage] = useState(1);
  const [dailyLimit, setDailyLimit] = useState(10);

  const { paginatedDailyData, dailyPagination } = useMemo(() => {
    const data = paymentMethodReport?.daily_breakdown || [];
    const total_items = data.length;
    const total_pages = Math.ceil(total_items / dailyLimit);
    const startIndex = (dailyPage - 1) * dailyLimit;
    const endIndex = startIndex + dailyLimit;

    return {
      paginatedDailyData: data.slice(startIndex, endIndex),
      dailyPagination: {
        page: dailyPage,
        limit: dailyLimit,
        total_items,
        total_pages,
      } as PaginationState,
    };
  }, [paymentMethodReport?.daily_breakdown, dailyPage, dailyLimit]);

  // Reset page when filters change
  useEffect(() => {
    setDailyPage(1);
  }, [filters]);

  // Pagination component for daily breakdown
  const DailyPaginationNav = () => (
    <Pagination
      pagination={dailyPagination}
      onPageChange={setDailyPage}
      onPageSizeChange={(limit) => { setDailyLimit(limit); setDailyPage(1); }}
      loading={loading}
      variant="extended"
      showPageSize
      pageSizeOptions={PAGE_SIZE_OPTIONS}
    />
  );

  useEffect(() => {
    dispatch(fetchPaymentMethodReport(filters));
  }, [dispatch, filters]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };

  const formatPercent = (value: string | number) => {
    return `${typeof value === 'string' ? value : value.toFixed(2)}%`;
  };

  const getMethodColor = (code: string) => {
    switch (code.toUpperCase()) {
      case 'CASH': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'CARD': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'QR': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'TRANSFER': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-down duration-fast">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Reporte de Métodos de Pago</h2>

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
      ) : paymentMethodReport ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-sm shadow-md p-6 text-white animate-fade-up duration-fast">
              <h3 className="text-sm font-medium opacity-90">Total Recaudado</h3>
              <p className="text-2xl font-bold mt-2">{formatCurrency(paymentMethodReport.summary.total_amount)}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-sm shadow-md p-6 text-white animate-fade-up duration-normal">
              <h3 className="text-sm font-medium opacity-90">Total Transacciones</h3>
              <p className="text-2xl font-bold mt-2">{paymentMethodReport.summary.total_transactions.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-sm shadow-md p-6 text-white animate-fade-up duration-light-slow">
              <h3 className="text-sm font-medium opacity-90">Ticket Promedio</h3>
              <p className="text-2xl font-bold mt-2">{formatCurrency(paymentMethodReport.summary.avg_transaction)}</p>
            </div>
          </div>

          {/* Payment Methods Table */}
          <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md overflow-hidden animate-fade-up duration-normal">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Distribución por Método de Pago</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-primary-600 dark:bg-primary-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Método</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Transacciones</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Promedio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Mínimo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Máximo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">% Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {paymentMethodReport.payments?.map((payment: any) => (
                    <tr key={payment.payment_method_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{payment.payment_method}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{payment.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMethodColor(payment.code)}`}>
                          {payment.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {payment.transaction_count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(payment.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(payment.avg_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(payment.min_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(payment.max_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900 dark:text-white mr-2">
                            {formatPercent(payment.percentage)}
                          </span>
                          <div className="w-16 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${parseFloat(payment.percentage)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily Breakdown */}
          {paymentMethodReport.daily_breakdown && paymentMethodReport.daily_breakdown.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md overflow-hidden animate-fade-up duration-normal">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Desglose Diario</h3>
              </div>

              {/* Top Pagination */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <DailyPaginationNav />
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-primary-600 dark:bg-primary-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Método</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Transacciones</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedDailyData.map((day: any) => (
                      <tr key={`${day.date}-${day.code}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(day.date).toLocaleDateString('es-AR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMethodColor(day.code)}`}>
                            {day.payment_method}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {day.transaction_count.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(day.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Pagination */}
              <div className="border-t border-gray-200 dark:border-gray-700">
                <DailyPaginationNav />
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default PaymentMethodReport;
