import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { bulkUpdateByMargin, bulkUpdateBySupplier, loadSuppliers } from '../../store/slices/priceSlice';
import { loadCategories } from '../../store/slices/productsSlice';
import { Card, Button, Input } from '../../components/ui';
import type { UUID } from '../../types';

const BulkPriceUpdate: React.FC = () => {
  const dispatch = useAppDispatch();
  const { suppliers, loading } = useAppSelector((state) => state.price);
  const { categories } = useAppSelector((state) => state.products);

  // State
  const [updateMode, setUpdateMode] = useState<'margin' | 'supplier'>('margin');
  const [selectedCategory, setSelectedCategory] = useState<UUID | ''>('');
  const [selectedSupplier, setSelectedSupplier] = useState<UUID | ''>('');
  const [marginPercent, setMarginPercent] = useState('30');
  const [roundingRule, setRoundingRule] = useState<'NONE' | 'UP' | 'DOWN' | 'NEAREST'>('NEAREST');
  const [roundingValue, setRoundingValue] = useState('10');
  const [updateCostPrices, setUpdateCostPrices] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<Array<{
    id: UUID;
    name: string;
    sku: string;
    old_price: number;
    new_price: number;
  }> | null>(null);

  // Load suppliers and categories on mount
  useEffect(() => {
    dispatch(loadSuppliers({ is_active: true }));
    dispatch(loadCategories());
  }, [dispatch]);

  // Handle margin-based update
  const handleMarginUpdate = async () => {
    try {
      const result = await dispatch(bulkUpdateByMargin({
        category_id: selectedCategory || undefined,
        margin_percentage: parseFloat(marginPercent),
        rounding_rule: roundingRule !== 'NONE' ? roundingRule : undefined,
        rounding_value: roundingRule !== 'NONE' ? parseInt(roundingValue) : undefined,
      })).unwrap();

      setPreviewData(result.products);
      setShowPreview(true);
    } catch (error) {
      // Error handled in thunk
    }
  };

  // Handle supplier-based update
  const handleSupplierUpdate = async () => {
    if (!selectedSupplier) {
      return;
    }

    try {
      const result = await dispatch(bulkUpdateBySupplier({
        supplier_id: selectedSupplier,
        margin_percentage: parseFloat(marginPercent),
        rounding_rule: roundingRule !== 'NONE' ? roundingRule : undefined,
        rounding_value: roundingRule !== 'NONE' ? parseInt(roundingValue) : undefined,
        update_cost_prices: updateCostPrices,
      })).unwrap();

      setPreviewData(result.products);
      setShowPreview(true);
    } catch (error) {
      // Error handled in thunk
    }
  };

  const handleApply = () => {
    if (updateMode === 'margin') {
      handleMarginUpdate();
    } else {
      handleSupplierUpdate();
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="animate-fade-down duration-fast">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Actualización Masiva de Precios
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Actualiza precios de múltiples productos aplicando margen de ganancia
        </p>
      </div>

      {/* Mode Selection */}
      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setUpdateMode('margin')}
            className={`flex-1 py-3 px-4 rounded-sm font-medium transition-colors ${
              updateMode === 'margin'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Actualizar por Margen %
          </button>
          <button
            onClick={() => setUpdateMode('supplier')}
            className={`flex-1 py-3 px-4 rounded-sm font-medium transition-colors ${
              updateMode === 'supplier'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Actualizar por Proveedor
          </button>
        </div>

        {/* Margin Update Form */}
        {updateMode === 'margin' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoría (opcional)
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as UUID)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700"
              >
                <option value="">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Margen de ganancia %
              </label>
              <Input
                type="number"
                value={marginPercent}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMarginPercent(e.target.value)}
                min="0"
                max="500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Regla de redondeo
              </label>
              <select
                value={roundingRule}
                onChange={(e) => setRoundingRule(e.target.value as 'NONE' | 'UP' | 'DOWN' | 'NEAREST')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700"
              >
                <option value="NONE">Sin redondeo</option>
                <option value="NEAREST">Redondear al más cercano</option>
                <option value="UP">Redondear hacia arriba</option>
                <option value="DOWN">Redondear hacia abajo</option>
              </select>
            </div>

            {roundingRule !== 'NONE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor de redondeo
                </label>
                <select
                  value={roundingValue}
                  onChange={(e) => setRoundingValue(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700"
                >
                  <option value="1">$1</option>
                  <option value="5">$5</option>
                  <option value="10">$10</option>
                  <option value="50">$50</option>
                  <option value="100">$100</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Supplier Update Form */}
        {updateMode === 'supplier' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Proveedor *
              </label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value as UUID)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700"
              >
                <option value="">Seleccionar proveedor</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="updateCostPrices"
                checked={updateCostPrices}
                onChange={(e) => setUpdateCostPrices(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="updateCostPrices" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Actualizar precios de costo desde el proveedor
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Margen de ganancia %
              </label>
              <Input
                type="number"
                value={marginPercent}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMarginPercent(e.target.value)}
                min="0"
                max="500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Regla de redondeo
              </label>
              <select
                value={roundingRule}
                onChange={(e) => setRoundingRule(e.target.value as 'NONE' | 'UP' | 'DOWN' | 'NEAREST')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700"
              >
                <option value="NONE">Sin redondeo</option>
                <option value="NEAREST">Redondear al más cercano</option>
                <option value="UP">Redondear hacia arriba</option>
                <option value="DOWN">Redondear hacia abajo</option>
              </select>
            </div>

            {roundingRule !== 'NONE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor de redondeo
                </label>
                <select
                  value={roundingValue}
                  onChange={(e) => setRoundingValue(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700"
                >
                  <option value="1">$1</option>
                  <option value="5">$5</option>
                  <option value="10">$10</option>
                  <option value="50">$50</option>
                  <option value="100">$100</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Apply Button */}
        <div className="mt-6">
          <Button
            variant="primary"
            fullWidth
            onClick={handleApply}
            disabled={updateMode === 'supplier' && !selectedSupplier}
            loading={loading}
          >
            Aplicar Actualización
          </Button>
        </div>
      </Card>

      {/* Preview Results */}
      {showPreview && previewData && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Resultados de la Actualización
          </h2>

          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-sm">
            <p className="text-green-800 dark:text-green-200 font-medium">
              {previewData.length} productos actualizados correctamente
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Precio Anterior
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Precio Nuevo
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cambio
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {previewData.slice(0, 50).map((product) => {
                  const change = product.new_price - product.old_price;
                  const changePercent = product.old_price > 0
                    ? ((change / product.old_price) * 100).toFixed(1)
                    : '0';

                  return (
                    <tr key={product.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {product.sku}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">
                        ${product.old_price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                        ${product.new_price.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${
                        change > 0 ? 'text-green-600 dark:text-green-400' :
                        change < 0 ? 'text-red-600 dark:text-red-400' :
                        'text-gray-500'
                      }`}>
                        {change > 0 ? '+' : ''}{changePercent}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {previewData.length > 50 && (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Mostrando los primeros 50 de {previewData.length} productos actualizados
            </p>
          )}

          <div className="mt-6">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setShowPreview(false);
                setPreviewData(null);
              }}
            >
              Cerrar
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default BulkPriceUpdate;
