import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import {
  loadOpenBagsByBranch,
  loadLowStockBags,
  openBag,
  closeBag,
} from '../../store/slices/openBagSlice';
import { MdAdd, MdClose, MdWarning, MdCheckCircle } from 'react-icons/md';
import { ProductSelector } from '../../components/ui/ProductSelector';
import type { UUID, Decimal } from '../../types';

const OpenBagManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { openBags, lowStockBags } = useSelector((state: RootState) => state.openBag);

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingBagId, setClosingBagId] = useState<UUID | null>(null);

  // Open bag form
  const [openBagForm, setOpenBagForm] = useState({
    product_id: '',
    original_weight: '',
    low_stock_threshold: '',
    notes: '',
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState<{
    product_id?: string;
    original_weight?: string;
    low_stock_threshold?: string;
  }>({});

  // Close bag form
  const [closeNotes, setCloseNotes] = useState('');

  const branchId = user?.primary_branch_id;

  useEffect(() => {
    if (branchId) {
      dispatch(loadOpenBagsByBranch(branchId));
      dispatch(loadLowStockBags({ branch_id: branchId }));
    }
  }, [dispatch, branchId]);

  const validateOpenBagForm = (): boolean => {
    const errors: typeof formErrors = {};

    // Validate product selection
    if (!openBagForm.product_id) {
      errors.product_id = 'Debe seleccionar un producto';
    }

    // Validate original weight
    const originalWeight = parseFloat(openBagForm.original_weight);
    if (!openBagForm.original_weight) {
      errors.original_weight = 'El peso original es requerido';
    } else if (isNaN(originalWeight) || originalWeight <= 0) {
      errors.original_weight = 'El peso debe ser mayor a 0';
    } else if (originalWeight > 1000) {
      errors.original_weight = 'El peso no puede exceder 1000 kg';
    }

    // Validate low stock threshold
    if (openBagForm.low_stock_threshold) {
      const threshold = parseFloat(openBagForm.low_stock_threshold);
      if (isNaN(threshold) || threshold < 0) {
        errors.low_stock_threshold = 'El umbral debe ser un número positivo';
      } else if (threshold >= originalWeight) {
        errors.low_stock_threshold = 'El umbral debe ser menor al peso original';
      }
    }

    // Check if product already has an open bag
    const existingOpenBag = openBags.find(
      (bag) => bag.product_id === openBagForm.product_id && bag.status === 'OPEN'
    );
    if (existingOpenBag) {
      errors.product_id = 'Este producto ya tiene una bolsa abierta';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenBag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) return;

    // Validate form before submission
    if (!validateOpenBagForm()) {
      return;
    }

    await dispatch(
      openBag({
        branch_id: branchId,
        product_id: openBagForm.product_id,
        original_weight: openBagForm.original_weight as Decimal,
        low_stock_threshold: openBagForm.low_stock_threshold
          ? (openBagForm.low_stock_threshold as Decimal)
          : undefined,
        notes: openBagForm.notes || undefined,
      })
    );

    setShowOpenModal(false);
    setOpenBagForm({
      product_id: '',
      original_weight: '',
      low_stock_threshold: '',
      notes: '',
    });
    setFormErrors({});

    // Reload bags
    if (branchId) {
      dispatch(loadOpenBagsByBranch(branchId));
      dispatch(loadLowStockBags({ branch_id: branchId }));
    }
  };

  const handleCloseBag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingBagId) return;

    await dispatch(
      closeBag({
        id: closingBagId,
        notes: closeNotes || undefined,
      })
    );

    setShowCloseModal(false);
    setClosingBagId(null);
    setCloseNotes('');

    // Reload bags
    if (branchId) {
      dispatch(loadOpenBagsByBranch(branchId));
      dispatch(loadLowStockBags({ branch_id: branchId }));
    }
  };

  const openCloseBagModal = (bagId: UUID) => {
    setClosingBagId(bagId);
    setShowCloseModal(true);
  };

  const formatWeight = (weight: Decimal) => {
    return parseFloat(weight as string).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestión de Bolsas Abiertas
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Administra las bolsas selladas abiertas para venta a granel
            </p>
          </div>
          <button
            onClick={() => {
              setShowOpenModal(true);
              setFormErrors({});
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-sm hover:bg-primary-700 transition-colors"
          >
            <MdAdd size={20} />
            Abrir Bolsa Sellada
          </button>
        </div>

        {/* Low Stock Alerts */}
        {lowStockBags.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-sm">
            <div className="flex items-center gap-2 mb-2">
              <MdWarning className="text-yellow-600 dark:text-yellow-400" size={20} />
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                Bolsas con Stock Bajo
              </h3>
            </div>
            <div className="space-y-2">
              {lowStockBags.map((bag) => (
                <div
                  key={bag.id}
                  className="flex justify-between items-center text-sm text-yellow-800 dark:text-yellow-200"
                >
                  <span>
                    {bag.product?.name} - {formatWeight(bag.remaining_weight)} kg restantes
                  </span>
                  <span className="text-xs">
                    Umbral: {formatWeight(bag.low_stock_threshold || '0')} kg
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Open Bags Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Producto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Peso Original
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Peso Restante
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  % Usado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Abierto
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {openBags
                .filter((bag) => bag.status === 'OPEN')
                .map((bag) => {
                  const originalWeight = parseFloat(bag.original_weight as string);
                  const remainingWeight = parseFloat(bag.remaining_weight as string);
                  const usedPercent = ((originalWeight - remainingWeight) / originalWeight) * 100;
                  const isLowStock =
                    bag.low_stock_threshold &&
                    remainingWeight <= parseFloat(bag.low_stock_threshold as string);

                  return (
                    <tr key={bag.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {bag.product?.name || 'Producto sin nombre'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {formatWeight(bag.original_weight)} kg
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className={isLowStock ? 'text-yellow-600 dark:text-yellow-400 font-medium' : ''}>
                          {formatWeight(bag.remaining_weight)} kg
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {usedPercent.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {isLowStock ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 flex items-center gap-1 w-fit">
                            <MdWarning size={14} />
                            Stock Bajo
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center gap-1 w-fit">
                            <MdCheckCircle size={14} />
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(bag.opened_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openCloseBagModal(bag.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 text-sm flex items-center gap-1 ml-auto"
                          title="Cerrar bolsa"
                        >
                          <MdClose size={18} />
                          Cerrar
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {openBags.filter((bag) => bag.status === 'OPEN').length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No hay bolsas abiertas actualmente
            </div>
          )}
        </div>

        {/* Recently Closed Bags */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Bolsas Cerradas Recientemente
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    Peso Original
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    Abierto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    Cerrado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {openBags
                  .filter((bag) => bag.status === 'EMPTY')
                  .slice(0, 5)
                  .map((bag) => (
                    <tr key={bag.id} className="opacity-60">
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {bag.product?.name || 'Producto sin nombre'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {formatWeight(bag.original_weight)} kg
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(bag.opened_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {bag.closed_at ? new Date(bag.closed_at).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Open Bag Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-sm shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Abrir Bolsa Sellada
            </h3>
            <form onSubmit={handleOpenBag} className="space-y-4">
              <ProductSelector
                value={openBagForm.product_id}
                onChange={(productId) => {
                  setOpenBagForm({ ...openBagForm, product_id: productId });
                  setFormErrors({ ...formErrors, product_id: undefined });
                }}
                branchId={branchId}
                weighableOnly={true}
                label="Producto Pesable"
                placeholder="Buscar producto pesable..."
                required
                error={formErrors.product_id}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Peso Original (kg) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  required
                  value={openBagForm.original_weight}
                  onChange={(e) => {
                    setOpenBagForm({ ...openBagForm, original_weight: e.target.value });
                    setFormErrors({ ...formErrors, original_weight: undefined });
                  }}
                  placeholder="Ej: 20.000"
                  className={`w-full px-3 py-2 border ${
                    formErrors.original_weight
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                  } rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2`}
                />
                {formErrors.original_weight && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {formErrors.original_weight}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Umbral de Stock Bajo (kg)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={openBagForm.low_stock_threshold}
                  onChange={(e) => {
                    setOpenBagForm({ ...openBagForm, low_stock_threshold: e.target.value });
                    setFormErrors({ ...formErrors, low_stock_threshold: undefined });
                  }}
                  placeholder="Ej: 3.000 (por defecto 15% del peso original)"
                  className={`w-full px-3 py-2 border ${
                    formErrors.low_stock_threshold
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                  } rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2`}
                />
                {formErrors.low_stock_threshold && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {formErrors.low_stock_threshold}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notas
                </label>
                <textarea
                  value={openBagForm.notes}
                  onChange={(e) => setOpenBagForm({ ...openBagForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Notas adicionales sobre la bolsa..."
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowOpenModal(false);
                    setFormErrors({});
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-sm hover:bg-primary-700 transition-colors"
                >
                  Abrir Bolsa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Bag Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-sm shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Cerrar Bolsa
            </h3>
            <form onSubmit={handleCloseBag} className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ¿Estás seguro de que quieres cerrar esta bolsa? El peso restante se establecerá en
                0.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notas de cierre
                </label>
                <textarea
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Razón de cierre, observaciones..."
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCloseModal(false);
                    setClosingBagId(null);
                    setCloseNotes('');
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-sm hover:bg-red-700 transition-colors"
                >
                  Cerrar Bolsa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenBagManagement;
