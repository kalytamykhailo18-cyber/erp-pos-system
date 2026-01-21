import React from 'react';
import { Card } from '../../components/ui';
import type { ExpenseStats } from '../../types';
import { MdAttachMoney, MdSchedule, MdCheckCircle, MdPayment } from 'react-icons/md';

interface ExpenseStatsCardsProps {
  stats: ExpenseStats;
}

export const ExpenseStatsCards: React.FC<ExpenseStatsCardsProps> = ({ stats }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up duration-normal">
      <Card className="animate-fade-right duration-fast">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-sm flex items-center justify-center">
            <MdAttachMoney className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Gastos</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(stats.total_amount)}
            </p>
          </div>
        </div>
      </Card>

      <Card className="animate-fade-up duration-light-slow">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-sm flex items-center justify-center">
            <MdSchedule className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pendientes</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(stats.total_pending)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {stats.count_pending} gasto{stats.count_pending !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </Card>

      <Card className="animate-fade-up duration-normal">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-sm flex items-center justify-center">
            <MdCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Aprobados</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(stats.total_approved)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {stats.count_approved} gasto{stats.count_approved !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </Card>

      <Card className="animate-fade-left duration-normal">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-sm flex items-center justify-center">
            <MdPayment className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pagados</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(stats.total_paid)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {stats.count_paid} gasto{stats.count_paid !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
