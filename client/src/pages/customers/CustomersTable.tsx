import React from 'react';
import { Pagination } from '../../components/ui';
import type { PaginationState } from '../../components/ui/Pagination';
import type { Customer } from '../../types';
import { MdGroup, MdEdit, MdDelete } from 'react-icons/md';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

interface CustomersTableProps {
  customers: Customer[];
  loading: boolean;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onViewDetails: (customer: Customer) => void;
  onCreate: () => void;
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (limit: number) => void;
}

export const CustomersTable: React.FC<CustomersTableProps> = ({
  customers,
  loading,
  onEdit,
  onDelete,
  onViewDetails,
  onCreate,
  pagination,
  onPageChange,
  onPageSizeChange,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  // Reusable pagination component
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

  if (!loading && customers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <MdGroup className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No hay clientes registrados</p>
        <button
          onClick={onCreate}
          className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-sm hover:bg-primary-600"
        >
          Crear primer cliente
        </button>
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
        <table className="w-full">
          <thead className="bg-primary-600 dark:bg-primary-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Documento
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                Puntos
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                Saldo
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {customers.map((customer) => (
              <tr
                key={customer.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => onViewDetails(customer)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm">
                        {customer.first_name?.[0]}{customer.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {customer.first_name} {customer.last_name}
                      </p>
                      {customer.company_name && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {customer.company_name}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    {customer.email && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {customer.email}
                      </p>
                    )}
                    {customer.phone && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {customer.phone}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {customer.document_number ? (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {customer.document_type}: {customer.document_number}
                    </p>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400">
                    {customer.loyalty_points || 0} pts
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`text-sm font-medium ${
                    Number(customer.credit_balance || 0) < 0
                      ? 'text-danger-500'
                      : Number(customer.credit_balance || 0) > 0
                      ? 'text-green-500'
                      : 'text-gray-500'
                  }`}>
                    {formatCurrency(Number(customer.credit_balance || 0))}
                  </span>
                </td>
                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(customer)}
                      className="p-2 text-gray-400 hover:text-primary-500"
                    >
                      <MdEdit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete(customer.id)}
                      className="p-2 text-gray-400 hover:text-danger-500"
                    >
                      <MdDelete className="w-5 h-5" />
                    </button>
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
