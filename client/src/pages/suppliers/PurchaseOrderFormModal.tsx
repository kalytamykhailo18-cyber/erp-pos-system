import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { createPurchaseOrder, updatePurchaseOrder, loadSuppliers } from '../../store/slices/supplierSlice';
import { Button, Input } from '../../components/ui';
import type { PurchaseOrder, CreatePurchaseOrderData } from '../../services/api/supplier.service';
import type { UUID, Product } from '../../types';
import { MdClose } from 'react-icons/md';

interface PurchaseOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrder | null;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export const PurchaseOrderFormModal: React.FC<PurchaseOrderFormModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const dispatch = useAppDispatch();
  const { suppliers, loading } = useAppSelector((state) => state.supplier);
  const { currentBranch } = useAppSelector((state) => state.auth);

  const [supplierId, setSupplierId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);

  // Product search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (suppliers.length === 0) {
      dispatch(loadSuppliers({ is_active: true }));
    }
  }, [dispatch, suppliers.length]);

  useEffect(() => {
    if (order) {
      setSupplierId(order.supplier_id);
      setExpectedDate(order.expected_date || '');
      setNotes(order.notes || '');
      // Convert order items to form items
      if (order.items) {
        setItems(
          order.items.map((item) => ({
            product_id: item.product_id,
            product_name: item.product?.name || '',
            product_sku: item.product?.sku || '',
            quantity: item.quantity_ordered,
            unit_price: item.unit_price,
            total_price: item.total_price,
          }))
        );
      }
    } else {
      // Reset form
      setSupplierId('');
      setExpectedDate('');
      setNotes('');
      setItems([]);
    }
  }, [order]);

  // Search for products
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const searchProducts = async () => {
      setIsSearching(true);
      try {
        const { productService } = await import('../../services/api/product.service');
        const response = await productService.getAll({ search: searchTerm, limit: 10 });
        if (response.success) {
          setSearchResults(response.data);
        }
      } catch (error) {
        console.error('Error searching products:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchProducts, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleAddProduct = (product: Product) => {
    // Check if product already exists
    if (items.some((item) => item.product_id === product.id)) {
      return;
    }

    const newItem: OrderItem = {
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      quantity: 1,
      unit_price: Number(product.cost_price),
      total_price: Number(product.cost_price),
    };

    setItems([...items, newItem]);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index].quantity = quantity;
    newItems[index].total_price = quantity * newItems[index].unit_price;
    setItems(newItems);
  };

  const handlePriceChange = (index: number, price: number) => {
    const newItems = [...items];
    newItems[index].unit_price = price;
    newItems[index].total_price = price * newItems[index].quantity;
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const tax = subtotal * 0.21; // 21% IVA
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId || !currentBranch || items.length === 0) {
      return;
    }

    const data: CreatePurchaseOrderData = {
      supplier_id: supplierId as UUID,
      branch_id: currentBranch.id,
      expected_date: expectedDate || undefined,
      notes: notes || undefined,
      items: items.map((item) => ({
        product_id: item.product_id as UUID,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    };

    try {
      if (order) {
        await dispatch(
          updatePurchaseOrder({
            id: order.id,
            data: {
              expected_date: expectedDate || undefined,
              notes: notes || undefined,
              items: data.items,
            },
          })
        ).unwrap();
      } else {
        await dispatch(createPurchaseOrder(data)).unwrap();
      }
      onClose();
    } catch (error) {
      // Error handled by slice
    }
  };

  if (!isOpen) return null;

  const { subtotal, tax, total } = calculateTotals();

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
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {order ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Cerrar</span>
              <MdClose className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Proveedor *
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  disabled={!!order}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
                >
                  <option value="">Seleccionar proveedor</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Fecha Esperada"
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
              />
            </div>

            {/* Product Search */}
            {!order && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Buscar Productos
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por nombre o SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary-600"></div>
                    </div>
                  )}
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                      {searchResults.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleAddProduct(product)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            SKU: {product.sku} • Costo: ${Number(product.cost_price).toFixed(2)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Items Table */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Productos ({items.length})
              </h4>
              {items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay productos agregados. Busca y agrega productos arriba.
                </div>
              ) : (
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
                          Cantidad
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Precio Unit.
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {item.product_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{item.product_sku}</td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              min="0.001"
                              step="0.001"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(index, parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 text-sm text-right border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                              className="w-32 px-2 py-1 text-sm text-right border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                            ${item.total_price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              disabled={!!order}
                              className="text-red-600 hover:text-red-700 disabled:opacity-50"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">IVA (21%):</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${tax.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-300 dark:border-gray-600 mt-2 pt-2">
                    <span className="text-gray-900 dark:text-white">Total:</span>
                    <span className="text-primary-600 dark:text-primary-400">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notas
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Notas adicionales sobre la orden..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={loading || items.length === 0}>
                {loading ? 'Guardando...' : order ? 'Actualizar' : 'Crear Orden'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
