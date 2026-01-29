/**
 * Scale Settings Page
 * PART 13: KRETZ SCALE INTEGRATION
 *
 * UI for managing Kretz Aura scale price list export
 * Allows owners/managers to:
 * - View export statistics
 * - Download price list file in Kretz format
 * - See which products are configured for scale export
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui';
import scaleService, {
  ScaleExportStatistics,
  ScaleProduct,
  ScaleConfiguration,
  ScaleConnectionTestResult,
  ScaleSyncResult
} from '../../services/api/scale.service';
import { MdDownload, MdRefresh, MdCheckCircle, MdWarning, MdError, MdScale, MdSync, MdWifi, MdSave } from 'react-icons/md';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const ScaleSettings: React.FC = () => {
  const { currentBranch } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [statistics, setStatistics] = useState<ScaleExportStatistics | null>(null);
  const [exportableProducts, setExportableProducts] = useState<ScaleProduct[]>([]);
  const [showProductList, setShowProductList] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'txt'>('csv');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Connection configuration state
  const [config, setConfig] = useState<ScaleConfiguration>({
    scale_ip: '',
    scale_port: 21,
    scale_enabled: false,
    scale_sync_frequency: 'manual',
    scale_connection_protocol: 'ftp',
    scale_ftp_username: '',
    scale_upload_path: '/prices',
  });
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [ftpPassword, setFtpPassword] = useState('');

  const loadConfiguration = async () => {
    setConfigLoading(true);
    try {
      const response = await scaleService.getConfiguration(currentBranch?.id);
      setConfig(response.data);
    } catch (err: any) {
      console.error('Error loading configuration:', err);
    } finally {
      setConfigLoading(false);
    }
  };

  const loadStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await scaleService.getStatistics();
      setStatistics(response.data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
    loadConfiguration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBranch]);

  const loadExportableProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await scaleService.getExportableProducts({
        branch_id: currentBranch?.id,
      });
      setExportableProducts(response.data);
      setShowProductList(true);
    } catch (err: any) {
      setError(err.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPriceList = async () => {
    setDownloading(true);
    setError(null);
    setSuccess(null);
    try {
      await scaleService.downloadPriceList(exportFormat, currentBranch?.id);
      setSuccess(`Lista de precios descargada exitosamente en formato ${exportFormat.toUpperCase()}`);
    } catch (err: any) {
      setError(err.message || 'Error al descargar lista de precios');
    } finally {
      setDownloading(false);
    }
  };

  const handleFormChange = (field: keyof ScaleConfiguration, value: any) => {
    setConfig({ ...config, [field]: value });
  };

  const handleSaveConfiguration = async () => {
    setConfigSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updateData: any = { ...config };
      if (ftpPassword) {
        updateData.scale_ftp_password = ftpPassword;
      }
      const response = await scaleService.updateConfiguration(updateData, currentBranch?.id);

      if (!response.success) {
        setError(response.error || 'Error al guardar configuración');
        return;
      }

      setConfig(response.data);
      setSuccess('Configuración guardada exitosamente');
      setFtpPassword(''); // Clear password after save
    } catch (err: any) {
      setError(err.message || 'Error al guardar configuración');
    } finally {
      setConfigSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await scaleService.testConnection(currentBranch?.id);

      if (!response.success) {
        setError(response.error || 'Error al probar conexión');
        return;
      }

      if (response.data.connected) {
        setSuccess(`Conexión exitosa: ${response.data.message}`);
      } else {
        setError(`Error de conexión: ${response.data.error || response.data.message}`);
      }
    } catch (err: any) {
      setError(err.message || 'Error al probar conexión');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await scaleService.syncNow(currentBranch?.id);

      if (!response.success) {
        setError(response.error || 'Error al sincronizar');
        return;
      }

      if (response.data.success) {
        setSuccess(`Sincronización exitosa: ${response.data.filename || 'Archivo enviado'}`);
        await loadConfiguration(); // Reload to get updated last_sync timestamp
        await loadStatistics(); // Reload statistics
      } else {
        setError('Error al sincronizar con la balanza');
      }
    } catch (err: any) {
      setError(err.message || 'Error al sincronizar');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-down duration-fast">
        <div className="flex items-center gap-3">
          <MdScale className="text-3xl text-primary-600 dark:text-primary-400" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Exportación de Precios para Balanza Kretz Aura
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configura la conexión IP y exporta precios automáticamente a la balanza
            </p>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-sm p-4 animate-fade-up duration-fast">
          <div className="flex items-center gap-2">
            <MdError className="text-red-600 dark:text-red-400 text-xl" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-sm p-4 animate-fade-up duration-fast">
          <div className="flex items-center gap-2">
            <MdCheckCircle className="text-green-600 dark:text-green-400 text-xl" />
            <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
          </div>
        </div>
      )}

      {/* Configuration Card */}
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-up duration-fast">
        <div className="flex items-center gap-3 mb-6">
          <MdWifi className="text-2xl text-primary-600 dark:text-primary-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Configuración de Conexión
          </h3>
        </div>

        {configLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-600 mx-auto"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">Cargando configuración...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* IP and Port */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dirección IP de la Balanza
                </label>
                <input
                  type="text"
                  value={config.scale_ip || ''}
                  onChange={(e) => handleFormChange('scale_ip', e.target.value)}
                  placeholder="192.168.1.100"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Puerto
                </label>
                <input
                  type="number"
                  value={config.scale_port || 21}
                  onChange={(e) => handleFormChange('scale_port', parseInt(e.target.value))}
                  placeholder="21"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Protocol and Sync Frequency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Protocolo de Conexión
                </label>
                <select
                  value={config.scale_connection_protocol}
                  onChange={(e) => handleFormChange('scale_connection_protocol', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="ftp">FTP (File Transfer Protocol)</option>
                  <option value="http">HTTP (Web Service)</option>
                  <option value="tcp">TCP (Socket Connection)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frecuencia de Sincronización
                </label>
                <select
                  value={config.scale_sync_frequency}
                  onChange={(e) => handleFormChange('scale_sync_frequency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="manual">Manual (solo cuando se solicite)</option>
                  <option value="hourly">Cada Hora</option>
                  <option value="daily">Diaria (00:00)</option>
                </select>
              </div>
            </div>

            {/* FTP Credentials (show only if FTP protocol) */}
            {config.scale_connection_protocol === 'ftp' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Usuario FTP
                    </label>
                    <input
                      type="text"
                      value={config.scale_ftp_username || ''}
                      onChange={(e) => handleFormChange('scale_ftp_username', e.target.value)}
                      placeholder="usuario"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contraseña FTP
                    </label>
                    <input
                      type="password"
                      value={ftpPassword}
                      onChange={(e) => setFtpPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Dejar en blanco para mantener la contraseña actual
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ruta de Subida en Servidor FTP
                  </label>
                  <input
                    type="text"
                    value={config.scale_upload_path || ''}
                    onChange={(e) => handleFormChange('scale_upload_path', e.target.value)}
                    placeholder="/prices"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            {/* Enable Automatic Sync */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="scale_enabled"
                checked={config.scale_enabled}
                onChange={(e) => handleFormChange('scale_enabled', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="scale_enabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Habilitar Sincronización Automática
              </label>
            </div>

            {/* Last Sync Timestamp */}
            {config.scale_last_sync && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-sm p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Última Sincronización:</strong>{' '}
                  {new Date(config.scale_last_sync).toLocaleString('es-AR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="primary"
                onClick={handleSaveConfiguration}
                disabled={configSaving}
                icon={configSaving ? <MdSync className="animate-spin" /> : <MdSave />}
                iconPosition="left"
              >
                {configSaving ? 'Guardando...' : 'Guardar Configuración'}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={handleTestConnection}
                disabled={testingConnection || !config.scale_ip}
                icon={testingConnection ? <MdSync className="animate-spin" /> : <MdWifi />}
                iconPosition="left"
              >
                {testingConnection ? 'Probando...' : 'Probar Conexión'}
              </Button>

              {config.scale_enabled && config.scale_ip && (
                <Button
                  type="button"
                  variant="accent"
                  onClick={handleSyncNow}
                  disabled={syncing}
                  icon={<MdSync className={syncing ? 'animate-spin' : ''} />}
                  iconPosition="left"
                >
                  {syncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Statistics Card */}
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-up duration-normal">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Estadísticas de Exportación
          </h3>
          <Button
            type="button"
            variant="secondary"
            onClick={loadStatistics}
            disabled={loading}
            icon={<MdRefresh className={loading ? 'animate-spin' : ''} />}
            iconPosition="left"
          >
            Actualizar
          </Button>
        </div>

        {loading && !statistics ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-600 mx-auto"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">Cargando estadísticas...</p>
          </div>
        ) : statistics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              label="Total de Productos"
              value={statistics.total_products}
              icon={<MdScale />}
              color="blue"
            />
            <StatCard
              label="Productos Pesables"
              value={statistics.weighable_products}
              icon={<MdScale />}
              color="purple"
            />
            <StatCard
              label="Productos con Código PLU"
              value={statistics.products_with_plu}
              icon={<MdCheckCircle />}
              color="green"
            />
            <StatCard
              label="Listos para Exportar"
              value={statistics.exportable_products}
              icon={statistics.exportable_products > 0 ? <MdCheckCircle /> : <MdWarning />}
              color={statistics.exportable_products > 0 ? 'green' : 'yellow'}
            />
            <StatCard
              label="Falta Código PLU"
              value={statistics.missing_plu}
              icon={statistics.missing_plu > 0 ? <MdWarning /> : <MdCheckCircle />}
              color={statistics.missing_plu > 0 ? 'yellow' : 'green'}
            />
            <StatCard
              label="Estado de Exportación"
              value={statistics.export_ready ? 'Listo' : 'No Listo'}
              icon={statistics.export_ready ? <MdCheckCircle /> : <MdError />}
              color={statistics.export_ready ? 'green' : 'red'}
            />
          </div>
        ) : null}
      </div>

      {/* Export Actions */}
      {statistics && statistics.export_ready && (
        <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-up duration-slow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Descargar Lista de Precios (Modo Manual)
          </h3>

          <div className="space-y-4">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Formato de Archivo
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="csv"
                    checked={exportFormat === 'csv'}
                    onChange={(e) => setExportFormat(e.target.value as 'csv' | 'txt')}
                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    CSV (Recomendado)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="txt"
                    checked={exportFormat === 'txt'}
                    onChange={(e) => setExportFormat(e.target.value as 'csv' | 'txt')}
                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    TXT (Delimitado por tabulaciones)
                  </span>
                </label>
              </div>
            </div>

            {/* Download Button */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="primary"
                onClick={handleDownloadPriceList}
                disabled={downloading}
                icon={<MdDownload />}
                iconPosition="left"
                className="animate-zoom-in duration-normal"
              >
                {downloading ? 'Descargando...' : `Descargar Lista de Precios (${exportFormat.toUpperCase()})`}
              </Button>

              {!showProductList && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={loadExportableProducts}
                  disabled={loading}
                >
                  Ver Productos Incluidos
                </Button>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-sm p-4 mt-4">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                Instrucciones de Uso:
              </h4>
              <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
                <li>Descarga el archivo de lista de precios (CSV o TXT)</li>
                <li>Abre el software de configuración de la balanza Kretz Aura</li>
                <li>Importa el archivo descargado</li>
                <li>Verifica que los productos se hayan importado correctamente</li>
                <li>Los precios se actualizarán automáticamente en la balanza</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Warning if not ready to export */}
      {statistics && !statistics.export_ready && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-sm p-6 animate-fade-up duration-slow">
          <div className="flex items-start gap-3">
            <MdWarning className="text-yellow-600 dark:text-yellow-400 text-2xl mt-1" />
            <div>
              <h3 className="text-lg font-medium text-yellow-900 dark:text-yellow-200 mb-2">
                No hay productos listos para exportar
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-4">
                Para exportar una lista de precios, necesitas configurar al menos un producto con:
              </p>
              <ul className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1 list-disc list-inside">
                <li>Marcado como "Pesable"</li>
                <li>Código PLU asignado (1-99999)</li>
                <li>Opción "Exportar a Balanza" habilitada</li>
              </ul>
              <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-4">
                Actualmente hay <strong>{statistics.missing_plu}</strong> productos pesables que necesitan código PLU.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Product List */}
      {showProductList && exportableProducts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-up duration-very-slow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Productos para Exportar ({exportableProducts.length})
            </h3>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowProductList(false)}
            >
              Ocultar
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    PLU
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Precio
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Tara (kg)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {exportableProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {product.scale_plu}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {product.sku}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {product.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                      ${product.selling_price.toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                      {product.tare_weight ? product.tare_weight.toFixed(3) : '0.000'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Statistics Card Component
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-sm p-4 animate-fade-right duration-fast">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-sm ${colorClasses[color]}`}>
          {React.cloneElement(icon as React.ReactElement, { className: 'text-2xl' })}
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default ScaleSettings;
