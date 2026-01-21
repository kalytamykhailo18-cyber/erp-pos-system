import React from 'react';
import { Card, Input, Button } from '../../components/ui';
import { MdSearch, MdQrCode } from 'react-icons/md';
import type { LoyaltyAccount } from '../../services/api/loyalty.service';

interface CustomersGridProps {
  customers: LoyaltyAccount[];
  search: string;
  onSearchChange: (value: string) => void;
  loading: boolean;
  onAdjustPoints: (customer: LoyaltyAccount) => void;
  onAdjustCredit: (customer: LoyaltyAccount) => void;
  onShowQR: (customer: LoyaltyAccount) => void;
  formatCurrency: (amount: number) => string;
  formatDateTime: (date: string) => string;
}

const CustomersGrid: React.FC<CustomersGridProps> = ({
  customers,
  search,
  onSearchChange,
  loading,
  onAdjustPoints,
  onAdjustCredit,
  onShowQR,
  formatCurrency,
  
}) => {
  const filteredCustomers = customers.filter((c) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      c.email?.toLowerCase().includes(searchLower) ||
      c.phone?.includes(search)
    );
  });

  return (
    <>
      {/* Search */}
      <Card className="p-4 animate-fade-down duration-fast">
        <Input
          placeholder="Buscar cliente por nombre, email o teléfono..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          leftIcon={<MdSearch className="w-5 h-5" />}
        />
      </Card>

      {/* Customers Grid */}
      {!loading && filteredCustomers.length === 0 ? (
        <Card className="p-12 text-center text-gray-500 animate-zoom-in duration-normal">
          <p>No hay clientes con programa de fidelidad</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-up duration-normal relative">
          {loading && (
            <div className="absolute top-4 right-4 z-10">
              <div className="animate-spin rounded-full h-6 w-6 border-4 border-gray-300 border-t-primary-600"></div>
            </div>
          )}
          {filteredCustomers.map((customer, index) => (
            <Card
              key={customer.id}
              className={`p-6 ${index % 3 === 0 ? 'animate-fade-left' : index % 3 === 1 ? 'animate-fade-up' : 'animate-fade-right'} ${index < 3 ? 'duration-fast' : index < 6 ? 'duration-normal' : 'duration-light-slow'}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center animate-zoom-in duration-normal">
                    <span className="text-primary-600 dark:text-primary-400 font-bold">
                      {`${customer.first_name?.[0] || ''}${customer.last_name?.[0] || ''}`.toUpperCase()}
                    </span>
                  </div>
                  <div className="animate-fade-right duration-fast">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {`${customer.first_name || ''} ${customer.last_name || ''}`.trim()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {customer.phone || customer.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onShowQR(customer)}
                  className="p-2 text-gray-400 hover:text-primary-500 animate-fade-left duration-fast"
                  title="Ver QR"
                >
                  <MdQrCode className="w-5 h-5" />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-primary-50 dark:bg-primary-900/20 rounded-sm animate-flip-up duration-normal">
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {customer.loyalty_points.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Puntos</p>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-sm animate-flip-up duration-light-slow">
                  <p className={`text-2xl font-bold ${
                    customer.credit_balance < 0 ? 'text-danger-500' : 'text-green-600 dark:text-green-400'
                  }`}>
                    {formatCurrency(customer.credit_balance)}
                  </p>
                  <p className="text-xs text-gray-500">Crédito</p>
                </div>
              </div>

              <div className="text-sm text-gray-500 mb-4 animate-fade-up duration-normal">
                <p className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    customer.loyalty_tier === 'PLATINUM' ? 'bg-purple-100 text-purple-700' :
                    customer.loyalty_tier === 'GOLD' ? 'bg-yellow-100 text-yellow-700' :
                    customer.loyalty_tier === 'SILVER' ? 'bg-gray-200 text-gray-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {customer.loyalty_tier}
                  </span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 animate-fade-up duration-light-slow">
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => onAdjustPoints(customer)}
                  className="animate-fade-left duration-fast"
                >
                  Ajustar Puntos
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => onAdjustCredit(customer)}
                  className="animate-fade-right duration-fast"
                >
                  Ajustar Crédito
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};

export default CustomersGrid;
