import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../hooks';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchSettings, updateSettings } from '../../store/slices/settingsSlice';
import { Button } from '../../components/ui';
import { MdLocationOn, MdHome, MdCalculate, MdLocalShipping, MdDescription, MdEdit, MdSave, MdClose } from 'react-icons/md';

const SystemSettings: React.FC = () => {
  const { goTo } = useNavigation();
  const dispatch = useAppDispatch();
  const { settings: savedSettings, loading } = useAppSelector((state) => state.settings);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    company_name: '',
    tax_id: '',
    address: '',
    phone: '',
    email: '',
    currency: 'ARS',
    timezone: 'America/Argentina/Buenos_Aires',
    date_format: 'DD/MM/YYYY',
    enable_invoicing: true,
    factuhoy_api_key: ''
  });
  const [originalSettings, setOriginalSettings] = useState({ ...settings });

  // Fetch settings on mount
  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  // Update local state when savedSettings changes
  useEffect(() => {
    if (savedSettings) {
      const loadedSettings = {
        company_name: savedSettings.company_name || '',
        tax_id: savedSettings.tax_id || '',
        address: savedSettings.address || '',
        phone: savedSettings.phone || '',
        email: savedSettings.email || '',
        currency: savedSettings.currency || 'ARS',
        timezone: savedSettings.timezone || 'America/Argentina/Buenos_Aires',
        date_format: savedSettings.date_format || 'DD/MM/YYYY',
        enable_invoicing: savedSettings.enable_invoicing ?? true,
        factuhoy_api_key: '' // Don't load the actual key, it's masked
      };
      setSettings(loadedSettings);
      setOriginalSettings(loadedSettings);
    }
  }, [savedSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const handleEdit = () => {
    setOriginalSettings({ ...settings });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setSettings({ ...originalSettings });
    setIsEditing(false);
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();

    setSaving(true);

    try {
      // Build update data, only include factuhoy_api_key if it was changed
      const updateData: any = {
        company_name: settings.company_name || undefined,
        tax_id: settings.tax_id || undefined,
        address: settings.address || undefined,
        phone: settings.phone || undefined,
        email: settings.email || undefined,
        currency: settings.currency,
        timezone: settings.timezone,
        date_format: settings.date_format,
        enable_invoicing: settings.enable_invoicing,
      };

      // Only include API key if user entered a new one
      if (settings.factuhoy_api_key) {
        updateData.factuhoy_api_key = settings.factuhoy_api_key;
      }

      await dispatch(updateSettings(updateData)).unwrap();

      setOriginalSettings({ ...settings, factuhoy_api_key: '' });
      setSettings({ ...settings, factuhoy_api_key: '' });
      setIsEditing(false);
      // Toast is already dispatched by settingsSlice thunk
    } catch (error) {
      // Error toast is already dispatched by settingsSlice thunk
    } finally {
      setSaving(false);
    }
  };

  const inputClassName = `px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
    !isEditing ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''
  }`;

  if (loading && !savedSettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-down duration-normal">
        {/* Header with Edit/Save buttons */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Configuracion del Sistema</h2>
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <Button
                onClick={handleEdit}
                variant="secondary"
                icon={<MdEdit className="w-5 h-5" />}
                iconPosition="left"
              >
                Editar
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleCancel}
                  variant="ghost"
                  disabled={saving}
                  icon={<MdClose className="w-5 h-5" />}
                  iconPosition="left"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={saving}
                  icon={saving ? undefined : <MdSave className="w-5 h-5" />}
                  iconPosition="left"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </span>
                  ) : (
                    'Guardar'
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Informacion de la Empresa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre de la Empresa:</label>
                <input
                  type="text"
                  name="company_name"
                  value={settings.company_name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClassName}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CUIT:</label>
                <input
                  type="text"
                  name="tax_id"
                  value={settings.tax_id}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClassName}
                />
              </div>
              <div className="flex flex-col md:col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Direccion:</label>
                <input
                  type="text"
                  name="address"
                  value={settings.address}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClassName}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Telefono:</label>
                <input
                  type="tel"
                  name="phone"
                  value={settings.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClassName}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email:</label>
                <input
                  type="email"
                  name="email"
                  value={settings.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClassName}
                />
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Configuracion Regional</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Moneda:</label>
                <select
                  name="currency"
                  value={settings.currency}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClassName}
                >
                  <option value="ARS">Peso Argentino (ARS)</option>
                  <option value="USD">Dolar (USD)</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Zona Horaria:</label>
                <select
                  name="timezone"
                  value={settings.timezone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClassName}
                >
                  <option value="America/Argentina/Buenos_Aires">Buenos Aires</option>
                  <option value="America/Argentina/Cordoba">Cordoba</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Formato de Fecha:</label>
                <select
                  name="date_format"
                  value={settings.date_format}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClassName}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                </select>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Facturacion (FactuHoy)</h3>
            <div className="space-y-4">
              <label className={`flex items-center gap-2 ${isEditing ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}>
                <input
                  type="checkbox"
                  name="enable_invoicing"
                  checked={settings.enable_invoicing}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Habilitar facturacion electronica</span>
              </label>
              {settings.enable_invoicing && (
                <div className="flex flex-col max-w-md">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API Key de FactuHoy:
                    {savedSettings?.has_factuhoy_api_key && (
                      <span className="ml-2 text-xs text-success-600 dark:text-success-400">
                        (Configurada: {savedSettings.factuhoy_api_key_masked})
                      </span>
                    )}
                  </label>
                  <input
                    type="password"
                    name="factuhoy_api_key"
                    value={settings.factuhoy_api_key}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder={savedSettings?.has_factuhoy_api_key ? "Dejar vacio para mantener la actual" : "Ingrese su API Key"}
                    className={inputClassName}
                  />
                </div>
              )}
            </div>
          </section>

          <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Envios y Entregas</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Configura las zonas de envio, mapeos de barrios y visualiza los envios realizados.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => goTo('/shipping/zones')}
                className="text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MdLocationOn className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Zonas de Envio</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Configura tarifas por zona</div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => goTo('/shipping/neighborhoods')}
                className="text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MdHome className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Mapeo de Barrios</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Asigna barrios a zonas</div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => goTo('/shipping/calculator')}
                className="text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MdCalculate className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Calculadora de Envios</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Prueba el calculo de costos</div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => goTo('/shipping/shipments')}
                className="text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MdLocalShipping className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Gestion de Envios</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Ver todos los envios</div>
                  </div>
                </div>
              </button>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Gestion de Gastos</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Administra los gastos de tu negocio, categorias y reportes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => goTo('/expenses')}
                className="text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MdDescription className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Gastos</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Administra todos los gastos</div>
                  </div>
                </div>
              </button>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
};

export default SystemSettings;
