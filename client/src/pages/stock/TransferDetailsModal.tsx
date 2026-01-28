import React, { useState } from 'react';
import { Modal, Button, Input } from '../../components/ui';
import type { StockTransfer, UUID } from '../../types';

interface TransferDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transfer: StockTransfer | null;
  onApprove?: (transferId: UUID, items: Array<{ id: UUID; shipped_quantity: number }>) => void;
  onReceive?: (transferId: UUID, items: Array<{ item_id: UUID; quantity_received: number }>, notes?: string) => void;
  onCancel?: (transferId: UUID, reason: string) => void;
  loading: boolean;
}

const TransferDetailsModal: React.FC<TransferDetailsModalProps> = ({
  isOpen,
  onClose,
  transfer,
  onApprove,
  onReceive,
  onCancel,
  loading
}) => {
  const [shippedQuantities, setShippedQuantities] = useState<Record<UUID, string>>({});
  const [receivedQuantities, setReceivedQuantities] = useState<Record<UUID, string>>({});
  const [receiveNotes, setReceiveNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showReceiveForm, setShowReceiveForm] = useState(false);

  const formatDateTime = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-AR').format(num);
  };

  const getStatusInfo = (status: string) => {
    const styles: Record<string, { label: string; className: string }> = {
      PENDING: {
        label: 'Pendiente',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      },
      APPROVED: {
        label: 'Aprobado',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      },
      IN_TRANSIT: {
        label: 'En tránsito',
        className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      },
      RECEIVED: {
        label: 'Recibido',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      },
      CANCELLED: {
        label: 'Cancelado',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      }
    };
    return styles[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
  };

  const handleApprove = () => {
    if (!transfer || !onApprove || !transfer.items || transfer.items.length === 0) {
      console.error('Cannot approve: transfer items not loaded');
      return;
    }

    const items = transfer.items.map(item => ({
      id: item.id,
      shipped_quantity: shippedQuantities[item.id]
        ? Number(shippedQuantities[item.id])
        : Number(item.requested_quantity)
    }));

    onApprove(transfer.id, items);
    setShowApproveForm(false);
    setShippedQuantities({});
  };

  const handleReceive = () => {
    if (!transfer || !onReceive || !transfer.items || transfer.items.length === 0) {
      console.error('Cannot receive: transfer items not loaded');
      return;
    }

    const items = transfer.items.map(item => ({
      item_id: item.id,
      quantity_received: receivedQuantities[item.id]
        ? Number(receivedQuantities[item.id])
        : Number(item.shipped_quantity || item.requested_quantity)
    }));

    onReceive(transfer.id, items, receiveNotes || undefined);
    setShowReceiveForm(false);
    setReceivedQuantities({});
    setReceiveNotes('');
  };

  const handleCancel = () => {
    if (transfer && onCancel && cancelReason.trim()) {
      onCancel(transfer.id, cancelReason);
      setShowCancelConfirm(false);
      setCancelReason('');
    }
  };

  const handleClose = () => {
    setShowApproveForm(false);
    setShowReceiveForm(false);
    setShowCancelConfirm(false);
    setShippedQuantities({});
    setReceivedQuantities({});
    setReceiveNotes('');
    setCancelReason('');
    onClose();
  };

  if (!transfer) return null;

  const statusInfo = getStatusInfo(transfer.status);
  const hasItems = transfer.items && transfer.items.length > 0;
  const canApprove = transfer.status === 'PENDING' && onApprove && hasItems;
  const canReceive = transfer.status === 'IN_TRANSIT' && onReceive && hasItems;
  const canCancel = (transfer.status === 'PENDING' || transfer.status === 'IN_TRANSIT') && onCancel;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Traslado ${transfer.transfer_number}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Info */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-sm animate-fade-down duration-fast">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">Estado</p>
              <span className={`inline-flex px-3 py-1 mt-1 text-sm font-semibold rounded-full ${statusInfo.className}`}>
                {statusInfo.label}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Solicitado</p>
              <p className="text-sm font-medium mt-1">{formatDateTime(transfer.requested_at)}</p>
            </div>
          </div>
        </div>

        {/* Branch Info */}
        <div className="grid grid-cols-2 gap-4 animate-fade-right duration-normal">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-sm">
            <p className="text-xs text-gray-500 uppercase mb-1">Desde</p>
            <p className="font-medium">{transfer.source_branch?.name || 'Sucursal Origen'}</p>
            {transfer.requester && (
              <p className="text-sm text-gray-500 mt-1">Por: {transfer.requester.first_name} {transfer.requester.last_name}</p>
            )}
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-sm">
            <p className="text-xs text-gray-500 uppercase mb-1">Hacia</p>
            <p className="font-medium">{transfer.destination_branch?.name || 'Sucursal Destino'}</p>
          </div>
        </div>

        {/* Timeline */}
        {(transfer.approved_at || transfer.shipped_at || transfer.received_at) && (
          <div className="space-y-2 animate-fade-up duration-normal">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Historial</p>
            <div className="space-y-1 text-sm">
              {transfer.approved_at && (
                <p className="text-gray-600 dark:text-gray-400">
                  Aprobado: {formatDateTime(transfer.approved_at)}
                  {transfer.approver && ` por ${transfer.approver.first_name} ${transfer.approver.last_name}`}
                </p>
              )}
              {transfer.shipped_at && (
                <p className="text-gray-600 dark:text-gray-400">
                  Enviado: {formatDateTime(transfer.shipped_at)}
                  {transfer.shipper && ` por ${transfer.shipper.first_name} ${transfer.shipper.last_name}`}
                </p>
              )}
              {transfer.received_at && (
                <p className="text-gray-600 dark:text-gray-400">
                  Recibido: {formatDateTime(transfer.received_at)}
                  {transfer.receiver && ` por ${transfer.receiver.first_name} ${transfer.receiver.last_name}`}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="animate-zoom-in duration-normal">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Productos</p>
          <div className="border border-gray-200 dark:border-gray-700 rounded-sm">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Producto
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Solicitado
                  </th>
                  {transfer.status === 'IN_TRANSIT' && (
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Enviado
                    </th>
                  )}
                  {transfer.status === 'RECEIVED' && (
                    <>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Enviado
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Recibido
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {transfer.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {item.product?.name || 'Producto'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                      {formatNumber(Number(item.requested_quantity))}
                    </td>
                    {transfer.status === 'IN_TRANSIT' && item.shipped_quantity !== null && (
                      <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                        {formatNumber(Number(item.shipped_quantity))}
                      </td>
                    )}
                    {transfer.status === 'RECEIVED' && (
                      <>
                        <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                          {item.shipped_quantity !== null ? formatNumber(Number(item.shipped_quantity)) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={
                            item.received_quantity !== null && Number(item.received_quantity) !== Number(item.requested_quantity)
                              ? 'text-warning-600 dark:text-warning-400 font-medium'
                              : 'text-gray-900 dark:text-white'
                          }>
                            {item.received_quantity !== null ? formatNumber(Number(item.received_quantity)) : '-'}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes */}
        {transfer.notes && (
          <div className="animate-fade-up duration-slow">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-sm">
              {transfer.notes}
            </p>
          </div>
        )}

        {/* Approve Form */}
        {showApproveForm && transfer.items && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4 animate-fade-down duration-normal">
            <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-sm">
              <p className="text-sm text-primary-800 dark:text-primary-300">
                Confirme las cantidades que se enviarán. Por defecto se enviarán las cantidades solicitadas.
              </p>
            </div>
            {transfer.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.product?.name}</p>
                  <p className="text-xs text-gray-500">
                    Solicitado: {formatNumber(Number(item.requested_quantity))}
                  </p>
                </div>
                <div className="w-32">
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    value={shippedQuantities[item.id] || String(item.requested_quantity)}
                    onChange={(e) => setShippedQuantities({
                      ...shippedQuantities,
                      [item.id]: e.target.value
                    })}
                    placeholder="Cantidad"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Receive Form */}
        {showReceiveForm && transfer.items && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4 animate-fade-down duration-normal">
            <p className="font-medium">Confirmar Cantidades Recibidas</p>
            {transfer.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.product?.name}</p>
                  <p className="text-xs text-gray-500">
                    Solicitado: {formatNumber(Number(item.requested_quantity))}
                    {item.shipped_quantity !== null && ` | Enviado: ${formatNumber(Number(item.shipped_quantity))}`}
                  </p>
                </div>
                <div className="w-32">
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    value={receivedQuantities[item.id] || String(item.requested_quantity)}
                    onChange={(e) => setReceivedQuantities({
                      ...receivedQuantities,
                      [item.id]: e.target.value
                    })}
                    placeholder="Cantidad"
                  />
                </div>
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notas de Recepción (opcional)
              </label>
              <textarea
                value={receiveNotes}
                onChange={(e) => setReceiveNotes(e.target.value)}
                placeholder="Observaciones sobre la recepción..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700"
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Cancel Form */}
        {showCancelConfirm && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4 animate-fade-down duration-normal">
            <p className="font-medium text-danger-600">Confirmar Cancelación</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Razón de Cancelación *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Explica por qué se cancela el traslado..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 animate-fade-up duration-slow">
          {showApproveForm ? (
            <>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowApproveForm(false)}
                disabled={loading}
              >
                Volver
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleApprove}
                disabled={loading}
              >
                {loading ? 'Aprobando...' : 'Aprobar y Enviar'}
              </Button>
            </>
          ) : showReceiveForm ? (
            <>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowReceiveForm(false)}
                disabled={loading}
              >
                Volver
              </Button>
              <Button
                variant="success"
                fullWidth
                onClick={handleReceive}
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Confirmar Recepción'}
              </Button>
            </>
          ) : showCancelConfirm ? (
            <>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setShowCancelConfirm(false);
                  setCancelReason('');
                }}
                disabled={loading}
              >
                Volver
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={handleCancel}
                disabled={loading || !cancelReason.trim()}
              >
                {loading ? 'Cancelando...' : 'Confirmar Cancelación'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={handleClose} disabled={loading}>
                Cerrar
              </Button>
              {canApprove && (
                <Button
                  variant="primary"
                  onClick={() => setShowApproveForm(true)}
                  disabled={loading}
                >
                  Aprobar y Enviar
                </Button>
              )}
              {canReceive && (
                <Button
                  variant="success"
                  onClick={() => setShowReceiveForm(true)}
                  disabled={loading}
                >
                  Recibir Traslado
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="danger"
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={loading}
                >
                  Cancelar Traslado
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default TransferDetailsModal;
