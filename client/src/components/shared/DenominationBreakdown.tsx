import React, { useMemo } from 'react';
import type { DenominationBreakdown as DenominationValues } from '../../types';

interface DenominationBreakdownProps {
  values: DenominationValues;
  onChange: (values: DenominationValues) => void;
  readonly?: boolean;
  className?: string;
}

const DenominationBreakdown: React.FC<DenominationBreakdownProps> = ({
  values,
  onChange,
  readonly = false,
  className = ''
}) => {
  const handleChange = (field: keyof DenominationValues, quantity: number) => {
    onChange({
      ...values,
      [field]: quantity >= 0 ? quantity : 0
    });
  };

  const calculateTotal = useMemo(() => {
    return (
      values.bills_20000 * 20000 +
      values.bills_10000 * 10000 +
      values.bills_2000 * 2000 +
      values.bills_1000 * 1000 +
      values.bills_500 * 500 +
      values.bills_200 * 200 +
      values.bills_100 * 100 +
      values.bills_50 * 50 +
      values.coins
    );
  }, [values]);

  // Argentina 2024 bill denominations
  const denominations = [
    { field: 'bills_20000' as const, label: '$20.000', value: 20000 },
    { field: 'bills_10000' as const, label: '$10.000', value: 10000 },
    { field: 'bills_2000' as const, label: '$2.000', value: 2000 },
    { field: 'bills_1000' as const, label: '$1.000', value: 1000 },
    { field: 'bills_500' as const, label: '$500', value: 500 },
    { field: 'bills_200' as const, label: '$200', value: 200 },
    { field: 'bills_100' as const, label: '$100', value: 100 },
    { field: 'bills_50' as const, label: '$50', value: 50 }
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-white">
          Desglose de Billetes y Monedas
        </h4>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          ARS
        </span>
      </div>

      {/* Bills */}
      <div className="space-y-2">
        {denominations.map((denom) => {
          const quantity = values[denom.field];
          const subtotal = quantity * denom.value;

          return (
            <div key={denom.field} className="grid grid-cols-[80px_1fr_120px] gap-3 items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {denom.label} x
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(e) => handleChange(denom.field, parseInt(e.target.value) || 0)}
                readOnly={readonly}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800"
              />
              <span className="text-right text-sm font-medium text-gray-900 dark:text-white">
                ${subtotal.toLocaleString('es-AR')}
              </span>
            </div>
          );
        })}

        {/* Coins */}
        <div className="grid grid-cols-[80px_1fr_120px] gap-3 items-center">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Monedas
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.coins}
            onChange={(e) => handleChange('coins', parseFloat(e.target.value) || 0)}
            readOnly={readonly}
            placeholder="0.00"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800"
          />
          <span className="text-right text-sm font-medium text-gray-900 dark:text-white">
            ${values.coins.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Total */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-4">
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-gray-900 dark:text-white">
            Total:
          </span>
          <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
            ${calculateTotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DenominationBreakdown;
