import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Input } from '../../components/ui';
import { MdSearch } from 'react-icons/md';
import type { UUID, Branch, Product } from '../../types';

interface TransferItem {
  product_id: UUID;
  product_name?: string;
  product_sku?: string;
  quantity: number;
}

interface CreateTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    from_branch_id: UUID;
    to_branch_id: UUID;
    notes: string;
    items: Array<{ product_id: UUID; quantity: number }>;
  }) => void;
  loading: boolean;
  branches: Branch[];
  products: Product[];
  currentBranchId?: UUID;
}

const CreateTransferModal: React.FC<CreateTransferModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  branches = [],
  products = [],
  currentBranchId
}) => {
  const [fromBranchId, setFromBranchId] = useState<UUID>('');
  const [toBranchId, setToBranchId] = useState<UUID>('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<TransferItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<UUID>('');
  const [quantity, setQuantity] = useState('');

  // Ensure arrays are safe
  const safeBranches = Array.isArray(branches) ? branches : [];
  const safeProducts = Array.isArray(products) ? products : [];

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (safeProducts.length === 0) return [];
    if (!productSearch) return safeProducts.slice(0, 20);
    const search = productSearch.toLowerCase();
    return safeProducts.filter(p =>
      p.name?.toLowerCase().includes(search) ||
      p.sku?.toLowerCase().includes(search)
    ).slice(0, 20);
  }, [safeProducts, productSearch]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (currentBranchId) {
        setFromBranchId(currentBranchId);
      }
    } else {
      // Reset all state when modal closes
      setFromBranchId(currentBranchId || '');
      setToBranchId('');
      setNotes('');
      setItems([]);
      setProductSearch('');
      setSelectedProductId('');
      setQuantity('');
    }
  }, [isOpen, currentBranchId]);

  const handleAddItem = () => {
    if (!selectedProductId || !quantity || parseFloat(quantity) <= 0) {
      return;
    }

    const product = safeProducts.find(p => p.id === selectedProductId);
    if (!product) return;

    // Check if product already in list
    const existingIndex = items.findIndex(item => item.product_id === selectedProductId);
    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].quantity = parseFloat(quantity);
      setItems(newItems);
    } else {
      setItems([
        ...items,
        {
          product_id: selectedProductId,
          product_name: product.name,
          product_sku: product.sku,
          quantity: parseFloat(quantity)
        }
      ]);
    }

    setSelectedProductId('');
    setProductSearch('');
    setQuantity('');
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProductId(product.id);
    setProductSearch(product.name);
  };

  const handleClearProduct = () => {
    setSelectedProductId('');
    setProductSearch('');
  };

  const handleRemoveItem = (productId: UUID) => {
    setItems(items.filter(item => item.product_id !== productId));
  };

  const handleSubmit = () => {
    if (!fromBranchId || !toBranchId || items.length === 0) {
      return;
    }

    if (fromBranchId === toBranchId) {
      alert('La sucursal de origen y destino no pueden ser la misma');
      return;
    }

    onSubmit({
      from_branch_id: fromBranchId,
      to_branch_id: toBranchId,
      notes,
      items: items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }))
    });
  };

  const handleClose = () => {
    onClose();
  };

  const availableBranches = safeBranches.filter(b => b.id !== fromBranchId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Crear Traslado de Mercadería"
      size="lg"
    >
      <div className="space-y-6">
        {/* Branch Selection */}
        <div className="grid grid-cols-2 gap-4 animate-fade-down duration-fast">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Desde Sucursal *
            </label>
            <select
              value={fromBranchId}
              onChange={(e) => setFromBranchId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700"
              disabled={!!currentBranchId}
            >
              <option value="">Seleccionar sucursal</option>
              {safeBranches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hacia Sucursal *
            </label>
            <select
              value={toBranchId}
              onChange={(e) => setToBranchId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700"
              disabled={!fromBranchId}
            >
              <option value="">Seleccionar sucursal</option>
              {availableBranches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add Products Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-lg font-medium mb-4 animate-fade-right duration-normal">
            Productos a Trasladar
          </h3>

          {/* Product Search & Selection */}
          <div className="space-y-3 mb-4 animate-fade-up duration-normal">
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-7">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Producto *
                </label>
                {selectedProductId ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-sm">
                    <span className="flex-1 text-sm text-primary-900 dark:text-primary-100">{productSearch}</span>
                    <button
                      type="button"
                      onClick={handleClearProduct}
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      placeholder="Buscar producto por nombre o SKU..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      leftIcon={<MdSearch className="w-5 h-5" />}
                    />
                    {productSearch && filteredProducts.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm shadow-lg max-h-48 overflow-y-auto">
                        {filteredProducts.map(product => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleSelectProduct(product)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                          >
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
                            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    {productSearch && filteredProducts.length === 0 && safeProducts.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm shadow-lg p-4 text-center text-sm text-gray-500">
                        No se encontraron productos
                      </div>
                    )}
                    {safeProducts.length === 0 && (
                      <p className="mt-1 text-xs text-warning-600">Cargando productos...</p>
                    )}
                  </div>
                )}
              </div>

              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cantidad *
                </label>
                <Input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.00"
                  disabled={!selectedProductId}
                />
              </div>

              <div className="col-span-2 flex items-end">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleAddItem}
                  disabled={!selectedProductId || !quantity || parseFloat(quantity) <= 0}
                >
                  Agregar
                </Button>
              </div>
            </div>
          </div>

          {/* Items List */}
          {items.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-sm animate-zoom-in duration-normal">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Producto
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Cantidad
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {items.map((item) => (
                    <tr key={item.product_id} className="animate-fade-up duration-fast">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.product_name}</p>
                        {item.product_sku && (
                          <p className="text-xs text-gray-500">SKU: {item.product_sku}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('es-AR').format(item.quantity)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRemoveItem(item.product_id)}
                          className="text-danger-500 hover:text-danger-700 text-sm font-medium"
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {items.length === 0 && (
            <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 dark:border-gray-600 rounded-sm">
              <p className="text-sm">No hay productos agregados</p>
              <p className="text-xs mt-1">Selecciona productos y cantidades arriba</p>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="animate-fade-up duration-slow">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notas (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Información adicional sobre el traslado..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 animate-fade-up duration-slow">
          <Button variant="secondary" fullWidth onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleSubmit}
            disabled={loading || !fromBranchId || !toBranchId || items.length === 0}
          >
            {loading ? 'Creando...' : 'Crear Traslado'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateTransferModal;
