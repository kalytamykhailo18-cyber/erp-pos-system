import React, { useState, useMemo } from 'react';
import { Modal, Button, Input } from '../../components/ui';
import type { StockItem } from '../../services/api/stock.service';
import { MdSearch } from 'react-icons/md';

interface AdjustmentData {
  quantity: string;
  reason: string;
  type: 'adjustment' | 'shrinkage' | 'count';
}

interface AdjustStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: StockItem | null;
  stockItems: StockItem[];
  adjustmentData: AdjustmentData;
  onDataChange: (data: AdjustmentData) => void;
  onSubmit: (productId?: string) => void;
  loading: boolean;
}

const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  isOpen,
  onClose,
  selectedItem,
  stockItems,
  adjustmentData,
  onDataChange,
  onSubmit,
  loading
}) => {
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-AR').format(num);
  };

  // Filter stock items based on search
  const filteredItems = useMemo(() => {
    if (!productSearch) return stockItems.slice(0, 10);
    const search = productSearch.toLowerCase();
    return stockItems.filter(item =>
      item.product_name.toLowerCase().includes(search) ||
      item.product_sku?.toLowerCase().includes(search)
    ).slice(0, 10);
  }, [stockItems, productSearch]);

  // Get the selected stock item (either pre-selected or from search)
  const activeItem = selectedItem || stockItems.find(item => item.product_id === selectedProductId);

  const handleClose = () => {
    setProductSearch('');
    setSelectedProductId(null);
    onClose();
  };

  const handleSubmit = () => {
    onSubmit(selectedProductId || undefined);
  };

  const canSubmit = activeItem && adjustmentData.quantity && adjustmentData.reason;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Ajustar Stock"
      size="sm"
    >
      <div className="space-y-4">
        {selectedItem ? (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-sm animate-fade-down duration-fast">
            <p className="font-medium text-gray-900 dark:text-white">
              {selectedItem.product_name}
            </p>
            <p className="text-sm text-gray-500">
              Stock actual: {formatNumber(selectedItem.quantity)}
            </p>
          </div>
        ) : (
          <div className="animate-fade-down duration-fast space-y-2">
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

        <div className="animate-fade-up duration-fast">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo de Ajuste
          </label>
          <select
            value={adjustmentData.type}
            onChange={(e) => onDataChange({ ...adjustmentData, type: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700"
          >
            <option value="adjustment">Ajuste manual</option>
            <option value="count">Conteo físico</option>
            <option value="shrinkage">Merma</option>
          </select>
        </div>

        <div className="animate-fade-up duration-normal">
          <Input
            label={adjustmentData.type === 'count' ? 'Cantidad contada' : 'Cantidad a ajustar'}
            type="number"
            value={adjustmentData.quantity}
            onChange={(e) => onDataChange({ ...adjustmentData, quantity: e.target.value })}
            placeholder={adjustmentData.type === 'count' ? 'Stock real' : '+10 o -5'}
          />
          {adjustmentData.type !== 'count' && (
            <p className="text-xs text-gray-500 mt-1">
              Usa valores positivos para agregar o negativos para restar
            </p>
          )}
        </div>

        <div className="animate-fade-up duration-light-slow">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Razón <span className="text-danger-500">*</span>
          </label>
          <textarea
            value={adjustmentData.reason}
            onChange={(e) => onDataChange({ ...adjustmentData, reason: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700"
            placeholder="Motivo del ajuste..."
          />
        </div>

        <div className="flex gap-3 animate-fade-up duration-slow">
          <Button variant="secondary" fullWidth onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleSubmit}
            loading={loading}
            disabled={!canSubmit}
          >
            Ajustar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AdjustStockModal;
