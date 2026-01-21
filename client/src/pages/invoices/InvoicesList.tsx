import React, { useState } from 'react';
import { Button } from '../../components/ui';
import Pagination, { type PaginationState } from '../../components/ui/Pagination';
import InvoiceDetailModal from './InvoiceDetailModal';
import type { Invoice } from '../../types';
import { MdDescription } from 'react-icons/md';

interface InvoicesListProps {
  invoices: Invoice[];
  loading: boolean;
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const InvoicesList: React.FC<InvoicesListProps> = ({
  invoices,
  loading,
  pagination,
  onPageChange,
  onPageSizeChange,
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(Number(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: {
        bg: 'bg-warning-100 dark:bg-warning-900/30',
        text: 'text-warning-700 dark:text-warning-300',
        label: 'Pendiente',
      },
      ISSUED: {
        bg: 'bg-success-100 dark:bg-success-900/30',
        text: 'text-success-700 dark:text-success-300',
        label: 'Emitida',
      },
      FAILED: {
        bg: 'bg-danger-100 dark:bg-danger-900/30',
        text: 'text-danger-700 dark:text-danger-300',
        label: 'Fallida',
      },
      CANCELLED: {
        bg: 'bg-gray-100 dark:bg-gray-700',
        text: 'text-gray-700 dark:text-gray-300',
        label: 'Cancelada',
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getInvoiceTypeLabel = (code: string) => {
    const typeLabels: Record<string, string> = {
      A: 'Factura A',
      B: 'Factura B',
      C: 'Factura C',
      NC_A: 'NC A',
      NC_B: 'NC B',
      NC_C: 'NC C',
    };
    return typeLabels[code] || code;
  };

  if (!loading && invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500 animate-fade-up duration-normal">
        <MdDescription className="w-16 h-16 mb-4 opacity-50" />
        <p>No se encontraron facturas</p>
      </div>
    );
  }

  // Pagination component to be rendered at top and bottom
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-primary-600 dark:bg-primary-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Número
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Monto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                CAE
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
            {invoices.map((invoice) => (
              <tr
                key={invoice.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors animate-fade-up duration-fast"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {invoice.point_of_sale.toString().padStart(4, '0')}-
                    {invoice.invoice_number.toString().padStart(8, '0')}
                  </div>
                  {invoice.sale && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Venta: {invoice.sale.sale_number}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {getInvoiceTypeLabel(invoice.invoice_type?.code || '')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {invoice.customer_name || 'Consumidor Final'}
                  </div>
                  {invoice.customer_document_number && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {invoice.customer_document_type}: {invoice.customer_document_number}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {formatDate(invoice.created_at)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(invoice.total_amount)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    IVA: {formatCurrency(invoice.tax_amount)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {invoice.cae ? (
                    <div className="text-sm text-gray-900 dark:text-white font-mono">
                      {invoice.cae}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                  {invoice.cae_expiration_date && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Vence: {new Date(invoice.cae_expiration_date).toLocaleDateString('es-AR')}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(invoice.status)}
                  {invoice.status === 'FAILED' && invoice.retry_count > 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Reintentos: {invoice.retry_count}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedInvoice(invoice)}
                  >
                    Ver Detalle
                  </Button>
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

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};

export default InvoicesList;
