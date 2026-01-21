import React, { useState, useEffect } from 'react';
import reportService from '../../services/api/report.service';
import type { ConsolidatedDailyReportData, ConsolidatedBranchReport } from '../../types';

const ConsolidatedDailyReport: React.FC = () => {
  const [reportData, setReportData] = useState<ConsolidatedDailyReportData | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [selectedDate]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const response = await reportService.getConsolidatedDailyReport(selectedDate);
      if (response.success) {
        setReportData(response.data);
      }
    } catch (error) {
      console.error('Error loading consolidated report:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };

  const renderBranchSummary = (branch: ConsolidatedBranchReport) => {
    const hasCashDiscrepancy = branch.discrepancy_cash !== 0;
    const hasCardDiscrepancy = branch.discrepancy_card !== 0;
    const hasQrDiscrepancy = branch.discrepancy_qr !== 0;
    const hasTransferDiscrepancy = branch.discrepancy_transfer !== 0;

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
