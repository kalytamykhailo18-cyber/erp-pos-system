import React, { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '../../store';
import { DailyReportData, ShiftReportData } from '../../types';
import reportService from '../../services/api/report.service';

const DailyReport: React.FC = () => {
  const { currentBranch } = useAppSelector((state) => state.auth);
  const [reportData, setReportData] = useState<DailyReportData | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const loadReport = useCallback(async () => {
    if (!currentBranch?.id) return;

    setLoading(true);
    try {
      const response = await reportService.getDailyReport(currentBranch.id, selectedDate);
      if (response.success) {
        setReportData(response.data);
      }
    } catch (error) {
      console.error('Error loading daily report:', error);
    } finally {
      setLoading(false);
    }
  }, [currentBranch?.id, selectedDate]);

  useEffect(() => {
    if (currentBranch?.id) {
      loadReport();
    }
  }, [currentBranch?.id, loadReport]);

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };

  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return '-';
    return timeString.substring(0, 5);
  };

  const getShiftLabel = (shiftType: string) => {
    const labels: { [key: string]: string } = {
      MORNING: 'Turno Mañana',
      AFTERNOON: 'Turno Tarde',
      FULL_DAY: 'Día Completo'
    };
    return labels[shiftType] || shiftType;
  };

  const renderShiftDetails = (shift: ShiftReportData) => {
    const hasCashDiscrepancy = shift.discrepancy_cash !== null && shift.discrepancy_cash !== 0;
    const hasCardDiscrepancy = shift.discrepancy_card !== null && shift.discrepancy_card !== 0;
    const hasQrDiscrepancy = shift.discrepancy_qr !== null && shift.discrepancy_qr !== 0;
    const hasTransferDiscrepancy = shift.discrepancy_transfer !== null && shift.discrepancy_transfer !== 0;

    return (
      <div key={shift.session_id} className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-up duration-normal">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {getShiftLabel(shift.shift_type)}
          </h3>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            shift.status === 'OPEN'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}>
            {shift.status === 'OPEN' ? 'Abierto' : 'Cerrado'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Abierto por:</p>
            <p className="font-medium text-gray-900 dark:text-white">{shift.opened_by || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Cerrado por:</p>
            <p className="font-medium text-gray-900 dark:text-white">{shift.closed_by || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Hora apertura:</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {new Date(shift.opened_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Hora cierre:</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {shift.closed_at ? new Date(shift.closed_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '-'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Ventas:</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{shift.sales_count}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Ingresos:</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(shift.total_revenue)}</p>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Detalle por Método de Pago</h4>

          {/* Total to Account For - Requirement Formula */}
          {shift.opening_cash !== null && shift.expected_cash !== null && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Total a Rendir</p>
                  <p className="text-xs text-blue-700 dark:text-blue-400">(Ventas en Efectivo - Gastos/Retiros - Vueltos como Crédito)</p>
                </div>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-200">
                  {formatCurrency(shift.expected_cash - shift.opening_cash)}
                </p>
              </div>
            </div>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 text-gray-600 dark:text-gray-400">Método</th>
                <th className="text-right py-2 text-gray-600 dark:text-gray-400">Esperado</th>
                <th className="text-right py-2 text-gray-600 dark:text-gray-400">Declarado</th>
                <th className="text-right py-2 text-gray-600 dark:text-gray-400">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              <tr className={`border-b border-gray-100 dark:border-gray-800 ${hasCashDiscrepancy ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                <td className="py-2 font-medium text-gray-900 dark:text-white">Efectivo</td>
                <td className="text-right text-gray-900 dark:text-white">{formatCurrency(shift.expected_cash)}</td>
                <td className="text-right text-gray-900 dark:text-white">{formatCurrency(shift.declared_cash)}</td>
                <td className={`text-right font-medium ${hasCashDiscrepancy ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                  {formatCurrency(shift.discrepancy_cash)}
                </td>
              </tr>
              <tr className={`border-b border-gray-100 dark:border-gray-800 ${hasCardDiscrepancy ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                <td className="py-2 font-medium text-gray-900 dark:text-white">Tarjeta</td>
                <td className="text-right text-gray-900 dark:text-white">{formatCurrency(shift.expected_card)}</td>
                <td className="text-right text-gray-900 dark:text-white">{formatCurrency(shift.declared_card)}</td>
                <td className={`text-right font-medium ${hasCardDiscrepancy ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                  {formatCurrency(shift.discrepancy_card)}
                </td>
              </tr>
              <tr className={`border-b border-gray-100 dark:border-gray-800 ${hasQrDiscrepancy ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                <td className="py-2 font-medium text-gray-900 dark:text-white">QR</td>
                <td className="text-right text-gray-900 dark:text-white">{formatCurrency(shift.expected_qr)}</td>
                <td className="text-right text-gray-900 dark:text-white">{formatCurrency(shift.declared_qr)}</td>
                <td className={`text-right font-medium ${hasQrDiscrepancy ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                  {formatCurrency(shift.discrepancy_qr)}
                </td>
              </tr>
              <tr className={hasTransferDiscrepancy ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                <td className="py-2 font-medium text-gray-900 dark:text-white">Transferencia</td>
                <td className="text-right text-gray-900 dark:text-white">{formatCurrency(shift.expected_transfer)}</td>
                <td className="text-right text-gray-900 dark:text-white">{formatCurrency(shift.declared_transfer)}</td>
                <td className={`text-right font-medium ${hasTransferDiscrepancy ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                  {formatCurrency(shift.discrepancy_transfer)}
                </td>
              </tr>
            </tbody>
          </table>

          {shift.voided_sales_count > 0 && (
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded text-sm">
              <span className="text-yellow-800 dark:text-yellow-300">
                ⚠️ {shift.voided_sales_count} venta(s) anulada(s) en este turno
              </span>
            </div>
          )}
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
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reporte Diario por Turnos</h2>
            {reportData?.branch && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {reportData.branch.name} - Horarios: {formatTime(reportData.branch.midday_closing_time)} / {formatTime(reportData.branch.evening_closing_time)}
              </p>
            )}
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

      {reportData && reportData.shifts && reportData.shifts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reportData.shifts.map(shift => renderShiftDetails(shift))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-up duration-slow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Totales del Día</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Efectivo</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(reportData.daily_totals.total_cash)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Tarjeta</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(reportData.daily_totals.total_card)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total QR</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(reportData.daily_totals.total_qr)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Transferencia</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(reportData.daily_totals.total_transfer)}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Diferencia Efectivo</p>
                  <p className={`text-lg font-bold ${reportData.daily_totals.total_discrepancy_cash !== 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    {formatCurrency(reportData.daily_totals.total_discrepancy_cash)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Diferencia Tarjeta</p>
                  <p className={`text-lg font-bold ${reportData.daily_totals.total_discrepancy_card !== 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    {formatCurrency(reportData.daily_totals.total_discrepancy_card)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Diferencia QR</p>
                  <p className={`text-lg font-bold ${reportData.daily_totals.total_discrepancy_qr !== 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    {formatCurrency(reportData.daily_totals.total_discrepancy_qr)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Diferencia Transferencia</p>
                  <p className={`text-lg font-bold ${reportData.daily_totals.total_discrepancy_transfer !== 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    {formatCurrency(reportData.daily_totals.total_discrepancy_transfer)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Ingresos del Día</span>
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {formatCurrency(reportData.sales.total_revenue)}
                </span>
              </div>
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

export default DailyReport;
