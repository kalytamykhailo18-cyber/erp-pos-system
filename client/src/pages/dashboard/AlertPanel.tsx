import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchAlerts, fetchUnreadCount } from '../../store/slices/alertsSlice';
import AlertDetailModal from '../../components/alerts/AlertDetailModal';
import type { Alert } from '../../types';

const AlertPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { alerts, unreadCount } = useAppSelector((state) => state.alerts);
  const loading = useAppSelector((state) => state.ui.loading);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  useEffect(() => {
    // Load recent unread alerts (top 5) and unread count
    dispatch(fetchAlerts({ is_read: 'false', page: 1, limit: 5 }));
    dispatch(fetchUnreadCount({}));

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      dispatch(fetchAlerts({ is_read: 'false', page: 1, limit: 5 }));
      dispatch(fetchUnreadCount({}));
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
        return '🔴';
      case 'HIGH':
        return '🔴';
      case 'MEDIUM':
        return '🟡';
      case 'LOW':
        return '🟡';
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
      BANK_TRANSFER: 'Transferencia Bancaria',
    };
    return labels[alertType] || alertType;
  };

  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  };

  const hasAlerts = unreadCount && unreadCount.total > 0;
  const recentAlerts = alerts && alerts.length > 0 ? alerts.slice(0, 5) : [];

  const handleViewAlert = (alert: Alert) => {
    setSelectedAlert(alert);
  };

  const handleCloseModal = () => {
    setSelectedAlert(null);
  };

  const handleAlertResolved = () => {
    // Refresh alerts and counts
    dispatch(fetchAlerts({ is_read: 'false', page: 1, limit: 5 }));
    dispatch(fetchUnreadCount({}));
  };

  if (!hasAlerts) {
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
            Alertas ({unreadCount?.total || 0})
          </h3>
        </div>
        <button
          onClick={() => navigate('/alerts')}
          className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          Ver Todas →
        </button>
      </div>

      {/* Recent Alerts List */}
      <div className="space-y-3">
        {recentAlerts.map((alert: any, index: number) => (
          <div
            key={alert.id}
            className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="text-xl flex-shrink-0 mt-0.5">{getSeverityIcon(alert.severity)}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                  {alert.title}
                </p>
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {getTimeAgo(alert.created_at)}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                {alert.message}
              </p>
              {alert.branch && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {alert.branch.name}
                </span>
              )}
            </div>
            <button
              onClick={() => handleViewAlert(alert)}
              className="flex-shrink-0 px-3 py-1 text-xs bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors font-medium"
            >
              Ver
            </button>
          </div>
        ))}
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={handleCloseModal}
          onResolved={handleAlertResolved}
        />
      )}

      {recentAlerts.length === 0 && (
        <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
          No hay alertas recientes
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Actualización automática cada 30 segundos
        </p>
        {unreadCount && unreadCount.total > 5 && (
          <button
            onClick={() => navigate('/alerts')}
            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            +{unreadCount.total - 5} más
          </button>
        )}
      </div>
    </div>
  );
};

export default AlertPanel;
