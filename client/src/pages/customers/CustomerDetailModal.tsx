import React from 'react';
import { Modal, Button } from '../../components/ui';
import type { Customer } from '../../types';
import { MdEmail, MdPhone, MdBadge, MdLocationOn } from 'react-icons/md';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onEdit: (customer: Customer) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  isOpen,
  onClose,
  customer,
  onEdit,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  if (!customer) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle del Cliente"
      size="md"
    >
      <div className="space-y-6 animate-fade-up duration-normal">
        {/* Customer info */}
        <div className="flex items-center gap-4 animate-zoom-in duration-fast">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <span className="text-primary-600 dark:text-primary-400 font-bold text-xl">
              {customer.first_name?.[0]}{customer.last_name?.[0]}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {customer.first_name} {customer.last_name}
            </h3>
            {customer.company_name && (
              <p className="text-gray-500 dark:text-gray-400">
                {customer.company_name}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-sm text-center animate-fade-right duration-normal">
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {customer.loyalty_points || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Puntos</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-sm text-center animate-fade-left duration-normal">
            <p className={`text-2xl font-bold ${
              Number(customer.credit_balance || 0) < 0 ? 'text-danger-500' : 'text-gray-900 dark:text-white'
            }`}>
              {formatCurrency(Number(customer.credit_balance || 0))}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Saldo</p>
          </div>
        </div>

        {/* Contact info */}
        <div className="space-y-3">
          {customer.email && (
            <div className="flex items-center gap-3">
              <MdEmail className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">{customer.email}</span>
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center gap-3">
              <MdPhone className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">{customer.phone}</span>
            </div>
          )}
          {customer.document_number && (
            <div className="flex items-center gap-3">
              <MdBadge className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">
                {customer.document_type}: {customer.document_number}
              </span>
            </div>
          )}
          {customer.address && (
            <div className="flex items-center gap-3">
              <MdLocationOn className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">
                {customer.address}
                {customer.city && `, ${customer.city}`}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              onClose();
              onEdit(customer);
            }}
          >
            Editar
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
