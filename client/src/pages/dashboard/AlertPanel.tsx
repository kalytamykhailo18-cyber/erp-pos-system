import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchUnreadCount, markAlertAsRead } from '../../store/slices/alertsSlice';
import type { Alert } from '../../types';

const AlertPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { unreadCount } = useAppSelector((state) => state.alerts);
  const loading = useAppSelector((state) => state.ui.loading);

  useEffect(() => {
    // Load unread count on mount
    dispatch(fetchUnreadCount());

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      dispatch(fetchUnreadCount());
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300';
      case 'HIGH':
        return 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-300';
      case 'MEDIUM':
        return 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300';
      case 'LOW':
        return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return '🚨';
      case 'HIGH':
        return '⚠️';
      case 'MEDIUM':
        return '⚡';
      case 'LOW':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const getAlertTypeLabel = (alertType: string) => {
    const labels: { [key: string]: string } = {
      VOIDED_SALE: 'Venta Anulada',
      CASH_DISCREPANCY: 'Diferencia de Caja',
      LOW_PETTY_CASH: 'Fondo Bajo',
      LOW_STOCK: 'Stock Bajo',
      LATE_CLOSING: 'Cierre Tardío',
      AFTER_HOURS_CLOSING: 'Cierre Fuera de Horario',
      REOPEN_REGISTER: 'Caja Reabierta',
      FAILED_INVOICE: 'Factura Fallida',
      LARGE_DISCOUNT: 'Descuento Grande',
      HIGH_VALUE_SALE: 'Venta Alto Valor',
      SYNC_ERROR: 'Error de Sincronización',
      LOGIN_FAILED: 'Login Fallido',
      PRICE_CHANGE: 'Cambio de Precio',
    };
    return labels[alertType] || alertType;
  };

  if (!unreadCount || unreadCount.total === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-up duration-normal">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Alertas del Sistema
          </h3>
          <button
            onClick={() => navigate('/alerts')}
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            Ver Todas →
          </button>
        </div>

        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-3">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            No hay alertas pendientes
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Actualización automática cada 30 segundos
          </p>
        </div>
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
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Alertas del Sistema
          </h3>
          <span className="inline-flex items-center justify-center px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-sm font-bold rounded-full">
            {unreadCount.total}
          </span>
        </div>
        <button
          onClick={() => navigate('/alerts')}
          className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          Ver Todas →
        </button>
      </div>

      {/* Alert Count by Severity */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {unreadCount.by_severity.map((item) => (
          <div
            key={item.severity}
            className={`p-3 rounded border ${getSeverityColor(item.severity)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getSeverityIcon(item.severity)}</span>
                <span className="text-xs font-semibold">{item.severity}</span>
              </div>
              <span className="text-2xl font-bold">{item.count}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Alert Count by Type (Top 5) */}
      {unreadCount.by_type && unreadCount.by_type.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Por Tipo de Alerta
          </h4>
          <div className="space-y-2">
            {unreadCount.by_type.slice(0, 5).map((item) => (
              <div
                key={item.alert_type}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-sm"
              >
                <span className="text-gray-900 dark:text-white font-medium">
                  {getAlertTypeLabel(item.alert_type)}
                </span>
                <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded font-semibold">
                  {item.count}
                </span>
              </div>
            ))}
          </div>

          {unreadCount.by_type.length > 5 && (
            <button
              onClick={() => navigate('/alerts')}
              className="mt-3 w-full text-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              Ver {unreadCount.by_type.length - 5} más →
            </button>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Actualización automática cada 30 segundos
        </p>
      </div>
    </div>
  );
};

export default AlertPanel;
