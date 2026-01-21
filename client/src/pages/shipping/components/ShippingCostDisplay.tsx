import React from 'react';
import type { ShippingCalculation } from '../../../types';
import { MdCheckCircle, MdEvent } from 'react-icons/md';

interface ShippingCostDisplayProps {
  calculation: ShippingCalculation;
  showBreakdown?: boolean;
}

export const ShippingCostDisplay: React.FC<ShippingCostDisplayProps> = ({
  calculation,
  showBreakdown = false,
}) => {
  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(value));
  };

  return (
    <div className="space-y-4">
      {/* Main Cost Display */}
      <div className="flex items-center justify-between animate-fade-down duration-fast">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Costo de Envío</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{calculation.zone_name}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {Number(calculation.total_shipping_cost) === 0 ? (
              <span className="text-green-600 dark:text-green-400">GRATIS</span>
            ) : (
              formatCurrency(calculation.total_shipping_cost)
            )}
          </div>
          {calculation.is_express && (
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">EXPRESS</span>
          )}
        </div>
      </div>

      {/* Free Shipping Badge */}
      {calculation.free_shipping_applied && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-sm p-3 animate-fade-right duration-fast">
          <div className="flex items-center gap-2">
            <MdCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              ¡Envío gratis! Superaste el mínimo de {formatCurrency(calculation.free_shipping_threshold || 0)}
            </span>
          </div>
        </div>
      )}

      {/* Breakdown */}
      {showBreakdown && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2 animate-fade-up duration-normal">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Tarifa base:</span>
            <span className="text-gray-900 dark:text-white">{formatCurrency(calculation.base_rate)}</span>
          </div>

          {Number(calculation.weight_kg) > 0 && Number(calculation.weight_surcharge) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Recargo por peso ({calculation.weight_kg} kg):
              </span>
              <span className="text-gray-900 dark:text-white">{formatCurrency(calculation.weight_surcharge)}</span>
            </div>
          )}

          {calculation.is_express && Number(calculation.express_surcharge) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Recargo express:</span>
              <span className="text-gray-900 dark:text-white">{formatCurrency(calculation.express_surcharge)}</span>
            </div>
          )}
        </div>
      )}

      {/* Delivery Estimate */}
      {calculation.estimated_delivery_date && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 animate-fade-left duration-fast">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MdEvent className="w-4 h-4" />
            <span>
              Entrega estimada:{' '}
              {new Date(calculation.estimated_delivery_date).toLocaleDateString('es-AR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
