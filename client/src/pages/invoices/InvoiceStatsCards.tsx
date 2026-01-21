import React from 'react';
import type { InvoiceStats } from '../../services/api/invoice.service';
import { MdDescription, MdAttachMoney, MdCalculate, MdSchedule } from 'react-icons/md';

interface InvoiceStatsCardsProps {
  stats: InvoiceStats;
}

const InvoiceStatsCards: React.FC<InvoiceStatsCardsProps> = ({ stats }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Invoices */}
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 border-l-4 border-primary-500 animate-fade-right duration-fast">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Facturas</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totals.total_count}
            </p>
          </div>
          <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full">
            <MdDescription className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
      </div>

      {/* Total Amount */}
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 border-l-4 border-success-500 animate-fade-up duration-normal">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Monto Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(stats.totals.total_amount)}
            </p>
          </div>
          <div className="p-3 bg-success-100 dark:bg-success-900/30 rounded-full">
            <MdAttachMoney className="w-6 h-6 text-success-600 dark:text-success-400" />
          </div>
        </div>
      </div>

      {/* Total Tax */}
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 border-l-4 border-info-500 animate-fade-left duration-light-slow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">IVA Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(stats.totals.total_tax)}
            </p>
          </div>
          <div className="p-3 bg-info-100 dark:bg-info-900/30 rounded-full">
            <MdCalculate className="w-6 h-6 text-info-600 dark:text-info-400" />
          </div>
        </div>
      </div>

      {/* Pending Count */}
      <div className={`bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 border-l-4 ${
        stats.pending_count > 0 ? 'border-warning-500' : 'border-gray-300 dark:border-gray-600'
      } animate-fade-down duration-slow`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Pendientes</p>
            <p className={`text-2xl font-bold ${
              stats.pending_count > 0 ? 'text-warning-600 dark:text-warning-400' : 'text-gray-900 dark:text-white'
            }`}>
              {stats.pending_count}
            </p>
          </div>
          <div className={`p-3 rounded-full ${
            stats.pending_count > 0
              ? 'bg-warning-100 dark:bg-warning-900/30'
              : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            <MdSchedule className={`w-6 h-6 ${
              stats.pending_count > 0
                ? 'text-warning-600 dark:text-warning-400'
                : 'text-gray-400'
            }`} />
          </div>
        </div>
      </div>

      {/* By Type Breakdown */}
      {stats.by_type.length > 0 && (
        <div className="md:col-span-2 lg:col-span-4 bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-up duration-normal">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Facturas por Tipo
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {stats.by_type.map((item) => (
              <div
                key={item.invoice_type}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-sm animate-zoom-in duration-fast"
              >
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tipo {item.invoice_type}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {item.count}
                </p>
                <p className="text-sm text-primary-600 dark:text-primary-400">
                  {formatCurrency(item.total)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceStatsCards;
