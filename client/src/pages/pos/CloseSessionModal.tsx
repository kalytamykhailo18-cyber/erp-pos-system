import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { closeSession, checkUnapprovedVoids } from '../../store/slices/registersSlice';
import { loadDenominations } from '../../store/slices/denominationSlice';
import WarningIcon from '@mui/icons-material/Warning';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface CloseSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CloseSessionModal: React.FC<CloseSessionModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { currentSession, unapprovedVoids } = useAppSelector((state) => state.registers);
  const { denominations } = useAppSelector((state) => state.denomination);
  const loading = useAppSelector((state) => state.ui.loading);

  // PART 16: Get active denominations sorted by display_order
  const activeDenominations = useMemo(() => {
    return denominations
      .filter((d) => d.is_active)
      .sort((a, b) => a.display_order - b.display_order);
  }, [denominations]);

  const [step, setStep] = useState<'counting' | 'summary'>('counting');
  const [checkingVoids, setCheckingVoids] = useState(true);

  // Cashier's declared amounts (BLIND - they don't see expected)
  const [billCounts, setBillCounts] = useState<{ [key: number]: number }>({});
  const [coins, setCoins] = useState('0');
  const [declaredCard, setDeclaredCard] = useState('');
  const [declaredQR, setDeclaredQR] = useState('');
  const [declaredTransfer, setDeclaredTransfer] = useState('');
  const [notes, setNotes] = useState('');

  // Closing result
  const [closingResult, setClosingResult] = useState<any>(null);

  // CRITICAL: Check for unapproved voids and load denominations when modal opens
  useEffect(() => {
    if (isOpen) {
      // PART 16: Load denominations
      dispatch(loadDenominations({ includeInactive: false }));

      if (currentSession) {
        setCheckingVoids(true);
        dispatch(checkUnapprovedVoids(currentSession.id)).finally(() => {
          setCheckingVoids(false);
        });
      }
    }
  }, [isOpen, currentSession, dispatch]);

  // PART 16: Initialize billCounts when denominations load
  useEffect(() => {
    if (activeDenominations.length > 0 && Object.keys(billCounts).length === 0) {
      const initialCounts: { [key: number]: number } = {};
      activeDenominations.forEach((denom) => {
        initialCounts[parseFloat(denom.value)] = 0;
      });
      setBillCounts(initialCounts);
    }
  }, [activeDenominations, billCounts]);

  // PART 16: Calculate declared cash from dynamic denominations
  const calculateDeclaredCash = (): number => {
    let total = 0;
    activeDenominations.forEach((denom) => {
      const value = parseFloat(denom.value);
      total += value * (billCounts[value] || 0);
    });
    total += parseFloat(coins) || 0;
    return total;
  };

  const declaredCash = calculateDeclaredCash();

  const handleBillCountChange = (denomination: number, value: string) => {
    const count = parseInt(value) || 0;
    setBillCounts({
      ...billCounts,
      [denomination]: Math.max(0, count),
    });
  };

  const handleCloseSession = async () => {
    if (!currentSession) {
      alert('No hay sesión activa');
      return;
    }

    if (declaredCash === 0 && parseFloat(declaredCard || '0') === 0 &&
        parseFloat(declaredQR || '0') === 0 && parseFloat(declaredTransfer || '0') === 0) {
      alert('Debe declarar al menos un monto');
      return;
    }

    const confirmed = window.confirm(
      `¿Confirmar cierre de caja?\n\n` +
      `Efectivo: $${declaredCash.toLocaleString('es-AR')}\n` +
      `Tarjeta: $${(parseFloat(declaredCard) || 0).toLocaleString('es-AR')}\n` +
      `QR: $${(parseFloat(declaredQR) || 0).toLocaleString('es-AR')}\n` +
      `Transferencia: $${(parseFloat(declaredTransfer) || 0).toLocaleString('es-AR')}\n\n` +
      `TOTAL: $${(declaredCash + (parseFloat(declaredCard) || 0) + (parseFloat(declaredQR) || 0) + (parseFloat(declaredTransfer) || 0)).toLocaleString('es-AR')}`
    );

    if (!confirmed) return;

    try {
      // PART 16: Dynamically construct closing_denominations object from active denominations
      const closing_denominations: any = {
        coins: parseFloat(coins) || 0,
      };

      activeDenominations.forEach((denom) => {
        const value = parseFloat(denom.value);
        const fieldName = `bills_${Math.floor(value)}`;
        closing_denominations[fieldName] = billCounts[value] || 0;
      });

      const result = await dispatch(closeSession({
        session_id: currentSession.id,
        data: {
          declared_cash: declaredCash,
          declared_card: parseFloat(declaredCard) || 0,
          declared_qr: parseFloat(declaredQR) || 0,
          declared_transfer: parseFloat(declaredTransfer) || 0,
          closing_notes: notes,
          closing_denominations,
        },
      })).unwrap();

      setClosingResult(result);
      setStep('summary');
    } catch (error) {
      // Error handled by slice
    }
  };

  const handleFinish = () => {
    onClose();
    navigate('/dashboard');
  };

  if (!isOpen || !currentSession) return null;

  // CRITICAL: Show blocking modal if checking voids or if unapproved voids exist
  const hasUnapprovedVoids = unapprovedVoids?.has_unapproved_voids || false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto m-4">
        {checkingVoids ? (
          /* CHECKING FOR UNAPPROVED VOIDS */
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Verificando ventas anuladas...</p>
          </div>
        ) : hasUnapprovedVoids ? (
          /* BLOCKING: UNAPPROVED VOIDS EXIST */
          <>
            <div className="sticky top-0 bg-red-600 border-b border-red-700 px-6 py-4 z-10">
              <h2 className="text-2xl font-bold text-white">
                ⛔ No se puede cerrar la caja
              </h2>
              <p className="text-sm text-red-100 mt-1">
                Hay ventas anuladas pendientes de aprobación
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded">
                <div className="flex items-start gap-3">
                  <WarningIcon sx={{ fontSize: 24 }} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-red-800 dark:text-red-300 mb-2">
                      REQUERIMIENTO CRÍTICO DEL NEGOCIO
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-400">
                      La caja NO puede cerrarse si hay ventas anuladas sin la aprobación de un gerente o dueño.
                      Contacte a un gerente o dueño para que apruebe las siguientes {unapprovedVoids?.count} venta(s) anulada(s).
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Ventas Anuladas Pendientes ({unapprovedVoids?.count})
                </h3>

                {unapprovedVoids?.voids.map((voidSale) => (
                  <div key={voidSale.id} className="bg-white dark:bg-gray-700 border-2 border-red-300 dark:border-red-600 rounded-sm p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {voidSale.sale_number}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Anulado el {new Date(voidSale.voided_at).toLocaleString('es-AR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                          ${Number(voidSale.total_amount).toLocaleString('es-AR')}
                        </p>
                        <span className="inline-block px-2 py-1 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 text-xs font-semibold rounded">
                          SIN APROBAR
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 space-y-1 text-sm">
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Razón:</strong> {voidSale.void_reason}
                      </p>
                      {voidSale.voided_by && (
                        <p className="text-gray-600 dark:text-gray-400">
                          <strong>Anulado por:</strong> {voidSale.voided_by.name}
                        </p>
                      )}
                      {voidSale.created_by && (
                        <p className="text-gray-600 dark:text-gray-400">
                          <strong>Venta original de:</strong> {voidSale.created_by.name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  <strong>¿Qué debe hacer?</strong><br />
                  1. Contacte a un gerente o dueño<br />
                  2. El gerente/dueño debe aprobar cada venta anulada desde el panel de administración<br />
                  3. Una vez aprobadas todas las ventas anuladas, podrá cerrar la caja normalmente
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 rounded-sm hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
              >
                Entendido - Cerrar
              </button>
            </div>
          </>
        ) : step === 'counting' ? (
          /* STEP 1: BLIND COUNTING */
          <>
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Cerrar Caja - Cierre Ciego
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Cuente el efectivo y declare los montos SIN ver los totales esperados
              </p>
              <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded">
                <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold">
                  IMPORTANTE: No puede ver los montos esperados hasta después de declarar
                </p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Session Info */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-sm p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Sesión:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                      {currentSession.session_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Turno:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                      {currentSession.shift_type === 'MORNING' ? 'Mañana' :
                       currentSession.shift_type === 'AFTERNOON' ? 'Tarde' : 'Día Completo'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Abierto:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                      {new Date(currentSession.opened_at).toLocaleTimeString('es-AR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Caja Inicial:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                      ${Number(currentSession.opening_cash).toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cash Denomination Breakdown */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  1. Desglose de Efectivo
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-sm p-4">
                  <div className="grid grid-cols-4 gap-4 mb-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                    <div>Denominación</div>
                    <div>Cantidad</div>
                    <div className="col-span-2">Subtotal</div>
                  </div>

                  {/* PART 16: Dynamic denomination inputs */}
                  {activeDenominations.map((denom) => {
                    const value = parseFloat(denom.value);
                    return (
                      <div key={denom.id} className="grid grid-cols-4 gap-4 items-center py-2 border-t border-gray-200 dark:border-gray-600">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {denom.label}
                        </div>
                        <input
                          type="number"
                          value={billCounts[value] || ''}
                          onChange={(e) => handleBillCountChange(value, e.target.value)}
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                          min="0"
                          placeholder="0"
                        />
                        <div className="col-span-2 text-right font-semibold text-gray-900 dark:text-white">
                          ${(value * (billCounts[value] || 0)).toLocaleString('es-AR')}
                        </div>
                      </div>
                    );
                  })}

                  <div className="grid grid-cols-4 gap-4 items-center py-2 border-t border-gray-200 dark:border-gray-600">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      Monedas/Menor
                    </div>
                    <input
                      type="number"
                      value={coins}
                      onChange={(e) => setCoins(e.target.value)}
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    <div className="col-span-2 text-right font-semibold text-gray-900 dark:text-white">
                      ${(parseFloat(coins) || 0).toLocaleString('es-AR')}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t-2 border-gray-300 dark:border-gray-600">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        Total Efectivo Contado:
                      </span>
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        ${declaredCash.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Other Payment Methods */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  2. Otros Medios de Pago
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Total Tarjetas (Débito + Crédito)
                    </label>
                    <input
                      type="number"
                      value={declaredCard}
                      onChange={(e) => setDeclaredCard(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Total QR / CVU
                    </label>
                    <input
                      type="number"
                      value={declaredQR}
                      onChange={(e) => setDeclaredQR(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Total Transferencias
                    </label>
                    <input
                      type="number"
                      value={declaredTransfer}
                      onChange={(e) => setDeclaredTransfer(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              {/* Total Declared */}
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-sm p-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    TOTAL DECLARADO:
                  </span>
                  <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                    ${(declaredCash + (parseFloat(declaredCard) || 0) + (parseFloat(declaredQR) || 0) + (parseFloat(declaredTransfer) || 0)).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Observaciones (Opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  placeholder="Comentarios sobre el cierre..."
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 rounded-sm hover:bg-gray-50 dark:hover:bg-gray-500 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCloseSession}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-sm hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Cerrando...' : 'Cerrar Caja'}
              </button>
            </div>
          </>
        ) : (
          /* STEP 2: DISCREPANCY SUMMARY */
          <>
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Resumen de Cierre
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Caja cerrada exitosamente
              </p>
            </div>

            {closingResult && (
              <div className="p-6 space-y-6">
                {/* Discrepancies */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Diferencias Detectadas
                  </h3>

                  <div className="space-y-3">
                    {[
                      { label: 'Efectivo', expected: closingResult.expected_cash, declared: closingResult.declared_cash, diff: closingResult.discrepancy_cash },
                      { label: 'Tarjetas', expected: closingResult.expected_card, declared: closingResult.declared_card, diff: closingResult.discrepancy_card },
                      { label: 'QR/CVU', expected: closingResult.expected_qr, declared: closingResult.declared_qr, diff: closingResult.discrepancy_qr },
                      { label: 'Transferencias', expected: closingResult.expected_transfer, declared: closingResult.declared_transfer, diff: closingResult.discrepancy_transfer },
                    ].map((item) => {
                      const diff = Number(item.diff);
                      const color = diff === 0 ? 'green' : diff < 0 ? 'red' : 'blue';

                      return (
                        <div key={item.label} className={`p-4 border-2 rounded-sm ${
                          color === 'green' ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' :
                          color === 'red' ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20' :
                          'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                        }`}>
                          <div className="font-semibold text-gray-900 dark:text-white mb-2">
                            {item.label}
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Esperado:</span>
                              <div className="font-semibold">${Number(item.expected).toLocaleString('es-AR')}</div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Declarado:</span>
                              <div className="font-semibold">${Number(item.declared).toLocaleString('es-AR')}</div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Diferencia:</span>
                              <div className={`font-bold ${
                                diff === 0 ? 'text-green-600 dark:text-green-400' :
                                diff < 0 ? 'text-red-600 dark:text-red-400' :
                                'text-blue-600 dark:text-blue-400'
                              }`}>
                                {diff === 0 ? 'OK' : (diff > 0 ? '+' : '') + `$${diff.toLocaleString('es-AR')}`}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Total Discrepancy */}
                <div className={`p-4 rounded-sm ${
                  Number(closingResult.total_discrepancy) === 0
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : Number(closingResult.total_discrepancy) < 0
                    ? 'bg-red-100 dark:bg-red-900/30'
                    : 'bg-blue-100 dark:bg-blue-900/30'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      DIFERENCIA TOTAL:
                    </span>
                    <span className={`text-3xl font-bold ${
                      Number(closingResult.total_discrepancy) === 0
                        ? 'text-green-600 dark:text-green-400'
                        : Number(closingResult.total_discrepancy) < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      {Number(closingResult.total_discrepancy) === 0
                        ? 'CUADRADO'
                        : (Number(closingResult.total_discrepancy) > 0 ? '+' : '') + `$${Number(closingResult.total_discrepancy).toLocaleString('es-AR')}`}
                    </span>
                  </div>
                  {Number(closingResult.total_discrepancy) < 0 && (
                    <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                      FALTANTE detectado
                    </p>
                  )}
                  {Number(closingResult.total_discrepancy) > 0 && (
                    <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                      SOBRANTE detectado
                    </p>
                  )}
                </div>

                {/* Petty Cash Warning */}
                {closingResult.petty_cash_warning && (
                  <div className="p-4 border-2 border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/30 rounded-sm">
                    <div className="flex items-start gap-3">
                      <WarningIcon sx={{ fontSize: 24 }} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-red-800 dark:text-red-300 mb-2">
                          ALERTA: FONDO DE RESERVA INSUFICIENTE
                        </h4>
                        <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                          {closingResult.petty_cash_warning.message}
                        </p>
                        <div className="bg-white dark:bg-gray-800 rounded p-3 text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Efectivo Declarado:</span>
                            <span className="font-bold text-gray-900 dark:text-white">
                              ${Number(closingResult.petty_cash_warning.declared_cash || 0).toLocaleString('es-AR')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Fondo Mínimo Requerido:</span>
                            <span className="font-bold text-gray-900 dark:text-white">
                              ${Number(closingResult.petty_cash_warning.petty_cash_required || 0).toLocaleString('es-AR')}
                            </span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-red-600 dark:text-red-400 font-semibold">Déficit:</span>
                            <span className="font-bold text-red-600 dark:text-red-400">
                              ${Number(closingResult.petty_cash_warning.deficit || 0).toLocaleString('es-AR')}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-3 font-semibold">
                          💡 El próximo turno necesitará efectivo adicional para hacer cambios a los clientes.
                          Coordine con el gerente o dueño para agregar fondos antes de la próxima apertura.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* After Hours Warning */}
                {closingResult.after_hours_warning && (
                  <div className="p-4 border-2 border-amber-500 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/30 rounded-sm">
                    <div className="flex items-start gap-3">
                      <AccessTimeIcon sx={{ fontSize: 24 }} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-amber-800 dark:text-amber-300 mb-2">
                          Cierre Fuera de Horario
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          {closingResult.after_hours_warning.message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <button
                onClick={handleFinish}
                className="w-full px-4 py-3 bg-primary-600 text-white font-semibold rounded-sm hover:bg-primary-700 transition-colors"
              >
                Finalizar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CloseSessionModal;
