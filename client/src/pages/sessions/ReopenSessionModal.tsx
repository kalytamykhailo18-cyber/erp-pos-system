import React, { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { useAppDispatch, useAppSelector } from '../../store';
import { reopenSession } from '../../store/slices/registersSlice';
import type { UUID } from '../../types';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LockOpenIcon from '@mui/icons-material/LockOpen';

interface ReopenSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: UUID;
  sessionNumber: string;
  branchName: string;
  onSuccess: () => void;
}

const ReopenSessionModal: React.FC<ReopenSessionModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  sessionNumber,
  branchName,
  onSuccess
}) => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.ui.loading);
  const [reason, setReason] = useState('');
  const [managerPin, setManagerPin] = useState('');
  const [error, setError] = useState('');

  const handleReopen = async () => {
    // Validation
    if (!reason || reason.trim().length === 0) {
      setError('Debe ingresar un motivo para la reapertura');
      return;
    }

    if (reason.trim().length < 10) {
      setError('El motivo debe tener al menos 10 caracteres');
      return;
    }

    if (!managerPin || managerPin.trim().length === 0) {
      setError('Debe ingresar el PIN de supervisor para autorizar la reapertura');
      return;
    }

    setError('');

    try {
      await dispatch(reopenSession({
        session_id: sessionId,
        reason: reason.trim(),
        manager_pin: managerPin
      })).unwrap();

      // Reset form
      setReason('');
      setManagerPin('');

      // Notify parent and close
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMsg = err || 'Error al reabrir sesión';
      setError(errorMsg);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setReason('');
      setManagerPin('');
      setError('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reabrir Sesión de Caja"
      size="md"
      closeOnOverlayClick={false}
    >
      <div className="space-y-5">
        {/* Warning Banner */}
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-md p-4">
          <div className="flex items-start">
            <WarningAmberIcon className="text-orange-600 dark:text-orange-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-orange-800 dark:text-orange-300">
                Acción de Alta Criticidad
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                Reabrir una sesión cerrada es una operación excepcional que quedará registrada en el sistema de auditoría.
                Esta acción requiere autorización de supervisor y un motivo válido.
              </p>
            </div>
          </div>
        </div>

        {/* Session Info */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Sesión:</span>
              <p className="font-semibold text-gray-900 dark:text-white">{sessionNumber}</p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Sucursal:</span>
              <p className="font-semibold text-gray-900 dark:text-white">{branchName}</p>
            </div>
          </div>
        </div>

        {/* Reason Input */}
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Motivo de la Reapertura <span className="text-red-500">*</span>
          </label>
          <textarea
            id="reason"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
            placeholder="Explique detalladamente por qué es necesario reabrir esta sesión cerrada (mínimo 10 caracteres)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={loading}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {reason.length}/200 caracteres {reason.length < 10 && reason.length > 0 && '(mínimo 10)'}
          </p>
        </div>

        {/* Manager PIN Input */}
        <div>
          <label htmlFor="managerPin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            PIN de Supervisor <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="managerPin"
              type="password"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Ingrese el PIN de 4 dígitos"
              value={managerPin}
              onChange={(e) => setManagerPin(e.target.value)}
              maxLength={4}
              disabled={loading}
              autoComplete="off"
            />
            <LockOpenIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Solo supervisores pueden autorizar la reapertura de sesiones
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md p-3">
            <p className="text-sm text-red-700 dark:text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* Audit Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md p-3">
          <p className="text-xs text-blue-700 dark:text-blue-400">
            Esta reapertura será registrada en el log de auditoría con: fecha/hora, usuario solicitante,
            supervisor autorizante, motivo, y se generará una alerta de alta prioridad para el propietario.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleReopen}
            disabled={loading || reason.trim().length < 10 || managerPin.trim().length === 0}
            className="min-w-[140px]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Reabriendo...</span>
              </div>
            ) : (
              <>
                <LockOpenIcon className="h-4 w-4 mr-2" />
                Reabrir Sesión
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReopenSessionModal;
