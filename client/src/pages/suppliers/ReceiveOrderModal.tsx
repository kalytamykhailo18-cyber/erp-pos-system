import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../../store';
import { receivePurchaseOrder } from '../../store/slices/supplierSlice';
import { Button } from '../../components/ui';
import type { PurchaseOrder, ReceivePurchaseOrderData } from '../../services/api/supplier.service';
import { MdClose, MdWarning } from 'react-icons/md';

interface ReceiveOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrder;
}

interface ReceiveItem {
  id: string;
  product_name: string;
  product_sku: string;
  quantity_ordered: number;
  quantity_received: number;
  quantity_to_receive: number;
  remaining: number;
}

export const ReceiveOrderModal: React.FC<ReceiveOrderModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ReceiveItem[]>([]);

  useEffect(() => {
    if (order.items) {
      setItems(
        order.items.map((item) => ({
          id: item.id,
          product_name: item.product?.name || '',
          product_sku: item.product?.sku || '',
          quantity_ordered: item.quantity_ordered,
          quantity_received: item.quantity_received,
          quantity_to_receive: item.quantity_ordered - item.quantity_received,
          remaining: item.quantity_ordered - item.quantity_received,
        }))
      );
    }
  }, [order]);

  const handleQuantityChange = (index: number, value: number) => {
    const newItems = [...items];
    const item = newItems[index];

    // Ensure quantity doesn't exceed remaining
    const maxQuantity = item.remaining;
    const quantity = Math.min(Math.max(0, value), maxQuantity);

    newItems[index].quantity_to_receive = quantity;
    setItems(newItems);
  };

  const handleReceiveAll = () => {
    setItems(
      items.map((item) => ({
        ...item,
        quantity_to_receive: item.remaining,
      }))
    );
  };

  const handleClearAll = () => {
    setItems(
      items.map((item) => ({
        ...item,
        quantity_to_receive: 0,
      }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter only items with quantity to receive
    const itemsToReceive = items.filter((item) => item.quantity_to_receive > 0);

    if (itemsToReceive.length === 0) {
      alert('Debe ingresar al menos una cantidad para recibir');
      return;
    }

    const data: ReceivePurchaseOrderData = {
      items: itemsToReceive.map((item) => ({
        id: item.id,
        quantity_received: item.quantity_to_receive,
      })),
    };

    setLoading(true);
    try {
      await dispatch(receivePurchaseOrder({ id: order.id, data })).unwrap();
      onClose();
    } catch (error) {
      // Error handled by slice
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalToReceive = items.reduce((sum, item) => sum + item.quantity_to_receive, 0);
  const hasItemsToReceive = totalToReceive > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-5xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Recibir Productos - Orden #{order.order_number}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Ingrese las cantidades recibidas para cada producto
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Cerrar</span>
              <MdClose className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleReceiveAll}
              >
                Recibir Todo Pendiente
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleClearAll}
              >
                Limpiar Todo
              </Button>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-md">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Ordenado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Ya Recibido
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Pendiente
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Recibir Ahora
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {items.map((item, index) => (
                    <tr
                      key={item.id}
                      className={item.remaining === 0 ? 'opacity-50' : ''}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {item.product_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {item.product_sku}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                        {item.quantity_ordered}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                        {item.quantity_received}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span
                          className={
                            item.remaining > 0
                              ? 'text-yellow-600 font-medium'
                              : 'text-gray-500'
                          }
                        >
                          {item.remaining}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min="0"
                          max={item.remaining}
                          step="0.001"
                          value={item.quantity_to_receive}
                          onChange={(e) =>
                            handleQuantityChange(index, parseFloat(e.target.value) || 0)
                          }
                          disabled={item.remaining === 0}
                          className="w-32 px-3 py-1.5 text-sm text-right border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-3 text-sm font-medium text-right text-gray-900 dark:text-white"
                    >
                      Total a Recibir:
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        {totalToReceive.toFixed(3)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Warning Messages */}
            {!hasItemsToReceive && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <MdWarning className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      Debe ingresar al menos una cantidad para recibir
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || !hasItemsToReceive}
              >
                {loading ? 'Procesando...' : 'Confirmar Recepción'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
