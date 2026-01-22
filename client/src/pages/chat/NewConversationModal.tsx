import React, { useState, useEffect } from 'react';
import { Modal, Button } from '../../components/ui';
import { useAppSelector } from '../../store';
import type { UUID } from '../../types';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (branchAId: UUID, branchBId: UUID) => void;
  currentBranchId?: UUID;
  loading: boolean;
}

const NewConversationModal: React.FC<NewConversationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentBranchId,
  loading
}) => {
  const { availableBranches } = useAppSelector((state) => state.auth);
  const [branchAId, setBranchAId] = useState<UUID>(currentBranchId || '');
  const [branchBId, setBranchBId] = useState<UUID>('');
  const [error, setError] = useState('');

  // Reset branch A when current branch changes
  useEffect(() => {
    if (currentBranchId) {
      setBranchAId(currentBranchId);
    }
  }, [currentBranchId]);

  const handleSubmit = () => {
    setError('');

    if (!branchAId || !branchBId) {
      setError('Debes seleccionar ambas sucursales');
      return;
    }

    if (branchAId === branchBId) {
      setError('No puedes crear una conversación con la misma sucursal');
      return;
    }

    onSubmit(branchAId, branchBId);
  };

  const handleClose = () => {
    setBranchAId(currentBranchId || '');
    setBranchBId('');
    setError('');
    onClose();
  };

  // Filter out selected branches from the other dropdown
  const getAvailableBranchesForA = () => {
    return availableBranches;
  };

  const getAvailableBranchesForB = () => {
    return availableBranches.filter(branch => branch.id !== branchAId);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nueva Conversación entre Sucursales"
      size="md"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Crea una conversación entre dos sucursales para coordinar traslados y disponibilidad de productos.
        </p>

        {error && (
          <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-sm p-3 animate-shake duration-fast">
            <p className="text-sm text-danger-800 dark:text-danger-300">{error}</p>
          </div>
        )}

        {/* Branch A Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sucursal A
          </label>
          <select
            value={branchAId}
            onChange={(e) => setBranchAId(e.target.value as UUID)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={loading || !!currentBranchId}
          >
            <option value="">Selecciona una sucursal</option>
            {getAvailableBranchesForA().map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          {currentBranchId && (
            <p className="text-xs text-gray-500 mt-1">
              Tu sucursal actual ha sido seleccionada automáticamente
            </p>
          )}
        </div>

        {/* Branch B Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sucursal B
          </label>
          <select
            value={branchBId}
            onChange={(e) => setBranchBId(e.target.value as UUID)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={loading || !branchAId}
          >
            <option value="">Selecciona otra sucursal</option>
            {getAvailableBranchesForB().map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          {!branchAId && (
            <p className="text-xs text-gray-500 mt-1">
              Primero selecciona la Sucursal A
            </p>
          )}
        </div>

        {/* Preview */}
        {branchAId && branchBId && (
          <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-sm border border-primary-200 dark:border-primary-800 animate-fade-down duration-normal">
            <p className="text-sm text-primary-800 dark:text-primary-300">
              <strong>Conversación:</strong>{' '}
              {availableBranches.find(b => b.id === branchAId)?.name} ↔{' '}
              {availableBranches.find(b => b.id === branchBId)?.name}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="secondary"
            fullWidth
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleSubmit}
            disabled={loading || !branchAId || !branchBId}
          >
            {loading ? 'Creando...' : 'Crear Conversación'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default NewConversationModal;
