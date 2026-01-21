import React from 'react';
import type { Expense, UUID } from '../../types';
import Pagination, { type PaginationState } from '../../components/ui/Pagination';
import { MdDescription, MdVisibility, MdEdit, MdCheckCircle, MdCancel, MdPayment, MdDelete } from 'react-icons/md';

interface ExpensesTableProps {
  expenses: Expense[];
  loading: boolean;
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
  onView: (expense: Expense) => void;
  onEdit: (expense: Expense) => void;
  onApprove: (id: UUID) => void;
  onReject: (id: UUID) => void;
  onMarkAsPaid: (id: UUID) => void;
  onDelete: (id: UUID) => void;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export const ExpensesTable: React.FC<ExpensesTableProps> = ({
  expenses,
  loading,
  pagination,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onApprove,
  onReject,
  onMarkAsPaid,
  onDelete,
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
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium';

    switch (status) {
      case 'PENDING':
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`}>
            Pendiente
          </span>
        );
      case 'APPROVED':
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`}>
            Aprobado
          </span>
        );
      case 'PAID':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`}>
            Pagado
          </span>
        );
      case 'REJECTED':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`}>
            Rechazado
          </span>
        );
      case 'CANCELLED':
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`}>
            Cancelado
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`}>
            {status}
          </span>
        );
    }
  };

  if (!loading && expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <MdDescription className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No hay gastos
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Comienza creando un nuevo gasto.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
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
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Número
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Proveedor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Monto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {expenses.map((expense) => (
              <tr
                key={expense.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-fast"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {expense.expense_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(expense.expense_date)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                  {expense.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-xs font-medium"
                    style={{
                      backgroundColor: `${expense.category?.color_hex}20`,
                      color: expense.category?.color_hex,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: expense.category?.color_hex }}
                    />
                    {expense.category?.name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {expense.vendor_name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(expense.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {getStatusBadge(expense.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onView(expense)}
                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-fast"
                      title="Ver detalles"
                    >
                      <MdVisibility className="w-5 h-5" />
                    </button>

                    {expense.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => onEdit(expense)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-fast"
                          title="Editar"
                        >
                          <MdEdit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onApprove(expense.id)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition-colors duration-fast"
                          title="Aprobar"
                        >
                          <MdCheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onReject(expense.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-fast"
                          title="Rechazar"
                        >
                          <MdCancel className="w-5 h-5" />
                        </button>
                      </>
                    )}

                    {expense.status === 'APPROVED' && (
                      <button
                        onClick={() => onMarkAsPaid(expense.id)}
                        className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 transition-colors duration-fast"
                        title="Marcar como pagado"
                      >
                        <MdPayment className="w-5 h-5" />
                      </button>
                    )}

                    {(expense.status === 'PENDING' || expense.status === 'REJECTED') && (
                      <button
                        onClick={() => onDelete(expense.id)}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 transition-colors duration-fast"
                        title="Eliminar"
                      >
                        <MdDelete className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Pagination */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <PaginationNav />
      </div>
    </div>
  );
};
