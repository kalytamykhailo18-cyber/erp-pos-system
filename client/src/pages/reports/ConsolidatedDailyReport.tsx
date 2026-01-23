import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { loadConsolidatedDailyReport } from '../../store/slices/reportsSlice';
import type { ConsolidatedBranchReport } from '../../types';

const ConsolidatedDailyReport: React.FC = () => {
  const dispatch = useAppDispatch();
  const { consolidatedDailyReport: reportData } = useAppSelector((state) => state.reports);
  const loading = useAppSelector((state) => state.ui.loading);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    dispatch(loadConsolidatedDailyReport(selectedDate));
  }, [selectedDate, dispatch]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };

  const renderBranchSummary = (branch: ConsolidatedBranchReport) => {
    const hasCashDiscrepancy = branch.discrepancy_cash !== 0;
    const hasCardDiscrepancy = branch.discrepancy_card !== 0;
    const hasQrDiscrepancy = branch.discrepancy_qr !== 0;
    const hasTransferDiscrepancy = branch.discrepancy_transfer !== 0;

    // Calculate total withdrawals from all sessions
    const totalWithdrawals = branch.sessions?.reduce((sum, session: any) => {
      if (session.withdrawals && Array.isArray(session.withdrawals)) {
        return sum + session.withdrawals.reduce((s: number, w: any) => s + parseFloat(String(w.amount)), 0);
      }
      return sum;
    }, 0) || 0;

    const hasWithdrawals = totalWithdrawals > 0;

    return (
      <div key={branch.branch_id} className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-4 animate-fade-up duration-normal">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {branch.branch_name}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {branch.branch_code} • {branch.sessions.length} turno(s)
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Ventas</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{branch.sales_count}</p>
          </div>
        </div>

        <table className="w-full text-sm mb-3">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 text-gray-600 dark:text-gray-400">Método</th>
              <th className="text-right py-2 text-gray-600 dark:text-gray-400">Total</th>
              <th className="text-right py-2 text-gray-600 dark:text-gray-400">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            <tr className={`border-b border-gray-100 dark:border-gray-800 ${hasCashDiscrepancy ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
              <td className="py-2 font-medium text-gray-900 dark:text-white">Efectivo</td>
              <td className="text-right text-gray-900 dark:text-white">{formatCurrency(branch.total_cash)}</td>
              <td className={`text-right font-medium ${hasCashDiscrepancy ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                {formatCurrency(branch.discrepancy_cash)}
              </td>
            </tr>
            <tr className={`border-b border-gray-100 dark:border-gray-800 ${hasCardDiscrepancy ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
              <td className="py-2 font-medium text-gray-900 dark:text-white">Tarjeta</td>
              <td className="text-right text-gray-900 dark:text-white">{formatCurrency(branch.total_card)}</td>
              <td className={`text-right font-medium ${hasCardDiscrepancy ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                {formatCurrency(branch.discrepancy_card)}
              </td>
            </tr>
            <tr className={`border-b border-gray-100 dark:border-gray-800 ${hasQrDiscrepancy ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
              <td className="py-2 font-medium text-gray-900 dark:text-white">QR</td>
              <td className="text-right text-gray-900 dark:text-white">{formatCurrency(branch.total_qr)}</td>
              <td className={`text-right font-medium ${hasQrDiscrepancy ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                {formatCurrency(branch.discrepancy_qr)}
              </td>
            </tr>
            <tr className={hasTransferDiscrepancy ? 'bg-red-50 dark:bg-red-900/10' : ''}>
              <td className="py-2 font-medium text-gray-900 dark:text-white">Transferencia</td>
              <td className="text-right text-gray-900 dark:text-white">{formatCurrency(branch.total_transfer)}</td>
              <td className={`text-right font-medium ${hasTransferDiscrepancy ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                {formatCurrency(branch.discrepancy_transfer)}
              </td>
            </tr>
          </tbody>
        </table>

        {hasWithdrawals && (
          <div className="mb-2 p-2 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded">
            <div className="flex items-center justify-between text-xs">
              <span className="text-orange-700 dark:text-orange-300 font-medium">
                💰 Retiros de Caja
              </span>
              <span className="text-orange-900 dark:text-orange-200 font-bold">
                {formatCurrency(totalWithdrawals)}
              </span>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Ingresos</span>
            <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
              {formatCurrency(branch.total_revenue)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 relative">
      {loading && (
        <div className="absolute top-4 right-4 z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-4 border-gray-300 border-t-primary-600"></div>
        </div>
      )}
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-down duration-fast">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reporte Consolidado - Todas las Sucursales</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Vista consolidada del día seleccionado
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {reportData && reportData.branches.length > 0 ? (
        <>
          {/* Consolidated Totals */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 rounded-sm shadow-lg p-6 animate-fade-up duration-normal">
            <h3 className="text-xl font-bold text-white mb-4">Totales Consolidados</h3>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="bg-white/10 backdrop-blur-sm rounded p-3">
                <p className="text-xs text-white/80 mb-1">Efectivo</p>
                <p className="text-lg font-bold text-white">{formatCurrency(reportData.consolidated.total_cash)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded p-3">
                <p className="text-xs text-white/80 mb-1">Tarjeta</p>
                <p className="text-lg font-bold text-white">{formatCurrency(reportData.consolidated.total_card)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded p-3">
                <p className="text-xs text-white/80 mb-1">QR</p>
                <p className="text-lg font-bold text-white">{formatCurrency(reportData.consolidated.total_qr)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded p-3">
                <p className="text-xs text-white/80 mb-1">Transferencia</p>
                <p className="text-lg font-bold text-white">{formatCurrency(reportData.consolidated.total_transfer)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded p-3">
                <p className="text-xs text-white/80 mb-1">Ventas</p>
                <p className="text-lg font-bold text-white">{reportData.consolidated.total_sales}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`rounded p-3 ${reportData.consolidated.total_discrepancy_cash !== 0 ? 'bg-red-500/20' : 'bg-white/10'} backdrop-blur-sm`}>
                <p className="text-xs text-white/80 mb-1">Dif. Efectivo</p>
                <p className={`text-lg font-bold ${reportData.consolidated.total_discrepancy_cash !== 0 ? 'text-red-100' : 'text-white'}`}>
                  {formatCurrency(reportData.consolidated.total_discrepancy_cash)}
                </p>
              </div>
              <div className={`rounded p-3 ${reportData.consolidated.total_discrepancy_card !== 0 ? 'bg-red-500/20' : 'bg-white/10'} backdrop-blur-sm`}>
                <p className="text-xs text-white/80 mb-1">Dif. Tarjeta</p>
                <p className={`text-lg font-bold ${reportData.consolidated.total_discrepancy_card !== 0 ? 'text-red-100' : 'text-white'}`}>
                  {formatCurrency(reportData.consolidated.total_discrepancy_card)}
                </p>
              </div>
              <div className={`rounded p-3 ${reportData.consolidated.total_discrepancy_qr !== 0 ? 'bg-red-500/20' : 'bg-white/10'} backdrop-blur-sm`}>
                <p className="text-xs text-white/80 mb-1">Dif. QR</p>
                <p className={`text-lg font-bold ${reportData.consolidated.total_discrepancy_qr !== 0 ? 'text-red-100' : 'text-white'}`}>
                  {formatCurrency(reportData.consolidated.total_discrepancy_qr)}
                </p>
              </div>
              <div className={`rounded p-3 ${reportData.consolidated.total_discrepancy_transfer !== 0 ? 'bg-red-500/20' : 'bg-white/10'} backdrop-blur-sm`}>
                <p className="text-xs text-white/80 mb-1">Dif. Transferencia</p>
                <p className={`text-lg font-bold ${reportData.consolidated.total_discrepancy_transfer !== 0 ? 'text-red-100' : 'text-white'}`}>
                  {formatCurrency(reportData.consolidated.total_discrepancy_transfer)}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center justify-between">
                <span className="text-xl font-semibold text-white">Total Ingresos del Día</span>
                <span className="text-3xl font-bold text-white">
                  {formatCurrency(reportData.consolidated.total_revenue)}
                </span>
              </div>
            </div>
          </div>

          {/* Per-Branch Breakdown */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Detalle por Sucursal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {reportData.branches.map(renderBranchSummary)}
            </div>
          </div>

          {/* Top Selling Products */}
          {reportData.top_products && reportData.top_products.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-up duration-light-slow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top 10 Productos del Día</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Producto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">SKU</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Cantidad</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {reportData.top_products.map((product, index) => (
                      <tr key={product.sku} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{index + 1}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{product.product_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{product.sku}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">{product.total_quantity}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-primary-600 dark:text-primary-400">{formatCurrency(product.total_revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Alerts Summary */}
          {reportData.alerts_summary && reportData.alerts_summary.total_alerts > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-up duration-slow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resumen de Alertas del Día</h3>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total de Alertas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.alerts_summary.total_alerts}</p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Críticas</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">{reportData.alerts_summary.by_severity.CRITICAL || 0}</p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Altas</p>
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{reportData.alerts_summary.by_severity.HIGH || 0}</p>
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Medias</p>
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{reportData.alerts_summary.by_severity.MEDIUM || 0}</p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bajas</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{reportData.alerts_summary.by_severity.LOW || 0}</p>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Por Tipo de Alerta</h4>
                <div className="space-y-2">
                  {reportData.alerts_summary.by_type.map((alert, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          alert.severity === 'CRITICAL' ? 'bg-red-200 dark:bg-red-900/40 text-red-800 dark:text-red-200' :
                          alert.severity === 'HIGH' ? 'bg-orange-200 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200' :
                          alert.severity === 'MEDIUM' ? 'bg-yellow-200 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200' :
                          'bg-blue-200 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200'
                        }`}>
                          {alert.severity}
                        </span>
                        <span className="text-sm text-gray-900 dark:text-white">{alert.alert_type.replace(/_/g, ' ')}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{alert.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">No hay datos para esta fecha</p>
        </div>
      )}
    </div>
  );
};

export default ConsolidatedDailyReport;
