import React, { useState } from 'react';
import { useAppDispatch } from '../../store';
import { markAlertAsRead } from '../../store/slices/alertsSlice';
import { alertService } from '../../services/api';
import type { Alert } from '../../types';
import CloseIcon from '@mui/icons-material/Close';

interface AlertDetailModalProps {
  alert: Alert;
  onClose: () => void;
  onResolved?: () => void;
}

const AlertDetailModal: React.FC<AlertDetailModalProps> = ({ alert, onClose, onResolved }) => {
  const dispatch = useAppDispatch();
  const [resolving, setResolving] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showResolutionForm, setShowResolutionForm] = useState(false);

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(numAmount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700';
      case 'HIGH':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700';
      case 'MEDIUM':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700';
      case 'LOW':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600';
    }
  };

  const getAlertTypeLabel = (alertType: string) => {
    const labels: { [key: string]: string } = {
      VOIDED_SALE: 'Venta Anulada',
      CASH_DISCREPANCY: 'Diferencia de Caja',
      LOW_PETTY_CASH: 'Fondo Caja Bajo',
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

  const handleMarkAsRead = async () => {
    if (!alert.is_read) {
      await dispatch(markAlertAsRead(alert.id));
    }
  };

  const handleResolve = async () => {
    try {
      setResolving(true);
      await alertService.resolve(alert.id, resolutionNotes || undefined);
      handleMarkAsRead();
      onResolved?.();
      onClose();
    } catch (error) {
      console.error('Error resolving alert:', error);
      alert('Error al resolver la alerta');
    } finally {
      setResolving(false);
    }
  };

  const canBeResolved = () => {
    // Only certain alert types can be "resolved" (approved)
    return ['VOIDED_SALE', 'CASH_DISCREPANCY', 'REOPEN_REGISTER', 'BANK_TRANSFER', 'LARGE_DISCOUNT'].includes(alert.alert_type);
  };

  const renderMetadata = () => {
    if (!alert.metadata) return null;

    const metadata = alert.metadata as any;

    return (
      <div className="space-y-2">
        {metadata.sale_number && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Número de Venta:</span>
            <span className="font-medium text-gray-900 dark:text-white">{metadata.sale_number}</span>
          </div>
        )}
        {metadata.void_amount && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Monto Anulado:</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(metadata.void_amount)}</span>
          </div>
        )}
        {metadata.is_large_void && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
            <span className="font-semibold text-red-600 dark:text-red-400">Anulación de Alto Valor</span>
          </div>
        )}
        {metadata.voided_by_name && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Anulado Por:</span>
            <span className="font-medium text-gray-900 dark:text-white">{metadata.voided_by_name}</span>
          </div>
        )}
        {metadata.void_reason && (
          <div className="flex flex-col text-sm">
            <span className="text-gray-600 dark:text-gray-400 mb-1">Razón:</span>
            <span className="font-medium text-gray-900 dark:text-white italic">{metadata.void_reason}</span>
          </div>
        )}
        {metadata.total_transfer_amount && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Monto Transferencia:</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(metadata.total_transfer_amount)}</span>
          </div>
        )}
        {metadata.reference_numbers && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">N° Comprobante:</span>
            <span className="font-medium text-gray-900 dark:text-white">{metadata.reference_numbers}</span>
          </div>
        )}
        {metadata.cashier_name && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Cajero:</span>
            <span className="font-medium text-gray-900 dark:text-white">{metadata.cashier_name}</span>
          </div>
        )}
        {metadata.discount_percent !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Descuento:</span>
            <span className="font-medium text-gray-900 dark:text-white">{metadata.discount_percent.toFixed(1)}%</span>
          </div>
        )}
        {metadata.discount_amount && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Monto Descontado:</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(metadata.discount_amount)}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(alert.severity)}`}>
                {alert.severity}
              </span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {getAlertTypeLabel(alert.alert_type)}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{alert.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {formatDate(alert.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <CloseIcon sx={{ fontSize: 24 }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Message */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Mensaje:</h3>
            <p className="text-gray-900 dark:text-white leading-relaxed">{alert.message}</p>
          </div>

          {/* Branch */}
          {alert.branch && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Sucursal:</h3>
              <span className="inline-block bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded text-gray-900 dark:text-white">
                {alert.branch.name} ({alert.branch.code})
              </span>
            </div>
          )}

          {/* Metadata */}
          {alert.metadata && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Detalles:</h3>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                {renderMetadata()}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Estado de Lectura:</h3>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                alert.is_read
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
              }`}>
                {alert.is_read ? 'Leída' : 'No Leída'}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Resolución:</h3>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                alert.is_resolved
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}>
                {alert.is_resolved ? 'Resuelta' : 'Pendiente'}
              </span>
            </div>
          </div>

          {/* Resolution Info */}
          {alert.is_resolved && alert.resolution_notes && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Notas de Resolución:</h3>
              <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 rounded p-3">
                {alert.resolution_notes}
              </p>
              {alert.resolver && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Resuelto por: {alert.resolver.first_name} {alert.resolver.last_name}
                </p>
              )}
            </div>
          )}

          {/* Resolution Form */}
          {!alert.is_resolved && canBeResolved() && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              {!showResolutionForm ? (
                <button
                  onClick={() => setShowResolutionForm(true)}
                  className="w-full px-4 py-3 bg-green-500 text-white rounded-sm hover:bg-green-600 transition-colors font-medium"
                >
                  Aprobar / Resolver Alerta
                </button>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Resolver Alerta (Opcional: Agregar Notas)
                  </h3>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Notas de resolución o aprobación (opcional)"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleResolve}
                      disabled={resolving}
                      className="flex-1 px-4 py-2 bg-green-500 text-white rounded-sm hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
                    >
                      {resolving ? 'Procesando...' : 'Confirmar Resolución'}
                    </button>
                    <button
                      onClick={() => setShowResolutionForm(false)}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-sm hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          {!alert.is_read && (
            <button
              onClick={handleMarkAsRead}
              className="px-4 py-2 bg-primary-500 text-white rounded-sm hover:bg-primary-600 transition-colors font-medium text-sm"
            >
              Marcar como Leída
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-sm hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertDetailModal;
