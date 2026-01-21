import React from 'react';
import { Card } from '../../components/ui';
import Pagination, { type PaginationState } from '../../components/ui/Pagination';
import type { PointsTransaction, CreditTransaction } from '../../services/api/loyalty.service';

type LoyaltyTransaction = PointsTransaction | CreditTransaction;

interface TransactionsTableProps {
  transactions: LoyaltyTransaction[];
  loading: boolean;
  formatCurrency: (amount: number) => string;
  formatDateTime: (date: string) => string;
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  loading,
  formatCurrency,
  formatDateTime,
  pagination,
  onPageChange,
  onPageSizeChange,
}) => {
  // Reusable pagination component for top and bottom
  const PaginationNav = () => (
    <Pagination
      pagination={pagination}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      loading={loading}
      variant="extended"
      showPageSize
      pageSizeOptions={PAGE_SIZE_OPTIONS}
    />
  );
  const isPointsTransaction = (tx: LoyaltyTransaction): tx is PointsTransaction => {
    return 'points' in tx;
  };

  const isCreditTransaction = (tx: LoyaltyTransaction): tx is CreditTransaction => {
    return 'amount' in tx;
  };

  const getTransactionStyle = (type: string) => {
    const styles: Record<string, { label: string; color: string }> = {
      EARN: { label: 'Ganados', color: 'text-green-500' },
      REDEEM: { label: 'Canjeados', color: 'text-primary-500' },
      EXPIRY: { label: 'Expirados', color: 'text-gray-500' },
      ADJUSTMENT: { label: 'Ajuste', color: 'text-blue-500' },
      CREDIT_GIVEN: { label: 'Crédito agregado', color: 'text-green-500' },
      CREDIT_USED: { label: 'Crédito usado', color: 'text-warning-500' },
    };
    return styles[type] || { label: type, color: 'text-gray-500' };
  };

  if (!loading && transactions.length === 0) {
    return (
      <Card className="overflow-hidden animate-fade-up duration-normal">
        <div className="text-center py-12 text-gray-500 animate-fade-down duration-normal">
          <p>No hay transacciones registradas</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden animate-fade-up duration-normal relative">
      {loading && (
        <div className="absolute top-4 right-4 z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-4 border-gray-300 border-t-primary-600"></div>
        </div>
      )}
      {/* Top Pagination */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <PaginationNav />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-primary-600 dark:bg-primary-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Puntos</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Crédito</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Descripción</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.map((tx, index) => {
                const style = getTransactionStyle(tx.transaction_type);
                return (
                  <tr
                    key={tx.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${index % 2 === 0 ? 'animate-fade-left' : 'animate-fade-right'} ${index < 3 ? 'duration-fast' : index < 6 ? 'duration-normal' : 'duration-light-slow'}`}
                  >
                    <td className="px-6 py-4 text-sm text-gray-500 animate-fade-up duration-very-fast">
                      {formatDateTime(tx.created_at)}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white animate-fade-up duration-fast">
                      {tx.customer_name}
                    </td>
                    <td className="px-6 py-4 animate-zoom-in duration-normal">
                      <span className={`text-sm font-medium ${style.color}`}>
                        {style.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right animate-flip-up duration-normal">
                      {isPointsTransaction(tx) && tx.points !== 0 && (
                        <span className={`font-medium ${
                          tx.points > 0 ? 'text-green-500' : 'text-danger-500'
                        }`}>
                          {tx.points > 0 ? '+' : ''}{tx.points}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right animate-flip-up duration-light-slow">
                      {isCreditTransaction(tx) && tx.amount !== 0 && (
                        <span className={`font-medium ${
                          tx.amount > 0 ? 'text-green-500' : 'text-danger-500'
                        }`}>
                          {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 animate-fade-left duration-slow">
                      {tx.reason || '-'}
                      {tx.sale_id && (
                        <span className="text-xs text-gray-400 ml-2">
                          (Venta: {tx.sale_id})
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Bottom Pagination */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <PaginationNav />
      </div>
    </Card>
  );
};

export default TransactionsTable;
