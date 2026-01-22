import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { loadLiveBranchShiftStatus } from '../../store/slices/reportsSlice';
import type { LiveBranchStatus, LiveBranchShiftSession } from '../../types';

const BranchShiftStatus: React.FC = () => {
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
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  const getShiftLabel = (shiftType: string) => {
    const labels: { [key: string]: string } = {
      MORNING: 'Mañana',
      AFTERNOON: 'Tarde',
      FULL_DAY: 'Día Completo'
    };
    return labels[shiftType] || shiftType;
  };

  const getStatusColor = (status: string) => {
    return status === 'OPEN'
      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  };

  const renderSession = (session: LiveBranchShiftSession) => {
    return (
      <div key={session.session_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {getShiftLabel(session.shift_type)}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(session.status)}`}>
              {session.status === 'OPEN' ? 'Abierto' : 'Cerrado'}
            </span>
          </div>
          {session.opened_by && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Cajero: {session.opened_by}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {session.sales_count} ventas
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {formatCurrency(session.total_revenue)}
          </p>
        </div>
      </div>
    );
  };

  const renderBranch = (branch: LiveBranchStatus) => {
    return (
      <div key={branch.branch_id} className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {branch.branch_name}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Horarios: {formatTime(branch.midday_closing_time)} / {formatTime(branch.evening_closing_time)}
            </p>
          </div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {branch.branch_code}
          </span>
        </div>

        <div className="space-y-2">
          {branch.sessions.length > 0 ? (
            branch.sessions.map(renderSession)
          ) : (
            <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
              No hay turnos abiertos hoy
            </div>
          )}
        </div>

        {branch.has_shift_change && branch.sessions.length === 0 && (
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            Esta sucursal tiene cambio de turno al mediodía
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-up duration-normal">
        <div className="text-center text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-up duration-normal relative">
      {loading && (
        <div className="absolute top-4 right-4 z-10">
          <div className="animate-spin rounded-full h-5 w-5 border-4 border-gray-300 border-t-primary-600"></div>
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Estado de Turnos por Sucursal
        </h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Hoy: {data?.date && new Date(data.date).toLocaleDateString('es-AR')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data?.branches.map(renderBranch)}
      </div>
    </div>
  );
};

export default BranchShiftStatus;
