import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { loadInventoryReport } from '../../store/slices/reportsSlice';
import { MdCheck } from 'react-icons/md';

interface StockSummary {
  total_items: number;
  total_cost_value: number;
  total_retail_value: number;
  low_stock_count: number;
}

interface LowStockItem {
  product: string;
  sku: string;
  branch: string;
  quantity: number;
  min_stock: number;
}

const StockLevelOverview: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { inventoryReport, error: reportError } = useAppSelector((state) => state.reports);
  const loading = useAppSelector((state) => state.ui.loading);

  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [criticalItems, setCriticalItems] = useState<LowStockItem[]>([]);

  useEffect(() => {
    dispatch(loadInventoryReport({ low_stock_only: true }));
    // Refresh every 5 minutes
    const interval = setInterval(() => {
      dispatch(loadInventoryReport({ low_stock_only: true }));
    }, 300000);
    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    if (inventoryReport) {
      setSummary(inventoryReport.summary);
      // Get top 5 most critical items (lowest quantity relative to minimum)
      const sortedItems = inventoryReport.inventory
        .map((item: { product: string; sku: string; branch: string; quantity: number; min_stock: number }) => ({
          product: item.product,
          sku: item.sku,
          branch: item.branch,
          quantity: item.quantity,
          min_stock: item.min_stock
        }))
        .sort((a: LowStockItem, b: LowStockItem) => (a.quantity / a.min_stock) - (b.quantity / b.min_stock))
        .slice(0, 5);
      setCriticalItems(sortedItems);
    }
  }, [inventoryReport]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };

  const getSeverityColor = (quantity: number, minStock: number) => {
    const ratio = quantity / minStock;
    if (ratio === 0) return 'text-red-700 dark:text-red-400 font-bold';
    if (ratio < 0.5) return 'text-red-600 dark:text-red-400';
    if (ratio < 1) return 'text-amber-600 dark:text-amber-400';
    return 'text-gray-900 dark:text-white';
  };

  if (reportError) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-right duration-normal">
        <div className="text-center text-red-600 dark:text-red-400">{reportError}</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-right duration-normal relative">
      {loading && (
        <div className="absolute top-4 right-4 z-10">
          <div className="animate-spin rounded-full h-5 w-5 border-4 border-gray-300 border-t-primary-600"></div>
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Stock - Vista Rápida
        </h3>
        <button
          onClick={() => navigate('/reports/inventory')}
          className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          Ver Detalle →
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Items Bajo Mínimo</p>
          <p className={`text-2xl font-bold ${
            summary && summary.low_stock_count > 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-green-600 dark:text-green-400'
          }`}>
            {summary?.low_stock_count || 0}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Valor en Stock</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {summary ? formatCurrency(summary.total_retail_value) : '$0'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Costo: {summary ? formatCurrency(summary.total_cost_value) : '$0'}
          </p>
        </div>
      </div>

      {criticalItems.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Items Críticos
          </h4>
          <div className="space-y-2">
            {criticalItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-xs"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {item.product}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {item.branch} • SKU: {item.sku}
                  </p>
                </div>
                <div className="text-right ml-2">
                  <p className={`font-bold ${getSeverityColor(item.quantity, item.min_stock)}`}>
                    {item.quantity}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    Min: {item.min_stock}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {criticalItems.length === 0 && summary && summary.low_stock_count === 0 && (
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full mb-2">
            <MdCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Todo el stock está dentro de los niveles normales
          </p>
        </div>
      )}
    </div>
  );
};

export default StockLevelOverview;
