import React, { useState, useEffect } from 'react';
import { alertService, type AlertConfig } from '../../services/api/alert.service';
import { showToast } from '../../store/slices/uiSlice';
import { useAppDispatch } from '../../store';

const AlertSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const [configs, setConfigs] = useState<AlertConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await alertService.getConfigs();
      if (response.success && response.data) {
        setConfigs(response.data);
      } else {
        throw new Error('Failed to load alert configurations');
      }
    } catch (err) {
      const errorMsg = 'Error al cargar configuraciones de alertas';
      setError(errorMsg);
      dispatch(showToast({ message: errorMsg, type: 'error' }));
      console.error('Error loading alert configs:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAlert = async (alertType: string, isActive: boolean) => {
    try {
      const response = await alertService.updateConfig(alertType, { is_active: isActive });
      if (response.success) {
        dispatch(showToast({
          message: `Alerta ${isActive ? 'activada' : 'desactivada'} correctamente`,
          type: 'success'
        }));
        loadConfigs();
      } else {
        throw new Error('Failed to update alert config');
      }
    } catch (err) {
      dispatch(showToast({ message: 'Error al actualizar configuración', type: 'error' }));
      console.error('Error updating alert config:', err);
    }
  };

  const updateThreshold = async (alertType: string, threshold: number) => {
    try {
      const response = await alertService.updateConfig(alertType, { threshold });
      if (response.success) {
        dispatch(showToast({ message: 'Umbral actualizado correctamente', type: 'success' }));
        loadConfigs();
      } else {
        throw new Error('Failed to update threshold');
      }
    } catch (err) {
      dispatch(showToast({ message: 'Error al actualizar umbral', type: 'error' }));
      console.error('Error updating threshold:', err);
    }
  };

  const getAlertTypeName = (type: string): string => {
    const names: Record<string, string> = {
      'CASH_DISCREPANCY': 'Diferencias de Caja',
      'LOW_STOCK': 'Stock Bajo',
      'LATE_CLOSING': 'Cierre Tardío',
      'REOPEN_REGISTER': 'Reapertura de Caja',
      'FAILED_INVOICE': 'Factura Fallida',
      'LARGE_DISCOUNT': 'Descuento Grande',
      'HIGH_VALUE_SALE': 'Venta de Alto Valor',
      'VOIDED_SALE': 'Venta Anulada',
      'SYNC_ERROR': 'Error de Sincronización',
      'LOGIN_FAILED': 'Intento de Login Fallido',
      'PRICE_CHANGE': 'Cambio de Precio'
    };
    return names[type] || type;
  };

  const getAlertTypeDescription = (type: string): string => {
    const descriptions: Record<string, string> = {
      'CASH_DISCREPANCY': 'Alerta cuando hay diferencias entre efectivo esperado y declarado al cerrar caja',
      'LOW_STOCK': 'Alerta cuando productos caen por debajo del stock mínimo configurado',
      'LATE_CLOSING': 'Alerta cuando cajas no se cierran a la hora esperada',
      'REOPEN_REGISTER': 'Alerta cuando se reabre una caja ya cerrada',
      'FAILED_INVOICE': 'Alerta cuando falla la emisión de facturas electrónicas con FactuHoy',
      'LARGE_DISCOUNT': 'Alerta cuando se aplica un descuento que supera el umbral configurado',
      'HIGH_VALUE_SALE': 'Alerta cuando hay una venta que supera el monto configurado',
      'VOIDED_SALE': 'Alerta cuando se anula una venta',
      'SYNC_ERROR': 'Alerta cuando falla la sincronización de datos offline',
      'LOGIN_FAILED': 'Alerta cuando hay múltiples intentos fallidos de login',
      'PRICE_CHANGE': 'Alerta cuando se modifica el precio de un producto'
    };
    return descriptions[type] || '';
  };

  const getThresholdLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'CASH_DISCREPANCY': 'Monto mínimo ($)',
      'LARGE_DISCOUNT': 'Porcentaje máximo (%)',
      'HIGH_VALUE_SALE': 'Monto mínimo ($)',
      'LATE_CLOSING': 'Minutos de gracia'
    };
    return labels[type] || 'Umbral';
  };

  const hasThreshold = (type: string): boolean => {
    return ['CASH_DISCREPANCY', 'LARGE_DISCOUNT', 'HIGH_VALUE_SALE', 'LATE_CLOSING'].includes(type);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-lg text-red-600 dark:text-red-400 animate-zoom-in duration-fast">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up duration-normal relative">
      {loading && (
        <div className="absolute top-4 right-4 z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-4 border-gray-300 border-t-primary-600"></div>
        </div>
      )}
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-down duration-fast">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Configuración de Alertas
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Administra qué tipos de alertas se generan y configura los umbrales para cada una.
        </p>
      </div>

      <div className="grid gap-4">
        {configs.map((config, index) => (
          <div
            key={config.id}
            className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-4 animate-fade-up duration-normal"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {getAlertTypeName(config.alert_type)}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getAlertTypeDescription(config.alert_type)}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {hasThreshold(config.alert_type) && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {getThresholdLabel(config.alert_type)}:
                    </label>
                    <input
                      type="number"
                      value={config.threshold || 0}
                      onChange={(e) => updateThreshold(config.alert_type, parseFloat(e.target.value) || 0)}
                      min="0"
                      step={config.alert_type === 'LARGE_DISCOUNT' ? '1' : '100'}
                      className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.is_active}
                    onChange={(e) => toggleAlert(config.alert_type, e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {config.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </label>

                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  config.is_active
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {config.is_active ? 'Habilitado' : 'Deshabilitado'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {configs.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-sm shadow-md">
          <p className="text-gray-600 dark:text-gray-400">
            No se encontraron configuraciones de alertas.
          </p>
        </div>
      )}
    </div>
  );
};

export default AlertSettings;
