import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { updateBranchSettings } from '../../store/slices/authSlice';

const BranchSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentBranch } = useAppSelector((state) => state.auth);

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
    default_invoice_type: 'B'
  });

  // Load current branch settings on component mount
  useEffect(() => {
    if (currentBranch) {
      setSettings({
        receipt_footer: currentBranch.receipt_footer || '',
        auto_print_receipt: currentBranch.auto_print_receipt ?? true,
        require_customer: currentBranch.require_customer ?? false,
        enable_discounts: currentBranch.enable_discounts ?? true,
        max_discount_percent: currentBranch.max_discount_percent || 10,
        petty_cash_amount: currentBranch.petty_cash_amount || 100000,
        tax_id: currentBranch.tax_id || '',
        tax_condition: currentBranch.tax_condition || '',
        factuhoy_point_of_sale: currentBranch.factuhoy_point_of_sale?.toString() || '',
        default_invoice_type: (currentBranch.default_invoice_type as 'A' | 'B' | 'C') || 'B'
      });
    }
  }, [currentBranch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentBranch) {
      return;
    }

    try {
      await dispatch(updateBranchSettings({
        branchId: currentBranch.id,
        data: {
          receipt_footer: settings.receipt_footer,
          auto_print_receipt: settings.auto_print_receipt,
          require_customer: settings.require_customer,
          enable_discounts: settings.enable_discounts,
          max_discount_percent: settings.max_discount_percent,
          petty_cash_amount: settings.petty_cash_amount,
          tax_id: settings.tax_id,
          tax_condition: settings.tax_condition,
          factuhoy_point_of_sale: settings.factuhoy_point_of_sale,
          default_invoice_type: settings.default_invoice_type as 'A' | 'B' | 'C'
        }
      })).unwrap();
    } catch (error) {
      // Error already handled by Redux thunk
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-up duration-normal">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 animate-fade-right duration-fast">Configuración de Sucursal</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col animate-fade-left duration-normal">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pie de Recibo:</label>
          <textarea
            name="receipt_footer"
            value={settings.receipt_footer}
            onChange={handleChange}
            rows={3}
            placeholder="Texto que aparece al final del recibo..."
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer animate-fade-right duration-light-slow">
          <input
            type="checkbox"
            name="auto_print_receipt"
            checked={settings.auto_print_receipt}
            onChange={handleChange}
            className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Imprimir recibo automáticamente</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer animate-fade-up duration-normal">
          <input
            type="checkbox"
            name="require_customer"
            checked={settings.require_customer}
            onChange={handleChange}
            className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Requiere seleccionar cliente</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer animate-fade-left duration-fast">
          <input
            type="checkbox"
            name="enable_discounts"
            checked={settings.enable_discounts}
            onChange={handleChange}
            className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Habilitar descuentos</span>
        </label>

        {settings.enable_discounts && (
          <div className="flex flex-col animate-zoom-in duration-fast">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descuento máximo (%):</label>
            <input
              type="number"
              name="max_discount_percent"
              value={settings.max_discount_percent}
              onChange={handleChange}
              min="0"
              max="100"
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Petty Cash Section */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4 animate-fade-up duration-normal">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Fondo de Caja
          </h3>

          <div className="flex flex-col animate-fade-right duration-normal">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Monto del Fondo de Reserva (ARS):
            </label>
            <input
              type="number"
              name="petty_cash_amount"
              value={settings.petty_cash_amount}
              onChange={handleChange}
              min="0"
              step="1000"
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Monto mínimo de efectivo que debe permanecer en caja. Si el efectivo al cerrar es menor a este monto, se mostrará una advertencia.
              <br />
              <strong>Valor por defecto:</strong> $100,000
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md p-3">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              💡 <strong>¿Qué es el Fondo de Reserva?</strong><br />
              Es el monto mínimo que debe quedar en caja para comenzar el siguiente turno.
              Sirve para hacer cambios a los primeros clientes del día.
            </p>
          </div>
        </div>

        {/* Facturación Electrónica Section */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4 animate-fade-up duration-light-slow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Facturación Electrónica (AFIP)
          </h3>

          <div className="flex flex-col animate-fade-right duration-normal">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CUIT / CUIL:</label>
            <input
              type="text"
              name="tax_id"
              value={settings.tax_id}
              onChange={handleChange}
              placeholder="20-12345678-9"
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-col animate-fade-left duration-normal">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Condición IVA:</label>
            <select
              name="tax_condition"
              value={settings.tax_condition}
              onChange={handleChange}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Seleccionar...</option>
              <option value="Responsable Inscripto">Responsable Inscripto</option>
              <option value="Monotributista">Monotributista</option>
              <option value="Exento">Exento</option>
              <option value="Consumidor Final">Consumidor Final</option>
            </select>
          </div>

          <div className="flex flex-col animate-fade-up duration-normal">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Número de Punto de Venta (FactuHoy):
            </label>
            <input
              type="number"
              name="factuhoy_point_of_sale"
              value={settings.factuhoy_point_of_sale}
              onChange={handleChange}
              min="1"
              max="9999"
              placeholder="Ej: 1, 2, 3..."
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Este número debe coincidir con el punto de venta configurado en FactuHoy para esta sucursal
            </p>
          </div>

          <div className="flex flex-col animate-fade-down duration-normal">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Factura por Defecto:
            </label>
            <select
              name="default_invoice_type"
              value={settings.default_invoice_type}
              onChange={handleChange}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="A">Factura A - Para Responsables Inscriptos (requiere CUIT)</option>
              <option value="B">Factura B - Para Consumidores Finales (más común)</option>
              <option value="C">Factura C - Para Monotributistas</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Este tipo de factura se aplicará por defecto en el POS. Se puede cambiar por transacción.
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-3 bg-primary-500 text-white rounded-sm hover:bg-primary-600 transition-colors font-medium animate-flip-up duration-normal"
        >
          Guardar Configuración
        </button>
      </form>
    </div>
  );
};

export default BranchSettings;
