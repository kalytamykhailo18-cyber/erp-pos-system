import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { updateBranchSettings } from '../../store/slices/authSlice';
import { Button } from '../../components/ui';
import { MdEdit, MdSave, MdClose } from 'react-icons/md';

const BranchSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentBranch } = useAppSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    receipt_footer: '',
    auto_print_receipt: true,
    require_customer: false,
    enable_discounts: true,
    max_discount_percent: 10,
    petty_cash_amount: 100000,
    tax_id: '',
    tax_condition: '',
    factuhoy_point_of_sale: '',
    default_invoice_type: 'B',
    weekday_opening_time: '08:30',
    weekday_closing_time: '20:00',
    midday_closing_time: '14:30',
    afternoon_opening_time: '',
    evening_closing_time: '20:00',
    sunday_opening_time: '09:00',
    sunday_closing_time: '13:45',
    has_shift_change: true
  });
  const [originalSettings, setOriginalSettings] = useState({ ...settings });

  // Load current branch settings on component mount
  useEffect(() => {
    if (currentBranch) {
      const loadedSettings = {
        receipt_footer: currentBranch.receipt_footer || '',
        auto_print_receipt: currentBranch.auto_print_receipt ?? true,
        require_customer: currentBranch.require_customer ?? false,
        enable_discounts: currentBranch.enable_discounts ?? true,
        max_discount_percent: currentBranch.max_discount_percent || 10,
        petty_cash_amount: parseFloat(String(currentBranch.petty_cash_amount)) || 100000,
        tax_id: currentBranch.tax_id || '',
        tax_condition: currentBranch.tax_condition || '',
        factuhoy_point_of_sale: currentBranch.factuhoy_point_of_sale?.toString() || '',
        default_invoice_type: (currentBranch.default_invoice_type as 'A' | 'B' | 'C') || 'B',
        weekday_opening_time: currentBranch.weekday_opening_time?.substring(0, 5) || '08:30',
        weekday_closing_time: currentBranch.weekday_closing_time?.substring(0, 5) || '20:00',
        midday_closing_time: currentBranch.midday_closing_time?.substring(0, 5) || '14:30',
        afternoon_opening_time: currentBranch.afternoon_opening_time?.substring(0, 5) || '',
        evening_closing_time: currentBranch.evening_closing_time?.substring(0, 5) || '20:00',
        sunday_opening_time: currentBranch.sunday_opening_time?.substring(0, 5) || '09:00',
        sunday_closing_time: currentBranch.sunday_closing_time?.substring(0, 5) || '13:45',
        has_shift_change: currentBranch.has_shift_change ?? true
      };
      setSettings(loadedSettings);
      setOriginalSettings(loadedSettings);
    }
  }, [currentBranch]);

  const handleEdit = () => {
    setOriginalSettings({ ...settings });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setSettings({ ...originalSettings });
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();

    if (!currentBranch) {
      return;
    }

    setSaving(true);

    try {
      // Convert factuhoy_point_of_sale to number or undefined (backend expects integer)
      const factuhoyPointOfSale = settings.factuhoy_point_of_sale
        ? parseInt(settings.factuhoy_point_of_sale, 10)
        : undefined;

      await dispatch(updateBranchSettings({
        branchId: currentBranch.id,
        data: {
          receipt_footer: settings.receipt_footer || undefined,
          auto_print_receipt: settings.auto_print_receipt,
          require_customer: settings.require_customer,
          enable_discounts: settings.enable_discounts,
          max_discount_percent: settings.max_discount_percent,
          petty_cash_amount: settings.petty_cash_amount,
          tax_id: settings.tax_id || undefined,
          tax_condition: settings.tax_condition || undefined,
          factuhoy_point_of_sale: factuhoyPointOfSale,
          default_invoice_type: settings.default_invoice_type as 'A' | 'B' | 'C',
          weekday_opening_time: settings.weekday_opening_time + ':00',
          weekday_closing_time: settings.weekday_closing_time + ':00',
          midday_closing_time: settings.midday_closing_time + ':00',
          afternoon_opening_time: settings.afternoon_opening_time ? settings.afternoon_opening_time + ':00' : null,
          evening_closing_time: settings.evening_closing_time + ':00',
          sunday_opening_time: settings.sunday_opening_time + ':00',
          sunday_closing_time: settings.sunday_closing_time + ':00',
          has_shift_change: settings.has_shift_change
        }
      })).unwrap();

      setOriginalSettings({ ...settings });
      setIsEditing(false);
      // Toast is already dispatched by authSlice thunk
    } catch (error) {
      // Error toast is already dispatched by authSlice thunk
    } finally {
      setSaving(false);
    }
  };

  const inputClassName = `px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
    !isEditing ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''
  }`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-up duration-normal">
      {/* Header with Edit/Save buttons */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Configuracion de Sucursal</h2>
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col animate-fade-left duration-normal">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pie de Recibo:</label>
          <textarea
            name="receipt_footer"
            value={settings.receipt_footer}
            onChange={handleChange}
            disabled={!isEditing}
            rows={3}
            placeholder="Texto que aparece al final del recibo..."
            className={`${inputClassName} resize-none`}
          />
        </div>

        <label className={`flex items-center gap-2 ${isEditing ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}>
          <input
            type="checkbox"
            name="auto_print_receipt"
            checked={settings.auto_print_receipt}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Imprimir recibo automaticamente</span>
        </label>

        <label className={`flex items-center gap-2 ${isEditing ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}>
          <input
            type="checkbox"
            name="require_customer"
            checked={settings.require_customer}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Requiere seleccionar cliente</span>
        </label>

        <label className={`flex items-center gap-2 ${isEditing ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}>
          <input
            type="checkbox"
            name="enable_discounts"
            checked={settings.enable_discounts}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Habilitar descuentos</span>
        </label>

        {settings.enable_discounts && (
          <div className="flex flex-col animate-zoom-in duration-fast">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descuento maximo (%):</label>
            <input
              type="number"
              name="max_discount_percent"
              value={settings.max_discount_percent}
              onChange={handleChange}
              disabled={!isEditing}
              min="0"
              max="100"
              className={inputClassName}
            />
          </div>
        )}

        {/* Operating Hours Section */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Horarios de Atencion
          </h3>

          {/* Weekday Hours */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Lunes a Sabado
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hora de Apertura:
                </label>
                <input
                  type="time"
                  name="weekday_opening_time"
                  value={settings.weekday_opening_time}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClassName}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hora de Cierre:
                </label>
                <input
                  type="time"
                  name="weekday_closing_time"
                  value={settings.weekday_closing_time}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClassName}
                />
              </div>
            </div>
          </div>

          {/* Shift Change Configuration */}
          <div className="space-y-4">
            <label className={`flex items-center gap-2 ${isEditing ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}>
              <input
                type="checkbox"
                name="has_shift_change"
                checked={settings.has_shift_change}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sucursal tiene cambio de turno
              </span>
            </label>

            {settings.has_shift_change && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hora de Cierre del Mediodia (Cambio de Turno):
                  </label>
                  <input
                    type="time"
                    name="midday_closing_time"
                    value={settings.midday_closing_time}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={inputClassName}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Ej: 14:30 para Crovara/Boulogne/Tapiales
                  </p>
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hora de Cierre de la Tarde:
                  </label>
                  <input
                    type="time"
                    name="evening_closing_time"
                    value={settings.evening_closing_time}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={inputClassName}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Ej: 20:00 para Crovara/Boulogne, 20:30 para Tapiales
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Split Shift (for Aldo Bonzi) */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hora de Apertura de la Tarde (opcional - solo para turnos divididos):
            </label>
            <input
              type="time"
              name="afternoon_opening_time"
              value={settings.afternoon_opening_time}
              onChange={handleChange}
              disabled={!isEditing}
              className={inputClassName}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Para sucursales con turno dividido (ej: Aldo Bonzi abre 8:30-13:30, cierra, y reabre 16:45-20:15)
            </p>
          </div>

          {/* Sunday Hours */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Domingos y Feriados
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hora de Apertura:
                </label>
                <input
                  type="time"
                  name="sunday_opening_time"
                  value={settings.sunday_opening_time}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClassName}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hora de Cierre:
                </label>
                <input
                  type="time"
                  name="sunday_closing_time"
                  value={settings.sunday_closing_time}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClassName}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Ej: 09:00 - 13:45 para todas las sucursales
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Petty Cash Section */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Fondo de Caja
          </h3>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Monto del Fondo de Reserva (ARS):
            </label>
            <input
              type="number"
              name="petty_cash_amount"
              value={settings.petty_cash_amount}
              onChange={handleChange}
              disabled={!isEditing}
              min="0"
              step="1000"
              className={inputClassName}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Monto minimo de efectivo que debe permanecer en caja. Si el efectivo al cerrar es menor a este monto, se mostrara una advertencia.
              <br />
              <strong>Valor por defecto:</strong> $100,000
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md p-3">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              <strong>Que es el Fondo de Reserva?</strong><br />
              Es el monto minimo que debe quedar en caja para comenzar el siguiente turno.
              Sirve para hacer cambios a los primeros clientes del dia.
            </p>
          </div>
        </div>

        {/* Facturacion Electronica Section */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Facturacion Electronica (AFIP)
          </h3>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CUIT / CUIL:</label>
            <input
              type="text"
              name="tax_id"
              value={settings.tax_id}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="20-12345678-9"
              className={inputClassName}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Condicion IVA:</label>
            <select
              name="tax_condition"
              value={settings.tax_condition}
              onChange={handleChange}
              disabled={!isEditing}
              className={inputClassName}
            >
              <option value="">Seleccionar...</option>
              <option value="Responsable Inscripto">Responsable Inscripto</option>
              <option value="Monotributista">Monotributista</option>
              <option value="Exento">Exento</option>
              <option value="Consumidor Final">Consumidor Final</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Numero de Punto de Venta (FactuHoy):
            </label>
            <input
              type="number"
              name="factuhoy_point_of_sale"
              value={settings.factuhoy_point_of_sale}
              onChange={handleChange}
              disabled={!isEditing}
              min="1"
              max="9999"
              placeholder="Ej: 1, 2, 3..."
              className={inputClassName}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Este numero debe coincidir con el punto de venta configurado en FactuHoy para esta sucursal
            </p>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Factura por Defecto:
            </label>
            <select
              name="default_invoice_type"
              value={settings.default_invoice_type}
              onChange={handleChange}
              disabled={!isEditing}
              className={inputClassName}
            >
              <option value="A">Factura A - Para Responsables Inscriptos (requiere CUIT)</option>
              <option value="B">Factura B - Para Consumidores Finales (mas comun)</option>
              <option value="C">Factura C - Para Monotributistas</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Este tipo de factura se aplicara por defecto en el POS. Se puede cambiar por transaccion.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BranchSettings;
