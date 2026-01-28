import React, { useState, useEffect } from 'react';
import { Modal, Button, Input } from '../../components/ui';
import { Search, Plus, Trash2, Package } from 'lucide-react';
import type { StockItem } from '../../services/api/stock.service';
import type { Product } from '../../types';

interface InventoryEntry {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  current_quantity: number;
  counted_quantity: string;
}

interface InventoryCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockItems: StockItem[];
  products: Product[];
  onSubmit: (entries: Array<{ product_id: string; counted_quantity: number }>, notes?: string) => Promise<void>;
  loading: boolean;
}

const InventoryCountModal: React.FC<InventoryCountModalProps> = ({
  isOpen,
  onClose,
  stockItems = [],
  products = [],
  onSubmit,
  loading
}) => {
  const [entries, setEntries] = useState<InventoryEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);

  // Reset all state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEntries([]);
      setSearchTerm('');
      setNotes('');
      setShowProductSearch(false);
    }
  }, [isOpen]);

  // Ensure arrays are always safe
  const safeProducts = Array.isArray(products) ? products : [];
  const safeStockItems = Array.isArray(stockItems) ? stockItems : [];

  const filteredProducts = safeProducts.filter(p =>
    (p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.sku?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    !entries.some(e => e.product_id === p.id)
  );

  const addProduct = (product: Product) => {
    const stockItem = safeStockItems.find(s => s.product_id === product.id);
    const newEntry: InventoryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      current_quantity: stockItem?.quantity || 0,
      counted_quantity: ''
    };
    setEntries([...entries, newEntry]);
    setSearchTerm('');
    setShowProductSearch(false);
  };

  const updateEntry = (id: string, counted_quantity: string) => {
    setEntries(entries.map(e =>
      e.id === id ? { ...e, counted_quantity } : e
    ));
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const handleSubmit = async () => {
    const validEntries = entries.filter(e => e.counted_quantity !== '');
    if (validEntries.length === 0) {
      alert('Por favor, ingrese al menos una cantidad contada');
      return;
    }

    const submitData = validEntries.map(e => ({
      product_id: e.product_id,
      counted_quantity: parseFloat(e.counted_quantity)
    }));

    await onSubmit(submitData, notes || undefined);

    // Reset form
    setEntries([]);
    setNotes('');
    setSearchTerm('');
  };

  const calculateVariance = (entry: InventoryEntry): number => {
    if (!entry.counted_quantity) return 0;
    return parseFloat(entry.counted_quantity) - entry.current_quantity;
  };

  const getVarianceColor = (variance: number): string => {
    if (variance === 0) return 'text-gray-600 dark:text-gray-400';
    return variance > 0
      ? 'text-success-600 dark:text-success-400'
      : 'text-error-600 dark:text-error-400';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Conteo Físico de Inventario"
      size="lg"
    >
      <div className="space-y-4">
        {/* Info Banner */}
        <div className="p-4 bg-info-50 dark:bg-info-900/20 rounded-sm animate-flip-down duration-fast">
          <p className="text-sm text-info-800 dark:text-info-300">
            Registre las cantidades físicas contadas. El sistema calculará las variaciones
            y creará los ajustes necesarios automáticamente.
          </p>
        </div>

        {/* Product Search */}
        {showProductSearch ? (
          <div className="animate-fade-right duration-normal">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar producto por nombre o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {searchTerm && (
              <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-sm">
                {filteredProducts.length > 0 ? (
                  filteredProducts.slice(0, 10).map(product => (
                    <button
                      key={product.id}
                      onClick={() => addProduct(product)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                    >
                      <Package className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-2 text-sm text-gray-500">No se encontraron productos</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <Button
            onClick={() => setShowProductSearch(true)}
            variant="secondary"
            className="w-full animate-fade-up duration-normal"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Producto
          </Button>
        )}

        {/* Entries List */}
        {entries.length > 0 && (
          <div className="space-y-2 animate-fade-up duration-light-slow">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Productos a contar ({entries.length})
            </h3>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {entries.map((entry) => {
                const variance = calculateVariance(entry);
                return (
                  <div
                    key={entry.id}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-sm border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {entry.product_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          SKU: {entry.product_sku} • Stock actual: {entry.current_quantity}
                        </p>
                      </div>
                      <button
                        onClick={() => removeEntry(entry.id)}
                        className="text-gray-400 hover:text-error-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          placeholder="Cantidad contada"
                          value={entry.counted_quantity}
                          onChange={(e) => updateEntry(entry.id, e.target.value)}
                        />
                      </div>

                      {entry.counted_quantity !== '' && (
                        <div className={`text-sm font-medium ${getVarianceColor(variance)}`}>
                          <span>{variance > 0 ? '+' : ''}{variance.toFixed(3)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="animate-fade-up duration-slow">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notas (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observaciones del conteo..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700 animate-fade-up duration-ultra-slow">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading || entries.length === 0}
            loading={loading}
          >
            Procesar Conteo
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InventoryCountModal;
