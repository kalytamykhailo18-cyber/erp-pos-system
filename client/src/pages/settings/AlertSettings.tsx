import React, { useState, useEffect } from 'react';
import { alertService, type AlertConfig } from '../../services/api/alert.service';
import { showToast } from '../../store/slices/uiSlice';
import { useAppDispatch } from '../../store';
import { MdNotifications, MdEdit, MdSave, MdCancel } from 'react-icons/md';
import Button from '../../components/ui/Button';

interface LocalConfig {
  alert_type: string;
  is_active: boolean;
  threshold: number | null;
}

const AlertSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const [configs, setConfigs] = useState<AlertConfig[]>([]);
  const [localConfigs, setLocalConfigs] = useState<LocalConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
        setLocalConfigs(response.data.map(c => ({
          alert_type: c.alert_type,
          is_active: c.is_active,
          threshold: c.threshold
        })));
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

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Revert to original values
    setLocalConfigs(configs.map(c => ({
      alert_type: c.alert_type,
      is_active: c.is_active,
      threshold: c.threshold
    })));
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Find changed configs
      const changedConfigs = localConfigs.filter(local => {
        const original = configs.find(c => c.alert_type === local.alert_type);
        if (!original) return false;
        return original.is_active !== local.is_active || original.threshold !== local.threshold;
      });

      if (changedConfigs.length === 0) {
        setIsEditing(false);
        return;
      }

      // Save each changed config
      for (const local of changedConfigs) {
        const updates: { is_active?: boolean; threshold?: number } = {};
        const original = configs.find(c => c.alert_type === local.alert_type);

        if (original && original.is_active !== local.is_active) {
          updates.is_active = local.is_active;
        }
        if (original && original.threshold !== local.threshold) {
          updates.threshold = local.threshold ?? undefined;
        }

        const response = await alertService.updateConfig(local.alert_type, updates);
        if (!response.success) {
          throw new Error(`Failed to update ${local.alert_type}`);
        }
      }

      dispatch(showToast({ message: 'Configuraciones guardadas correctamente', type: 'success' }));

      // Reload configs to get fresh data
      await loadConfigs();
      setIsEditing(false);
    } catch (err) {
      dispatch(showToast({ message: 'Error al guardar configuraciones', type: 'error' }));
      console.error('Error saving alert configs:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateLocalConfig = (alertType: string, field: 'is_active' | 'threshold', value: boolean | number | null) => {
    setLocalConfigs(prev => prev.map(c =>
      c.alert_type === alertType ? { ...c, [field]: value } : c
    ));
  };

  const getLocalConfig = (alertType: string): LocalConfig | undefined => {
    return localConfigs.find(c => c.alert_type === alertType);
  };

  const getAlertTypeName = (type: string): string => {
    const names: Record<string, string> = {
      'CASH_DISCREPANCY': 'Diferencias de Caja',
      'LOW_STOCK': 'Stock Bajo',
      'LATE_CLOSING': 'Cierre Tardio',
      'AFTER_HOURS_CLOSING': 'Cierre Fuera de Horario',
      'REOPEN_REGISTER': 'Reapertura de Caja',
      'FAILED_INVOICE': 'Factura Fallida',
      'LARGE_DISCOUNT': 'Descuento Grande',
      'HIGH_VALUE_SALE': 'Venta de Alto Valor',
      'VOIDED_SALE': 'Venta Anulada',
      'SYNC_ERROR': 'Error de Sincronizacion',
      'LOGIN_FAILED': 'Intento de Login Fallido',
      'PRICE_CHANGE': 'Cambio de Precio',
      'LOW_PETTY_CASH': 'Fondo de Caja Bajo'
    };
    return names[type] || type;
  };

  const getAlertTypeDescription = (type: string): string => {
    const descriptions: Record<string, string> = {
      'CASH_DISCREPANCY': 'Alerta cuando hay diferencias entre efectivo esperado y declarado al cerrar caja',
      'LOW_STOCK': 'Alerta cuando productos caen por debajo del stock minimo configurado',
      'LATE_CLOSING': 'Alerta cuando cajas no se cierran a la hora esperada',
      'AFTER_HOURS_CLOSING': 'Alerta cuando se cierra la caja fuera del horario establecido',
      'REOPEN_REGISTER': 'Alerta cuando se reabre una caja ya cerrada',
      'FAILED_INVOICE': 'Alerta cuando falla la emision de facturas electronicas con FactuHoy',
      'LARGE_DISCOUNT': 'Alerta cuando se aplica un descuento que supera el umbral configurado',
      'HIGH_VALUE_SALE': 'Alerta cuando hay una venta que supera el monto configurado',
      'VOIDED_SALE': 'Alerta cuando se anula una venta',
      'SYNC_ERROR': 'Alerta cuando falla la sincronizacion de datos offline',
      'LOGIN_FAILED': 'Alerta cuando hay multiples intentos fallidos de login',
      'PRICE_CHANGE': 'Alerta cuando se modifica el precio de un producto',
      'LOW_PETTY_CASH': 'Alerta cuando el fondo de caja esta por debajo del minimo'
    };
    return descriptions[type] || '';
  };

  const getThresholdLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'CASH_DISCREPANCY': 'Monto minimo ($)',
      'LARGE_DISCOUNT': 'Porcentaje maximo (%)',
      'HIGH_VALUE_SALE': 'Monto minimo ($)',
      'LATE_CLOSING': 'Minutos de gracia',
      'AFTER_HOURS_CLOSING': 'Minutos de gracia',
      'LOW_PETTY_CASH': 'Monto minimo ($)',
      'LOW_STOCK': 'Stock minimo',
      'LOGIN_FAILED': 'Intentos maximos'
    };
    return labels[type] || 'Umbral';
  };

  const hasThreshold = (type: string): boolean => {
    return ['CASH_DISCREPANCY', 'LARGE_DISCOUNT', 'HIGH_VALUE_SALE', 'LATE_CLOSING', 'AFTER_HOURS_CLOSING', 'LOW_PETTY_CASH', 'LOW_STOCK', 'LOGIN_FAILED'].includes(type);
  };

  if (loading && configs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-lg text-red-600 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MdNotifications className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Configuracion de Alertas
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Administra que tipos de alertas se generan y configura los umbrales para cada una.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button
                variant="primary"
                onClick={handleEdit}
                icon={<MdEdit className="w-4 h-4" />}
              >
                Editar
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={saving}
                  icon={<MdCancel className="w-4 h-4" />}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  loading={saving}
                  icon={<MdSave className="w-4 h-4" />}
                >
                  Guardar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Alert Configs List */}
      <div className={`grid gap-4 ${saving ? 'opacity-50 pointer-events-none' : ''}`}>
        {configs.map((config) => {
          const localConfig = getLocalConfig(config.alert_type);
          const isActive = isEditing ? localConfig?.is_active ?? config.is_active : config.is_active;
          const threshold = isEditing ? localConfig?.threshold ?? config.threshold : config.threshold;

          return (
            <div
              key={config.id}
              className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-4"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {getAlertTypeName(config.alert_type)}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {getAlertTypeDescription(config.alert_type)}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Threshold Input */}
                  {hasThreshold(config.alert_type) && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {getThresholdLabel(config.alert_type)}:
                      </label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={threshold ?? 0}
                          onChange={(e) => updateLocalConfig(
                            config.alert_type,
                            'threshold',
                            parseFloat(e.target.value) || 0
                          )}
                          min="0"
                          step={config.alert_type === 'LARGE_DISCOUNT' ? '1' : '100'}
                          className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {threshold ?? 0}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Active Toggle */}
                  {isEditing ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => updateLocalConfig(
                          config.alert_type,
                          'is_active',
                          e.target.checked
                        )}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Activo
                      </span>
                    </label>
                  ) : null}

                  {/* Status Badge */}
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isActive
                      ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {isActive ? 'Habilitado' : 'Deshabilitado'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {configs.length === 0 && !loading && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-sm shadow-md">
          <MdNotifications className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No se encontraron configuraciones de alertas.
          </p>
        </div>
      )}

      {/* Saving Overlay */}
      {saving && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 flex items-center gap-4">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-900 dark:text-white font-medium">
              Guardando configuraciones...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertSettings;
