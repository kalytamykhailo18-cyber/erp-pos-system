import React, { useState } from 'react';
import { useAppDispatch } from '../../store';
import {
  submitPurchaseOrder,
  approvePurchaseOrder,
  cancelPurchaseOrder,
} from '../../store/slices/supplierSlice';
import { Button } from '../../components/ui';
import { ReceiveOrderModal } from './ReceiveOrderModal';
import type { PurchaseOrder } from '../../services/api/supplier.service';
import { MdClose } from 'react-icons/md';

interface PurchaseOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrder;
}

export const PurchaseOrderDetailModal: React.FC<PurchaseOrderDetailModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    const styles: Record<PurchaseOrder['status'], string> = {
      DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      SUBMITTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      PARTIALLY_RECEIVED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      RECEIVED: 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    };

    const labels: Record<PurchaseOrder['status'], string> = {
      DRAFT: 'Borrador',
      SUBMITTED: 'Enviado',
      APPROVED: 'Aprobado',
      PARTIALLY_RECEIVED: 'Parcialmente Recibido',
      RECEIVED: 'Recibido',
      CANCELLED: 'Cancelado',
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const handleSubmit = async () => {
    if (!confirm('¿Está seguro que desea enviar esta orden para aprobación?')) return;

    setLoading(true);
    try {
      await dispatch(submitPurchaseOrder(order.id)).unwrap();
      onClose();
    } catch (error) {
      // Error handled by slice
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('¿Está seguro que desea aprobar esta orden?')) return;

    setLoading(true);
    try {
      await dispatch(approvePurchaseOrder(order.id)).unwrap();
      onClose();
    } catch (error) {
      // Error handled by slice
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = () => {
    setIsReceiveModalOpen(true);
  };

  const handleCancel = async () => {
    const reason = prompt('Ingrese el motivo de cancelación:');
    if (!reason) return;

    setLoading(true);
    try {
      await dispatch(cancelPurchaseOrder({ id: order.id, reason })).unwrap();
      onClose();
    } catch (error) {
      // Error handled by slice
    } finally {
      setLoading(false);
    }
  };

  const handleCloseReceiveModal = () => {
    setIsReceiveModalOpen(false);
    onClose(); // Also close the detail modal after receiving
  };

  if (!isOpen) return null;

  const canSubmit = order.status === 'DRAFT';
  const canApprove = order.status === 'SUBMITTED';
  const canReceive = order.status === 'APPROVED' || order.status === 'PARTIALLY_RECEIVED';
  const canCancel = ['DRAFT', 'SUBMITTED'].includes(order.status);

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          {/* Backdrop */}
          <div
            className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-md">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Orden de Compra #{order.order_number}
                  </h3>
                  {getStatusBadge(order.status)}
                </div>
                <p className="text-sm text-gray-500">
                  Creada el {formatDate(order.created_at)}
                </p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Cerrar</span>
                <MdClose className="h-6 w-6" />
              </button>
            </div>

            {/* Order Information */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">Información del Proveedor</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Proveedor</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.supplier?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Sucursal</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.branch?.name}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">Fechas</h4>
                <div className="space-y-2">
                  {order.expected_date && (
                    <div>
                      <p className="text-xs text-gray-500">Fecha Esperada</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(order.expected_date)}
                      </p>
                    </div>
                  )}
                  {order.submitted_at && (
                    <div>
                      <p className="text-xs text-gray-500">Enviada</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(order.submitted_at)}
                      </p>
                    </div>
                  )}
                  {order.approved_at && (
                    <div>
                      <p className="text-xs text-gray-500">Aprobada</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(order.approved_at)}
                      </p>
                    </div>
                  )}
                  {order.received_at && (
                    <div>
                      <p className="text-xs text-gray-500">Recibida</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(order.received_at)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Notas</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded">
                  {order.notes}
                </p>
              </div>
            )}

            {/* Items Table */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Productos ({order.items?.length || 0})
              </h4>
              <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-md">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Producto
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        SKU
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Cant. Ordenada
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Cant. Recibida
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Precio Unit.
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {order.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {item.product?.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {item.product?.sku}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                          {item.quantity_ordered}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={item.quantity_received > 0 ? 'text-green-600 font-medium' : 'text-gray-500'}>
                            {item.quantity_received}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                          {formatCurrency(item.total_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md mb-6">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(order.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">IVA:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(order.tax_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-300 dark:border-gray-600 pt-2">
                    <span className="text-gray-900 dark:text-white">Total:</span>
                    <span className="text-primary-600 dark:text-primary-400">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                {canCancel && (
                  <Button
                    variant="danger"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancelar Orden
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cerrar
                </Button>
                {canSubmit && (
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    Enviar para Aprobación
                  </Button>
                )}
                {canApprove && (
                  <Button
                    variant="primary"
                    onClick={handleApprove}
                    disabled={loading}
                  >
                    Aprobar Orden
                  </Button>
                )}
                {canReceive && (
                  <Button
                    variant="primary"
                    onClick={handleReceive}
                    disabled={loading}
                  >
                    Recibir Productos
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Receive Order Modal */}
      <ReceiveOrderModal
        isOpen={isReceiveModalOpen}
        onClose={handleCloseReceiveModal}
        order={order}
      />
    </>
  );
};
