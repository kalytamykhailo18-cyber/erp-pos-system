import React, { useState } from 'react';
import { useAppDispatch } from '../../store';
import { retryInvoice } from '../../store/slices/invoicesSlice';
import { Modal, Button } from '../../components/ui';
import type { Invoice } from '../../types';
import { MdRefresh, MdPrint } from 'react-icons/md';

interface InvoiceDetailModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
}

const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  isOpen,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const [retrying, setRetrying] = useState(false);
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

  const getInvoiceTypeLabel = (code: string) => {
    const typeLabels: Record<string, string> = {
      A: 'Factura A',
      B: 'Factura B',
      C: 'Factura C',
      NC_A: 'Nota de Crédito A',
      NC_B: 'Nota de Crédito B',
      NC_C: 'Nota de Crédito C',
    };
    return typeLabels[code] || code;
  };

  const handlePrintPDF = () => {
    if (invoice.pdf_url) {
      window.open(invoice.pdf_url, '_blank');
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await dispatch(retryInvoice(invoice.id)).unwrap();
      // Invoice state will be updated by Redux, modal will reflect changes
    } catch (error) {
      // Error already handled by thunk with toast
    } finally {
      setRetrying(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de Factura"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Info */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-sm animate-fade-down duration-fast">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Número de Factura</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {invoice.point_of_sale.toString().padStart(4, '0')}-
              {invoice.invoice_number.toString().padStart(8, '0')}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tipo</p>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {getInvoiceTypeLabel(invoice.invoice_type?.code || '')}
            </p>
          </div>
        </div>

        {/* CAE Info */}
        {invoice.cae && (
          <div className="p-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-sm animate-fade-right duration-normal">
            <p className="text-xs text-success-700 dark:text-success-300 mb-1">CAE (Código de Autorización Electrónica)</p>
            <p className="text-lg font-mono font-bold text-success-900 dark:text-success-100">
              {invoice.cae}
            </p>
            {invoice.cae_expiration_date && (
              <p className="text-xs text-success-600 dark:text-success-400 mt-1">
                Vencimiento: {new Date(invoice.cae_expiration_date).toLocaleDateString('es-AR')}
              </p>
            )}
          </div>
        )}

        {/* Error Message */}
        {invoice.status === 'FAILED' && invoice.error_message && (
          <div className="p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-sm animate-zoom-in duration-fast">
            <p className="text-xs text-danger-700 dark:text-danger-300 mb-1">Error de Facturación</p>
            <p className="text-sm text-danger-900 dark:text-danger-100">
              {invoice.error_message}
            </p>
            {invoice.retry_count > 0 && (
              <p className="text-xs text-danger-600 dark:text-danger-400 mt-2">
                Reintentos realizados: {invoice.retry_count}
              </p>
            )}
          </div>
        )}

        {/* Customer Info */}
        <div className="animate-fade-left duration-light-slow">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Información del Cliente</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Nombre/Razón Social</p>
              <p className="text-sm text-gray-900 dark:text-white">
                {invoice.customer_name || 'Consumidor Final'}
              </p>
            </div>
            {invoice.customer_document_number && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Documento</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {invoice.customer_document_type}: {invoice.customer_document_number}
                </p>
              </div>
            )}
            {invoice.customer_tax_condition && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Condición IVA</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {invoice.customer_tax_condition}
                </p>
              </div>
            )}
            {invoice.customer_address && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Dirección</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {invoice.customer_address}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sale Info */}
        {invoice.sale && (
          <div className="animate-fade-up duration-normal">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Información de Venta</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Número de Venta</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {invoice.sale.sale_number}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sucursal</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {invoice.sale.branch?.name || '-'}
                </p>
              </div>
              {invoice.sale.cashier && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Cajero</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {invoice.sale.cashier.first_name} {invoice.sale.cashier.last_name}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Amounts */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-sm animate-fade-up duration-light-slow">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Montos</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal (neto)</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatCurrency(invoice.net_amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">IVA</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatCurrency(invoice.tax_amount)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
              <span className="text-base font-semibold text-gray-900 dark:text-white">Total</span>
              <span className="text-base font-bold text-primary-600 dark:text-primary-400">
                {formatCurrency(invoice.total_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-400 animate-fade-up duration-slow">
          <div>
            <p className="mb-1">Fecha de Creación</p>
            <p className="text-gray-900 dark:text-white">{formatDate(invoice.created_at)}</p>
          </div>
          {invoice.issued_at && (
            <div>
              <p className="mb-1">Fecha de Emisión</p>
              <p className="text-gray-900 dark:text-white">{formatDate(invoice.issued_at)}</p>
            </div>
          )}
        </div>

        {/* FactuHoy ID */}
        {invoice.factuhoy_id && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p className="mb-1">ID FactuHoy</p>
            <p className="text-gray-900 dark:text-white font-mono">{invoice.factuhoy_id}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 animate-fade-up duration-normal">
          {/* Retry button for PENDING or FAILED invoices */}
          {(invoice.status === 'PENDING' || invoice.status === 'FAILED') && (
            <Button
              variant="primary"
              onClick={handleRetry}
              disabled={retrying}
              icon={<MdRefresh className="w-5 h-5" />}
              iconPosition="left"
            >
              {retrying ? 'Reintentando...' : 'Reintentar'}
            </Button>
          )}

          {/* PDF download button */}
          {invoice.pdf_url && invoice.status === 'ISSUED' && (
            <Button
              variant="secondary"
              onClick={handlePrintPDF}
              icon={<MdPrint className="w-5 h-5" />}
              iconPosition="left"
            >
              Descargar PDF
            </Button>
          )}

          <Button variant="secondary" onClick={onClose} fullWidth={!(invoice.status === 'PENDING' || invoice.status === 'FAILED' || invoice.pdf_url)}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InvoiceDetailModal;
