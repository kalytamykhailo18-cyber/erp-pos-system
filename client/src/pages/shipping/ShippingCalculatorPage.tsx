import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { calculateShipping, loadZones, loadNeighborhoods, clearCalculation } from '../../store/slices/shippingSlice';
import { Card, Button } from '../../components/ui';
import { ShippingCostDisplay } from './components/ShippingCostDisplay';
import { MdCalculate, MdInfo } from 'react-icons/md';

const ShippingCalculatorPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { calculation, zones, neighborhoods } = useAppSelector((state) => state.shipping);
  const loading = useAppSelector((state) => state.ui.loading);

  const [formData, setFormData] = useState({
    neighborhood: '',
    postal_code: '',
    subtotal: '',
    weight: '',
    is_express: false,
  });

  // Load zones and neighborhoods
  useEffect(() => {
    dispatch(loadZones());
    dispatch(loadNeighborhoods());
  }, [dispatch]);

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await dispatch(
      calculateShipping({
        neighborhood: formData.neighborhood,
        postal_code: formData.postal_code || undefined,
        subtotal: Number(formData.subtotal),
        weight: formData.weight ? Number(formData.weight) : undefined,
        is_express: formData.is_express,
      })
    );
  };

  // Clear calculation
  const handleClear = () => {
    setFormData({
      neighborhood: '',
      postal_code: '',
      subtotal: '',
      weight: '',
      is_express: false,
    });
    dispatch(clearCalculation());
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Get unique neighborhoods for autocomplete
  const uniqueNeighborhoods = Array.from(
    new Set(neighborhoods.filter((n) => n.is_active).map((n) => n.neighborhood_name))
  ).sort();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="animate-fade-down duration-fast">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calculadora de Envíos</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Calcula el costo de envío para cualquier ubicación
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator Form */}
        <Card className="animate-fade-right duration-normal">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Datos del Envío
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Neighborhood */}
            <div className="animate-fade-up duration-fast">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Barrio *
              </label>
              <input
                type="text"
                name="neighborhood"
                value={formData.neighborhood}
                onChange={handleChange}
                required
                list="neighborhoods"
                placeholder="Ej: Villa del Parque"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <datalist id="neighborhoods">
                {uniqueNeighborhoods.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            {/* Postal Code */}
            <div className="animate-fade-down duration-fast">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Código Postal
              </label>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                placeholder="Ej: 1416"
                maxLength={20}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Subtotal */}
            <div className="animate-fade-right duration-light-slow">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subtotal de la Compra ($) *
              </label>
              <input
                type="number"
                name="subtotal"
                value={formData.subtotal}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="Ej: 45000"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Weight */}
            <div className="animate-fade-left duration-normal">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Peso Total (kg)
              </label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="Ej: 5.5"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Express Delivery */}
            <div className="animate-fade-up duration-fast">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_express"
                  checked={formData.is_express}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Entrega Express
                </span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4 animate-fade-down duration-normal">
              <Button type="submit" variant="primary" disabled={loading} className="flex-1">
                {loading ? 'Calculando...' : 'Calcular Envío'}
              </Button>
              <Button type="button" onClick={handleClear} variant="secondary">
                Limpiar
              </Button>
            </div>
          </form>
        </Card>

        {/* Calculation Result */}
        <div className="space-y-6 animate-fade-left duration-normal">
          {calculation ? (
            <>
              <Card>
                <ShippingCostDisplay calculation={calculation} showBreakdown={true} />
              </Card>

              {/* Calculation Details */}
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Detalles del Cálculo
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Zona:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {calculation.zone_name}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Tarifa Base:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(Number(calculation.base_rate))}
                    </span>
                  </div>

                  {Number(calculation.weight_kg) > 0 && (
                    <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">
                        Recargo por Peso ({calculation.weight_kg} kg):
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(Number(calculation.weight_surcharge))}
                      </span>
                    </div>
                  )}

                  {calculation.is_express && (
                    <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Recargo Express:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(Number(calculation.express_surcharge))}
                      </span>
                    </div>
                  )}

                  {calculation.free_shipping_applied && (
                    <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Envío Gratis:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        ¡Aplicado! (Compra &ge; {formatCurrency(Number(calculation.free_shipping_threshold))})
                      </span>
                    </div>
                  )}

                  {calculation.estimated_delivery_date && (
                    <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Fecha Estimada:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(calculation.estimated_delivery_date).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between py-3 bg-primary-50 dark:bg-primary-900/20 px-4 rounded-sm mt-4">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Costo Total de Envío:
                    </span>
                    <span className="font-bold text-xl text-primary-600 dark:text-primary-400">
                      {formatCurrency(Number(calculation.total_shipping_cost))}
                    </span>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card>
              <div className="text-center py-12">
                <MdCalculate className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 animate-bounce" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  Completa el formulario para calcular
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Ingresa los datos del envío y presiona &quot;Calcular Envío&quot;
                </p>
              </div>
            </Card>
          )}

          {/* Info Card */}
          <Card>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-sm p-4">
              <div className="flex gap-3">
                <MdInfo className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-2">Información sobre los cálculos:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>El envío gratis se aplica si el subtotal supera el umbral configurado</li>
                    <li>Los recargos por peso solo aplican si no hay envío gratis</li>
                    <li>El recargo express siempre se aplica, incluso con envío gratis</li>
                    <li>La fecha estimada se calcula desde el momento actual</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Current Zones */}
      <Card className="animate-fade-up duration-normal">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Zonas de Envío Activas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones
            .filter((z) => z.is_active)
            .map((zone) => (
              <div
                key={zone.id}
                className="border border-gray-200 dark:border-gray-700 rounded-sm p-4 hover:border-primary-500 dark:hover:border-primary-400 transition-colors duration-fast"
              >
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">{zone.name}</h3>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p>Tarifa: {Number(zone.base_rate) === 0 ? 'GRATIS' : formatCurrency(Number(zone.base_rate))}</p>
                  {zone.free_shipping_threshold && (
                    <p className="text-green-600 dark:text-green-400">
                      Envío gratis desde {formatCurrency(Number(zone.free_shipping_threshold))}
                    </p>
                  )}
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
};

export default ShippingCalculatorPage;
