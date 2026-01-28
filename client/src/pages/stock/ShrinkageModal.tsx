import React, { useState, useMemo, useEffect } from 'react';
import { Modal, Button, Input } from '../../components/ui';
import type { StockItem } from '../../services/api/stock.service';
import { MdSearch } from 'react-icons/md';

interface AdjustmentData {
  quantity: string;
  reason: string;
  type: 'adjustment' | 'shrinkage' | 'count';
}

interface ShrinkageModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: StockItem | null;
  stockItems: StockItem[];
  adjustmentData: AdjustmentData;
  onDataChange: (data: AdjustmentData) => void;
  onSubmit: (productId?: string) => void;
  loading: boolean;
}

const ShrinkageModal: React.FC<ShrinkageModalProps> = ({
  isOpen,
  onClose,
  selectedItem,
  stockItems = [],
  adjustmentData,
  onDataChange,
  onSubmit,
  loading
}) => {
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Reset internal state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setProductSearch('');
      setSelectedProductId(null);
    }
  }, [isOpen]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-AR').format(num);
  };

  // Ensure stockItems is always an array
  const safeStockItems = Array.isArray(stockItems) ? stockItems : [];

  // Filter stock items based on search
  const filteredItems = useMemo(() => {
    if (safeStockItems.length === 0) return [];
    if (!productSearch) return safeStockItems.slice(0, 10);
    const search = productSearch.toLowerCase();
    return safeStockItems.filter(item =>
      item.product_name?.toLowerCase().includes(search) ||
      item.product_sku?.toLowerCase().includes(search)
    ).slice(0, 10);
  }, [safeStockItems, productSearch]);

  // Get the selected stock item (either pre-selected or from search)
  const activeItem = selectedItem || safeStockItems.find(item => item.product_id === selectedProductId) || null;

  const handleClose = () => {
    setProductSearch('');
    setSelectedProductId(null);
    onClose();
  };

  const handleSubmit = () => {
    onSubmit(selectedProductId || undefined);
  };

  const canSubmit = activeItem && adjustmentData.quantity && parseFloat(adjustmentData.quantity) > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Registrar Merma"
      size="sm"
    >
      <div className="space-y-4">
        <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-sm animate-flip-down duration-fast">
          <p className="text-sm text-warning-800 dark:text-warning-300">
            Registra la merma de productos por pérdida de peso, polvo o porcionado.
            Este ajuste es rápido y no requiere aprobación.
          </p>
        </div>

        {selectedItem ? (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-sm animate-fade-right duration-normal">
            <p className="font-medium text-gray-900 dark:text-white">
              {selectedItem.product_name}
            </p>
            <p className="text-sm text-gray-500">
              Stock actual: {formatNumber(selectedItem.quantity)}
              {selectedItem.expected_shrinkage ? ` | Merma esperada: ${selectedItem.expected_shrinkage}%` : ''}
            </p>
          </div>
        ) : (
          <div className="animate-fade-right duration-normal space-y-2">
            <Input
              label="Buscar producto"
              placeholder="Nombre o SKU..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              leftIcon={<MdSearch className="w-5 h-5" />}
            />
            {productSearch && filteredItems.length > 0 && !selectedProductId && (
              <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-sm">
                {filteredItems.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedProductId(item.product_id);
                      setProductSearch(item.product_name);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.product_name}</p>
                    <p className="text-xs text-gray-500">SKU: {item.product_sku} | Stock: {formatNumber(item.quantity)}</p>
                  </button>
                ))}
              </div>
            )}
            {selectedProductId && activeItem && (
              <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-sm flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-primary-900 dark:text-primary-100">{activeItem.product_name}</p>
                  <p className="text-xs text-primary-700 dark:text-primary-300">Stock: {formatNumber(activeItem.quantity)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProductId(null);
                    setProductSearch('');
                  }}
                  className="text-primary-600 hover:text-primary-800 text-sm"
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>
        )}

        <div className="animate-fade-up duration-normal">
          <Input
            label="Cantidad perdida"
            type="number"
            value={adjustmentData.quantity}
            onChange={(e) => onDataChange({ ...adjustmentData, quantity: e.target.value })}
            placeholder="Ej: 0.5"
            min="0.001"
            step="0.001"
          />
        </div>

        <div className="animate-fade-up duration-light-slow">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Razón (opcional)
          </label>
          <select
            value={adjustmentData.reason}
            onChange={(e) => onDataChange({ ...adjustmentData, reason: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700"
          >
            <option value="">Seleccionar razón</option>
            <option value="POWDER_LOSS">Merma por polvo</option>
            <option value="PORTIONING">Merma por porcionado</option>
            <option value="SCALE_ERROR">Diferencia de peso / Error de balanza</option>
            <option value="SPILLAGE">Derrame</option>
            <option value="OTHER">Otro</option>
          </select>
        </div>

        <div className="flex gap-3 animate-fade-up duration-slow">
          <Button variant="secondary" fullWidth onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="warning"
            fullWidth
            onClick={handleSubmit}
            loading={loading}
            disabled={!canSubmit}
          >
            Registrar Merma
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ShrinkageModal;
