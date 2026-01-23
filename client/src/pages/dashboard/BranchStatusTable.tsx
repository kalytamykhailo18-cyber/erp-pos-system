import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { loadLiveBranchShiftStatus } from '../../store/slices/reportsSlice';
import type { LiveBranchStatus } from '../../types';

const BranchStatusTable: React.FC = () => {
  const dispatch = useAppDispatch();
  const { liveBranchShiftStatus: data, error } = useAppSelector((state) => state.reports);
  const loading = useAppSelector((state) => state.ui.loading);

  useEffect(() => {
    // Load data on mount
    dispatch(loadLiveBranchShiftStatus());

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      dispatch(loadLiveBranchShiftStatus());
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return 'Hoy';
  };

  const getBranchSummary = (branch: LiveBranchStatus) => {
    // Determine overall branch status
    const hasOpenSession = branch.sessions.some(s => s.status === 'OPEN');
    const status = hasOpenSession ? 'OPEN' : 'CLOSED';

    // Get current cashier (from open session)
    const openSession = branch.sessions.find(s => s.status === 'OPEN');
    const currentCashier = openSession?.opened_by || '-';

    // Calculate total sales today (sum all sessions)
    const totalSalesToday = branch.sessions.reduce((sum, session) => sum + session.total_revenue, 0);

    // Get last update time (most recent session activity)
    let lastUpdate = 'Sin actividad';
    if (branch.sessions.length > 0) {
      const mostRecentSession = branch.sessions.reduce((latest, session) => {
        const latestTime = latest.closed_at || latest.opened_at;
        const sessionTime = session.closed_at || session.opened_at;
        return new Date(sessionTime) > new Date(latestTime) ? session : latest;
      });
      const updateTime = mostRecentSession.closed_at || mostRecentSession.opened_at;
      lastUpdate = status === 'CLOSED' && mostRecentSession.closed_at
        ? `Cerrado ${getTimeAgo(mostRecentSession.closed_at)}`
        : getTimeAgo(updateTime);
    }

    return { status, currentCashier, totalSalesToday, lastUpdate };
  };

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-up duration-normal">
        <div className="text-center text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  const branchSummaries = data?.branches.map(getBranchSummary) || [];
  const totalToday = branchSummaries.reduce((sum, branch) => sum + branch.totalSalesToday, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-up duration-normal relative">
      {loading && (
        <div className="absolute top-4 right-4 z-10">
          <div className="animate-spin rounded-full h-5 w-5 border-4 border-gray-300 border-t-primary-600"></div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Estado de Sucursales - HOY
        </h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {data?.date && new Date(data.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Branch Status Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Sucursal</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Estado</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Cajero Actual</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Ventas Hoy</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Última Act.</th>
            </tr>
          </thead>
          <tbody>
            {data?.branches.map((branch, index) => {
              const summary = branchSummaries[index];
              return (
                <tr key={branch.branch_id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900 dark:text-white">{branch.branch_name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{branch.branch_code}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      summary.status === 'OPEN'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {summary.status === 'OPEN' ? 'ABIERTO' : 'CERRADO'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">
                    {summary.currentCashier}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(summary.totalSalesToday)}
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-gray-600 dark:text-gray-400">
                    {summary.lastUpdate}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
              <td colSpan={3} className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white">
                TOTAL HOY:
              </td>
              <td className="py-3 px-4 text-right font-bold text-lg text-primary-600 dark:text-primary-400">
                {formatCurrency(totalToday)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Actualización automática cada 30 segundos
        </p>
      </div>
    </div>
  );
};

export default BranchStatusTable;
