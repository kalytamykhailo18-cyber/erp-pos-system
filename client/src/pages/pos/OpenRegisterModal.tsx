import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { openSession } from '../../store/slices/registersSlice';
import { loadRegisters } from '../../store/slices/registersSlice';
import { loadDenominations } from '../../store/slices/denominationSlice';
import { logout } from '../../store/slices/authSlice';
import WarningIcon from '@mui/icons-material/Warning';

interface OpenRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OpenRegisterModal: React.FC<OpenRegisterModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { registers } = useAppSelector((state) => state.registers);
  const { denominations } = useAppSelector((state) => state.denomination);
  const loading = useAppSelector((state) => state.ui.loading);

  // PART 16: Get active denominations sorted by display_order
  const activeDenominations = useMemo(() => {
    return denominations
      .filter((d) => d.is_active)
      .sort((a, b) => a.display_order - b.display_order);
  }, [denominations]);

  const [selectedRegisterId, setSelectedRegisterId] = useState('');
  const [shiftType, setShiftType] = useState<'MORNING' | 'AFTERNOON' | 'FULL_DAY'>('MORNING');
  const [billCounts, setBillCounts] = useState<{ [key: number]: number }>({});
  const [coins, setCoins] = useState('0');
  const [notes, setNotes] = useState('');

  // PART 16: Load denominations and registers when modal opens
  useEffect(() => {
    if (isOpen) {
      dispatch(loadDenominations({ includeInactive: false }));
      if (user?.primary_branch_id) {
        dispatch(loadRegisters(user.primary_branch_id));
      }
    }
  }, [isOpen, user, dispatch]);

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

  // Auto-select first register if only one available
  useEffect(() => {
    if (registers.length === 1 && !selectedRegisterId) {
      setSelectedRegisterId(registers[0].id);
    }
  }, [registers, selectedRegisterId]);

  // Debug logging
  useEffect(() => {
    console.log('=== OpenRegisterModal Debug ===');
    console.log('Modal isOpen:', isOpen);
    console.log('User:', user);
    console.log('User primary_branch_id:', user?.primary_branch_id);
    console.log('Registers loaded:', registers);
    console.log('Registers count:', registers.length);
    console.log('Active denominations:', activeDenominations);
    console.log('Selected register ID:', selectedRegisterId);
    console.log('Loading state:', loading);
  }, [isOpen, user, registers, activeDenominations, selectedRegisterId, loading]);

  // PART 16: Calculate total opening cash from dynamic denominations
  const calculateTotal = (): number => {
    let total = 0;
    activeDenominations.forEach((denom) => {
      const value = parseFloat(denom.value);
      total += value * (billCounts[value] || 0);
    });
    total += parseFloat(coins) || 0;
    return total;
  };

  const openingCash = calculateTotal();
  const pettyCashAmount = Number(user?.primary_branch?.petty_cash_amount) || 100000;
  const isAbovePettyCash = openingCash >= pettyCashAmount;

  const handleBillCountChange = (denomination: number, value: string) => {
    const count = parseInt(value) || 0;
    setBillCounts({
      ...billCounts,
      [denomination]: Math.max(0, count),
    });
  };

  const handleOpenSession = async () => {
    if (!selectedRegisterId) {
      alert('Seleccione una caja registradora');
      return;
    }

    if (!isAbovePettyCash) {
      const confirmed = window.confirm(
        `ADVERTENCIA: El monto inicial ($${openingCash.toLocaleString('es-AR')}) es menor al fondo fijo de $${pettyCashAmount.toLocaleString('es-AR')}.\n\n¿Desea continuar de todos modos?`
      );
      if (!confirmed) return;
    }

    try {
      // PART 16: Dynamically construct opening_denominations object from active denominations
      const opening_denominations: any = {
        coins: parseFloat(coins) || 0,
      };

      activeDenominations.forEach((denom) => {
        const value = parseFloat(denom.value);
        const fieldName = `bills_${Math.floor(value)}`;
        opening_denominations[fieldName] = billCounts[value] || 0;
      });

      await dispatch(openSession({
        register_id: selectedRegisterId,
        shift_type: shiftType,
        opening_cash: openingCash,
        opening_notes: notes,
        opening_denominations,
      })).unwrap();

      // Success - close modal
      onClose();
    } catch (error) {
      // Error handled by slice
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/auth/login');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto m-4">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Abrir Caja Registradora
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Ingrese el desglose de billetes para el monto inicial
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Register Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Caja Registradora <span className="text-red-600">*</span>
            </label>
            {registers.length === 0 && !loading ? (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-sm">
                <p className="text-red-700 dark:text-red-300 font-medium flex items-center gap-2">
                  <WarningIcon /> No hay cajas registradoras disponibles
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                  Sucursal: {user?.primary_branch?.name || 'No asignada'}
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  Por favor contacte al administrador para configurar cajas registradoras en su sucursal.
                </p>
              </div>
            ) : (
              <select
                value={selectedRegisterId}
                onChange={(e) => setSelectedRegisterId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                disabled={loading}
              >
                <option value="">Seleccione caja...</option>
                {registers.map((register) => (
                  <option key={register.id} value={register.id}>
                    Caja #{register.register_number} {register.name && `- ${register.name}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Shift Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Turno <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setShiftType('MORNING')}
                className={`px-4 py-2 rounded-sm border-2 transition-colors ${
                  shiftType === 'MORNING'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                Mañana
              </button>
              <button
                onClick={() => setShiftType('AFTERNOON')}
                className={`px-4 py-2 rounded-sm border-2 transition-colors ${
                  shiftType === 'AFTERNOON'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                Tarde
              </button>
              <button
                onClick={() => setShiftType('FULL_DAY')}
                className={`px-4 py-2 rounded-sm border-2 transition-colors ${
                  shiftType === 'FULL_DAY'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                Día Completo
              </button>
            </div>
          </div>

          {/* Denomination Breakdown */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Desglose de Billetes
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

              {/* Coins and smaller bills */}
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
            </div>
          </div>

          {/* Total Display */}
          <div className={`p-4 rounded-sm ${isAbovePettyCash ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Total Monto Inicial:
              </span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                ${openingCash.toLocaleString('es-AR')}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Fondo Fijo Mínimo:
              </span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                ${pettyCashAmount.toLocaleString('es-AR')}
              </span>
            </div>

            {!isAbovePettyCash && (
              <div className="mt-3 p-3 bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 rounded">
                <div className="flex items-start gap-2">
                  <WarningIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-800 dark:text-amber-300">
                      Advertencia: Monto Inicial Insuficiente
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                      El monto inicial es menor al fondo fijo mínimo. Se recomienda agregar $
                      {(pettyCashAmount - openingCash).toLocaleString('es-AR')} adicionales.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notas (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              placeholder="Observaciones sobre la apertura..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          {registers.length === 0 && !loading ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                No puede abrir caja sin cajas registradoras disponibles.
              </p>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 bg-red-600 text-white font-semibold rounded-sm hover:bg-red-700 transition-colors"
              >
                ← Cerrar Sesión
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={currentSession ? onClose : handleLogout}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 rounded-sm hover:bg-gray-50 dark:hover:bg-gray-500 disabled:opacity-50 transition-colors"
              >
                {currentSession ? 'Cancelar' : '← Cerrar Sesión'}
              </button>
              <button
                onClick={handleOpenSession}
                disabled={!selectedRegisterId || loading}
                className="flex-1 px-4 py-3 bg-primary-600 text-white font-semibold rounded-sm hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Abriendo...' : 'Abrir Caja'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpenRegisterModal;
