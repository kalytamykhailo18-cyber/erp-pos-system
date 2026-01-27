import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchBranchStock,
  fetchStockMovements,
  adjustStock,
  recordShrinkage,
  submitInventoryCount
} from '../../store/slices/stockSlice';
import {
  fetchTransfers,
  createTransfer,
  approveTransfer,
  receiveTransfer,
  cancelTransfer,
  fetchTransferById
} from '../../store/slices/transferSlice';
import { loadProducts } from '../../store/slices/productsSlice';
import { Card, Button } from '../../components/ui';
import { MdInventory } from 'react-icons/md';
import StockInventoryList from './StockInventoryList';
import StockMovementsList from './StockMovementsList';
import AdjustStockModal from './AdjustStockModal';
import ShrinkageModal from './ShrinkageModal';
import InventoryCountModal from './InventoryCountModal';
import TransfersList from './TransfersList';
import CreateTransferModal from './CreateTransferModal';
import TransferDetailsModal from './TransferDetailsModal';
import type { StockItem } from '../../services/api/stock.service';
import type { StockTransfer } from '../../types';

type StockTab = 'inventory' | 'movements' | 'shrinkage' | 'transfers';

const StockPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentBranch, availableBranches, user } = useAppSelector((state) => state.auth);
  const { items: stock, movements } = useAppSelector((state) => state.stock);
  const { transfers } = useAppSelector((state) => state.transfer);
  const { products } = useAppSelector((state) => state.products);
  const loading = useAppSelector((state) => state.ui.loading);

  // CRITICAL: Permission check for stock adjustments
  const canAdjustStock = user?.role?.can_adjust_stock || false;

  // Local state
  const [activeTab, setActiveTab] = useState<StockTab>('inventory');
  const [search, setSearch] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  // Modals
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showShrinkageModal, setShowShrinkageModal] = useState(false);
  const [showInventoryCountModal, setShowInventoryCountModal] = useState(false);
  const [showCreateTransferModal, setShowCreateTransferModal] = useState(false);
  const [showTransferDetailsModal, setShowTransferDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);

  // Form state
  const [adjustmentData, setAdjustmentData] = useState({
    quantity: '',
    reason: '',
    type: 'adjustment' as 'adjustment' | 'shrinkage' | 'count',
  });

  // Load stock when tab changes
  useEffect(() => {
    if (activeTab === 'inventory' && currentBranch?.id) {
      loadStock();
    }
  }, [activeTab, currentBranch?.id, showLowStock]);

  // Load movements when tab changes
  useEffect(() => {
    if (activeTab === 'movements' && currentBranch?.id) {
      loadMovements();
    }
  }, [activeTab, currentBranch?.id]);

  // Load transfers when tab changes
  useEffect(() => {
    if (activeTab === 'transfers') {
      loadTransfers();
    }
  }, [activeTab]);

  // Load products when inventory count modal is opened (for product search)
  useEffect(() => {
    if (showInventoryCountModal && products.length === 0) {
      dispatch(loadProducts({ limit: 500 }));
    }
  }, [showInventoryCountModal, products.length, dispatch]);

  const loadStock = () => {
    if (!currentBranch?.id) return;
    dispatch(fetchBranchStock({
      branchId: currentBranch.id,
      low_stock: showLowStock,
    }));
  };

  const loadMovements = () => {
    if (!currentBranch?.id) return;
    dispatch(fetchStockMovements({
      branch_id: currentBranch.id,
    }));
  };

  const loadTransfers = () => {
    dispatch(fetchTransfers({}));
  };

  // Handle stock adjustment
  const handleAdjustment = async (productIdFromModal?: string) => {
    const productId = selectedItem?.product_id || productIdFromModal;
    if (!productId || !adjustmentData.quantity || !currentBranch?.id) return;

    try {
      await dispatch(adjustStock({
        branch_id: currentBranch.id,
        product_id: productId,
        quantity: parseFloat(adjustmentData.quantity),
        reason: adjustmentData.reason,
      })).unwrap();

      setShowAdjustModal(false);
      setSelectedItem(null);
      setAdjustmentData({ quantity: '', reason: '', type: 'adjustment' });
      loadStock();
    } catch (error) {
      // Error handled in slice
    }
  };

  // Handle shrinkage adjustment (quick adjustment for pet food)
  const handleShrinkageAdjustment = async (productIdFromModal?: string) => {
    const productId = selectedItem?.product_id || productIdFromModal;
    if (!productId || !adjustmentData.quantity || !currentBranch?.id) return;

    try {
      await dispatch(recordShrinkage({
        branch_id: currentBranch.id,
        product_id: productId,
        quantity: parseFloat(adjustmentData.quantity),
        reason: adjustmentData.reason || 'OTHER',
      })).unwrap();

      setShowShrinkageModal(false);
      setSelectedItem(null);
      setAdjustmentData({ quantity: '', reason: '', type: 'adjustment' });
      loadStock();
    } catch (error) {
      // Error handled in slice
    }
  };

  // Handle physical inventory count
  const handleInventoryCount = async (
    entries: Array<{ product_id: string; counted_quantity: number }>,
    notes?: string
  ) => {
    if (!currentBranch?.id) return;

    try {
      await dispatch(submitInventoryCount({
        branch_id: currentBranch.id,
        entries,
        notes
      })).unwrap();

      setShowInventoryCountModal(false);
      loadStock();
    } catch (error) {
      // Error handled in slice
    }
  };

  // Transfer handlers
  const handleCreateTransfer = async (data: {
    from_branch_id: string;
    to_branch_id: string;
    notes: string;
    items: Array<{ product_id: string; quantity: number }>;
  }) => {
    try {
      await dispatch(createTransfer(data)).unwrap();
      setShowCreateTransferModal(false);
      loadTransfers();
    } catch (error) {
      // Error handled in slice
    }
  };

  const handleViewTransferDetails = (transfer: StockTransfer) => {
    setSelectedTransfer(transfer);
    setShowTransferDetailsModal(true);
  };

  const handleApproveTransfer = async (
    transferId: string,
    items: Array<{ id: string; shipped_quantity: number }>
  ) => {
    try {
      await dispatch(approveTransfer({ transferId, items })).unwrap();
      loadTransfers();
      if (selectedTransfer?.id === transferId) {
        await dispatch(fetchTransferById(transferId));
      }
    } catch (error) {
      // Error handled in slice
    }
  };

  const handleReceiveTransfer = async (
    transferId: string,
    items: Array<{ item_id: string; quantity_received: number }>,
    notes?: string
  ) => {
    try {
      await dispatch(receiveTransfer({ transferId, items, notes })).unwrap();
      setShowTransferDetailsModal(false);
      loadTransfers();
      loadStock();
    } catch (error) {
      // Error handled in slice
    }
  };

  const handleCancelTransfer = async (transferId: string, reason: string) => {
    try {
      await dispatch(cancelTransfer({ transferId, reason })).unwrap();
      setShowTransferDetailsModal(false);
      loadTransfers();
      if (selectedTransfer?.status === 'IN_TRANSIT') {
        loadStock();
      }
    } catch (error) {
      // Error handled in slice
    }
  };

  const tabs = [
    { id: 'inventory' as StockTab, name: 'Inventario' },
    { id: 'movements' as StockTab, name: 'Movimientos' },
    { id: 'shrinkage' as StockTab, name: 'Mermas' },
    { id: 'transfers' as StockTab, name: 'Transferencias' },
  ];

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-down duration-fast">
          <div className="animate-fade-right duration-normal">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestión de Stock
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Control de inventario con soporte para mermas
            </p>
          </div>

          <div className="flex gap-3 animate-fade-left duration-normal">
            {canAdjustStock && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedItem(null);
                    setShowShrinkageModal(true);
                  }}
                >
                  Registrar Merma
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowInventoryCountModal(true)}
                >
                  Conteo Físico
                </Button>
              </>
            )}
            <Button
              variant="primary"
              onClick={loadStock}
            >
              Actualizar
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 animate-fade-up duration-fast">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors animate-fade-up duration-normal
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <StockInventoryList
            stock={stock}
            search={search}
            onSearchChange={setSearch}
            showLowStock={showLowStock}
            onShowLowStockChange={setShowLowStock}
            canAdjustStock={canAdjustStock}
            onAdjust={(item) => {
              setSelectedItem(item);
              setShowAdjustModal(true);
            }}
            onShrinkage={(item) => {
              setSelectedItem(item);
              setShowShrinkageModal(true);
            }}
            loading={loading}
          />
        )}

        {/* Movements Tab */}
        {activeTab === 'movements' && (
          <StockMovementsList
            movements={movements}
            loading={loading}
          />
        )}

        {/* Shrinkage Tab */}
        {activeTab === 'shrinkage' && (
          <Card className="p-6 animate-zoom-in duration-normal">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-warning-100 dark:bg-warning-900/20 rounded-full mx-auto mb-4 flex items-center justify-center animate-flip-down duration-light-slow">
                <MdInventory className="w-8 h-8 text-warning-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 animate-fade-up duration-normal">
                Control de Mermas
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto animate-fade-up duration-light-slow">
                Registra las mermas de productos (especialmente alimentos para mascotas) causadas por polvo, porcionado o pérdidas de peso.
              </p>
              {canAdjustStock ? (
                <Button
                  variant="primary"
                  onClick={() => setShowShrinkageModal(true)}
                  className="animate-fade-up duration-slow"
                >
                  Registrar Merma Rápida
                </Button>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 animate-fade-up duration-slow">
                  No tienes permisos para registrar mermas
                </p>
              )}
            </div>
          </Card>
        )}

        {/* Transfers Tab */}
        {activeTab === 'transfers' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium">Transferencias entre Sucursales</h2>
                <p className="text-sm text-gray-500">Gestiona los traslados de mercadería</p>
              </div>
              {canAdjustStock && (
                <Button
                  variant="primary"
                  onClick={() => setShowCreateTransferModal(true)}
                >
                  Nueva Transferencia
                </Button>
              )}
            </div>
            <TransfersList
              transfers={transfers}
              loading={loading}
              onViewDetails={handleViewTransferDetails}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <AdjustStockModal
        isOpen={showAdjustModal}
        onClose={() => {
          setShowAdjustModal(false);
          setSelectedItem(null);
        }}
        selectedItem={selectedItem}
        stockItems={stock}
        adjustmentData={adjustmentData}
        onDataChange={setAdjustmentData}
        onSubmit={handleAdjustment}
        loading={loading}
      />

      <ShrinkageModal
        isOpen={showShrinkageModal}
        onClose={() => {
          setShowShrinkageModal(false);
          setSelectedItem(null);
        }}
        selectedItem={selectedItem}
        stockItems={stock}
        adjustmentData={adjustmentData}
        onDataChange={setAdjustmentData}
        onSubmit={handleShrinkageAdjustment}
        loading={loading}
      />

      <InventoryCountModal
        isOpen={showInventoryCountModal}
        onClose={() => setShowInventoryCountModal(false)}
        stockItems={stock}
        products={products}
        onSubmit={handleInventoryCount}
        loading={loading}
      />

      <CreateTransferModal
        isOpen={showCreateTransferModal}
        onClose={() => setShowCreateTransferModal(false)}
        onSubmit={handleCreateTransfer}
        loading={loading}
        branches={availableBranches}
        products={products}
        currentBranchId={currentBranch?.id}
      />

      <TransferDetailsModal
        isOpen={showTransferDetailsModal}
        onClose={() => setShowTransferDetailsModal(false)}
        transfer={selectedTransfer}
        onApprove={handleApproveTransfer}
        onReceive={handleReceiveTransfer}
        onCancel={handleCancelTransfer}
        loading={loading}
      />
    </>
  );
};

export default StockPage;
