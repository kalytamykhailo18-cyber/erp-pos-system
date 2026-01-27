import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import {
  loadNonSalesDeductions,
  loadPendingDeductions,
  createNonSalesDeduction,
  approveNonSalesDeduction,
  rejectNonSalesDeduction,
} from '../../store/slices/nonSalesDeductionSlice';
import {
  MdAdd,
  MdCheckCircle,
  MdCancel,
  MdPending,
  MdCardGiftcard,
  MdFavorite,
} from 'react-icons/md';
import { ProductSelector } from '../../components/ui/ProductSelector';
import type { UUID, Decimal, DeductionType } from '../../types';

const NonSalesDeductions: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { deductions, pendingDeductions } = useSelector(
    (state: RootState) => state.nonSalesDeduction
  );

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedDeductionId, setSelectedDeductionId] = useState<UUID | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Create form
  const [createForm, setCreateForm] = useState({
    product_id: '',
    quantity: '',
    deduction_type: 'FREE_SAMPLE' as DeductionType,
    reason: '',
    recipient: '',
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState<{
    product_id?: string;
    quantity?: string;
    reason?: string;
  }>({});

  const branchId = user?.primary_branch_id;
  const isManager = user?.role?.name === 'MANAGER' || user?.role?.name === 'OWNER';

  useEffect(() => {
    if (branchId) {
      dispatch(loadNonSalesDeductions({ branch_id: branchId }));
      if (isManager) {
        dispatch(loadPendingDeductions({ branch_id: branchId }));
      }
    }
  }, [dispatch, branchId, isManager]);

  const validateCreateForm = (): boolean => {
    const errors: typeof formErrors = {};

    // Validate product selection
    if (!createForm.product_id) {
      errors.product_id = 'Debe seleccionar un producto';
    }

    // Validate quantity
    const quantity = parseFloat(createForm.quantity);
    if (!createForm.quantity) {
      errors.quantity = 'La cantidad es requerida';
    } else if (isNaN(quantity) || quantity <= 0) {
      errors.quantity = 'La cantidad debe ser mayor a 0';
    } else if (quantity > 10000) {
      errors.quantity = 'La cantidad no puede exceder 10,000 unidades';
    }

    // Validate reason for certain types
    if (!createForm.reason && createForm.deduction_type === 'DONATION') {
      errors.reason = 'La razón es requerida para donaciones';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateDeduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) return;

    // Validate form before submission
    if (!validateCreateForm()) {
      return;
    }

    await dispatch(
      createNonSalesDeduction({
        branch_id: branchId,
        product_id: createForm.product_id,
        quantity: createForm.quantity as Decimal,
        deduction_type: createForm.deduction_type,
        reason: createForm.reason || undefined,
        recipient: createForm.recipient || undefined,
      })
    );

    setShowCreateModal(false);
    setCreateForm({
      product_id: '',
      quantity: '',
      deduction_type: 'FREE_SAMPLE',
      reason: '',
      recipient: '',
    });
    setFormErrors({});

    // Reload deductions
    if (branchId) {
      dispatch(loadNonSalesDeductions({ branch_id: branchId }));
      if (isManager) {
        dispatch(loadPendingDeductions({ branch_id: branchId }));
      }
    }
  };

  const handleApprove = async (id: UUID) => {
    await dispatch(approveNonSalesDeduction(id));

    // Reload deductions
    if (branchId) {
      dispatch(loadNonSalesDeductions({ branch_id: branchId }));
      dispatch(loadPendingDeductions({ branch_id: branchId }));
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeductionId) return;

    await dispatch(
      rejectNonSalesDeduction({
        id: selectedDeductionId,
        rejection_reason: rejectionReason || undefined,
      })
    );

    setShowApprovalModal(false);
    setSelectedDeductionId(null);
    setRejectionReason('');

    // Reload deductions
    if (branchId) {
      dispatch(loadNonSalesDeductions({ branch_id: branchId }));
      dispatch(loadPendingDeductions({ branch_id: branchId }));
    }
  };

  const openRejectModal = (id: UUID) => {
    setSelectedDeductionId(id);
    setShowApprovalModal(true);
  };

  const getDeductionTypeIcon = (type: DeductionType) => {
    return type === 'FREE_SAMPLE' ? (
      <MdCardGiftcard className="text-blue-600 dark:text-blue-400" size={20} />
    ) : (
      <MdFavorite className="text-pink-600 dark:text-pink-400" size={20} />
    );
  };

  const getDeductionTypeName = (type: DeductionType) => {
    return type === 'FREE_SAMPLE' ? 'Muestra Gratis' : 'Donación';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 flex items-center gap-1 w-fit">
            <MdPending size={14} />
            Pendiente
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center gap-1 w-fit">
            <MdCheckCircle size={14} />
            Aprobado
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 flex items-center gap-1 w-fit">
            <MdCancel size={14} />
            Rechazado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Deducciones sin Venta
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gestiona muestras gratis y donaciones que requieren autorización
            </p>
          </div>
          <button
            onClick={() => {
              setShowCreateModal(true);
              setFormErrors({});
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-sm hover:bg-primary-700 transition-colors"
          >
            <MdAdd size={20} />
            Nueva Solicitud
          </button>
        </div>

        {/* Pending Approvals (Manager/Owner Only) */}
        {isManager && pendingDeductions.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-sm">
            <div className="flex items-center gap-2 mb-4">
              <MdPending className="text-yellow-600 dark:text-yellow-400" size={20} />
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                Solicitudes Pendientes de Aprobación ({pendingDeductions.length})
              </h3>
            </div>
            <div className="space-y-3">
              {pendingDeductions.map((deduction) => (
                <div
                  key={deduction.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-sm border border-yellow-200 dark:border-yellow-700"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {getDeductionTypeIcon(deduction.deduction_type)}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {getDeductionTypeName(deduction.deduction_type)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(deduction.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <p>
                      <strong>Producto:</strong> {deduction.product?.name || 'Sin nombre'}
                    </p>
                    <p>
                      <strong>Cantidad:</strong> {deduction.quantity}
                    </p>
                    {deduction.reason && (
                      <p>
                        <strong>Razón:</strong> {deduction.reason}
                      </p>
                    )}
                    {deduction.recipient && (
                      <p>
                        <strong>Destinatario:</strong> {deduction.recipient}
                      </p>
                    )}
                    <p>
                      <strong>Solicitado por:</strong>{' '}
                      {deduction.requester ? `${deduction.requester.first_name} ${deduction.requester.last_name}` : 'Desconocido'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(deduction.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-sm hover:bg-green-700 transition-colors"
                    >
                      <MdCheckCircle size={16} />
                      Aprobar
                    </button>
                    <button
                      onClick={() => openRejectModal(deduction.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-sm hover:bg-red-700 transition-colors"
                    >
                      <MdCancel size={16} />
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Deductions Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Producto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Cantidad
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Razón
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Solicitado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Aprobado por
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {deductions.map((deduction) => (
                <tr key={deduction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {getDeductionTypeIcon(deduction.deduction_type)}
                      <span className="text-gray-900 dark:text-white">
                        {getDeductionTypeName(deduction.deduction_type)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {deduction.product?.name || 'Sin nombre'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {deduction.quantity}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {deduction.reason || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(deduction.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">{getStatusBadge(deduction.approval_status)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {deduction.approver ? `${deduction.approver.first_name} ${deduction.approver.last_name}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {deductions.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No hay deducciones registradas
            </div>
          )}
        </div>
      </div>

      {/* Create Deduction Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-sm shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Nueva Solicitud de Deducción
            </h3>
            <form onSubmit={handleCreateDeduction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Deducción *
                </label>
                <select
                  required
                  value={createForm.deduction_type}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      deduction_type: e.target.value as DeductionType,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="FREE_SAMPLE">Muestra Gratis</option>
                  <option value="DONATION">Donación</option>
                </select>
              </div>
              <ProductSelector
                value={createForm.product_id}
                onChange={(productId) => {
                  setCreateForm({ ...createForm, product_id: productId });
                  setFormErrors({ ...formErrors, product_id: undefined });
                }}
                branchId={branchId}
                label="Producto"
                placeholder="Buscar producto..."
                required
                error={formErrors.product_id}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cantidad *
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  required
                  value={createForm.quantity}
                  onChange={(e) => {
                    setCreateForm({ ...createForm, quantity: e.target.value });
                    setFormErrors({ ...formErrors, quantity: undefined });
                  }}
                  placeholder="Cantidad a deducir"
                  className={`w-full px-3 py-2 border ${
                    formErrors.quantity
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                  } rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2`}
                />
                {formErrors.quantity && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {formErrors.quantity}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Razón {createForm.deduction_type === 'DONATION' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={createForm.reason}
                  onChange={(e) => {
                    setCreateForm({ ...createForm, reason: e.target.value });
                    setFormErrors({ ...formErrors, reason: undefined });
                  }}
                  className={`w-full px-3 py-2 border ${
                    formErrors.reason
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                  } rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2`}
                  rows={3}
                  placeholder="Explica el motivo de la deducción..."
                />
                {formErrors.reason && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {formErrors.reason}
                  </p>
                )}
              </div>
              {createForm.deduction_type === 'DONATION' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Destinatario
                  </label>
                  <input
                    type="text"
                    value={createForm.recipient}
                    onChange={(e) => setCreateForm({ ...createForm, recipient: e.target.value })}
                    placeholder="Refugio, organización, etc."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-sm">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Esta solicitud será enviada al gerente para su aprobación antes de deducir el
                  stock.
                </p>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
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
                  Enviar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Deduction Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-sm shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Rechazar Solicitud
            </h3>
            <form onSubmit={handleReject} className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ¿Estás seguro de que quieres rechazar esta solicitud?
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Razón del rechazo
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Explica por qué se rechaza la solicitud..."
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedDeductionId(null);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-sm hover:bg-red-700 transition-colors"
                >
                  Rechazar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NonSalesDeductions;
