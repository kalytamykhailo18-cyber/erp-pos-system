import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { clearError, loginWithPIN } from '../../store/slices/authSlice';
import { useNavigation } from '../../hooks';
import { Button, Card } from '../../components/ui';
import { userService } from '../../services/api';
import type { User, Branch } from '../../types';
import { MdQrCode2, MdArrowBack, MdBackspace, MdAlternateEmail } from 'react-icons/md';

const PIN_LENGTH = 4;

const PINLoginPageNew: React.FC = () => {
  const dispatch = useAppDispatch();
  const { goTo } = useNavigation();
  const { isAuthenticated, error } = useAppSelector((state) => state.auth);
  const { loading } = useAppSelector((state) => state.ui);

  // Step 1: User Selection
  // Step 2: Branch Selection
  // Step 3: PIN Entry
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [shake, setShake] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      goTo('/pos');
    }
  }, [isAuthenticated, goTo]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await userService.getUsersWithPIN();
        if (response.success && response.data) {
          setAvailableUsers(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setAvailableUsers([]);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      const fetchBranches = async () => {
        try {
          const response = await userService.getBranches(selectedUser.id);
          if (response.success && response.data) {
            setAvailableBranches(response.data);
          }
        } catch (error) {
          console.error('Error fetching branches:', error);
          setAvailableBranches([]);
        }
      };

      fetchBranches();
    }
  }, [selectedUser]);

  useEffect(() => {
    if (error) {
      setShake(true);
      setPin(Array(PIN_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      setTimeout(() => setShake(false), 500);
    }
  }, [error]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  useEffect(() => {
    // Focus first input when reaching PIN step
    if (step === 3) {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setStep(2);
  };

  const handleBranchSelect = (branch: Branch) => {
    setSelectedBranch(branch);
    setStep(3);
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(2);
      setPin(Array(PIN_LENGTH).fill(''));
      dispatch(clearError());
    } else if (step === 2) {
      setStep(1);
      setSelectedUser(null);
      setSelectedBranch(null);
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);

    if (error) {
      dispatch(clearError());
    }

    // Move to next input
    if (value && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit when complete
    if (index === PIN_LENGTH - 1 && value) {
      const completePin = newPin.join('');
      if (completePin.length === PIN_LENGTH) {
        handleSubmitPIN(completePin);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, PIN_LENGTH);
    if (!/^\d+$/.test(pastedData)) return;

    const newPin = [...pin];
    for (let i = 0; i < pastedData.length; i++) {
      newPin[i] = pastedData[i];
    }
    setPin(newPin);

    if (pastedData.length === PIN_LENGTH) {
      handleSubmitPIN(pastedData);
    } else {
      inputRefs.current[pastedData.length]?.focus();
    }
  };

  const handleSubmitPIN = async (pinCode: string) => {
    if (!selectedUser || !selectedBranch) return;

    await dispatch(loginWithPIN({
      user_id: selectedUser.id,
      pin_code: pinCode,
      branch_id: selectedBranch.id,
    }));
  };

  const handleNumpadClick = (num: string) => {
    const emptyIndex = pin.findIndex((p) => !p);
    if (emptyIndex !== -1) {
      handlePinChange(emptyIndex, num);
    }
  };

  const handleBackspace = () => {
    const lastFilledIndex = pin.map((p, i) => (p ? i : -1)).filter((i) => i !== -1).pop();
    if (lastFilledIndex !== undefined) {
      const newPin = [...pin];
      newPin[lastFilledIndex] = '';
      setPin(newPin);
      inputRefs.current[lastFilledIndex]?.focus();
    }
  };

  const handleClear = () => {
    setPin(Array(PIN_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
    dispatch(clearError());
  };

  const handleEmailLogin = () => {
    goTo('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 p-4">
      <div className="w-full max-w-md animate-fade-up duration-normal">
        <Card className="p-8">
          {/* Header */}
          <div className="text-center mb-8 animate-zoom-in duration-fast">
            <div className="w-16 h-16 bg-primary-500 rounded-sm mx-auto mb-4 flex items-center justify-center">
              <MdQrCode2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Ingreso Rápido
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {step === 1 && 'Selecciona tu usuario'}
              {step === 2 && 'Selecciona la sucursal'}
              {step === 3 && 'Ingresa tu PIN de 4 dígitos'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-sm">
              <p className="text-sm text-danger-600 dark:text-danger-400 text-center">{error}</p>
            </div>
          )}

          {/* Step 1: User Selection */}
          {step === 1 && (
            <div className="space-y-3 mb-6">
              {availableUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No hay usuarios disponibles para ingreso con PIN
                  </p>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleEmailLogin}
                  >
                    Ingresar con Email
                  </Button>
                </div>
              ) : (
                availableUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className="w-full p-4 bg-gray-50 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 border-2 border-gray-200 dark:border-gray-600 hover:border-primary-500 rounded-sm transition-all text-left"
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {user.email}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Step 2: Branch Selection */}
          {step === 2 && (
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handleBack}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-500 flex items-center gap-1"
                >
                  <MdArrowBack className="w-4 h-4" />
                  Volver
                </button>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedUser?.first_name} {selectedUser?.last_name}
                </div>
              </div>
              {availableBranches.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No tienes sucursales asignadas
                  </p>
                </div>
              ) : (
                availableBranches.map((branch) => (
                  <button
                    key={branch.id}
                    onClick={() => handleBranchSelect(branch)}
                    className="w-full p-4 bg-gray-50 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 border-2 border-gray-200 dark:border-gray-600 hover:border-primary-500 rounded-sm transition-all text-left"
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {branch.name}
                    </div>
                    {branch.address && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {branch.address}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          {/* Step 3: PIN Input */}
          {step === 3 && (
            <>
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={handleBack}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-500 flex items-center gap-1"
                >
                  <MdArrowBack className="w-4 h-4" />
                  Volver
                </button>
                <div className="text-right text-sm">
                  <div className="text-gray-900 dark:text-white font-semibold">
                    {selectedUser?.first_name} {selectedUser?.last_name}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {selectedBranch?.name}
                  </div>
                </div>
              </div>

              {/* PIN Inputs */}
              <div
                className={`flex justify-center gap-3 mb-8 ${shake ? 'animate-shake' : ''}`}
                onPaste={handlePaste}
              >
                {pin.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`
                      w-14 h-16 text-center text-2xl font-bold
                      bg-gray-50 dark:bg-gray-700
                      border-2 rounded-sm
                      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                      transition-all duration-200
                      ${digit ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-600'}
                      ${error ? 'border-danger-500' : ''}
                    `}
                    disabled={loading}
                  />
                ))}
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-up duration-light-slow">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleNumpadClick(num)}
                    disabled={loading}
                    className="
                      h-14 text-xl font-semibold
                      bg-gray-100 dark:bg-gray-700
                      text-gray-900 dark:text-white
                      rounded-sm
                      hover:bg-gray-200 dark:hover:bg-gray-600
                      active:scale-95
                      transition-all duration-150
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={loading}
                  className="
                    h-14 text-sm font-medium
                    bg-gray-100 dark:bg-gray-700
                    text-gray-600 dark:text-gray-300
                    rounded-sm
                    hover:bg-gray-200 dark:hover:bg-gray-600
                    active:scale-95
                    transition-all duration-150
                  "
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadClick('0')}
                  disabled={loading}
                  className="
                    h-14 text-xl font-semibold
                    bg-gray-100 dark:bg-gray-700
                    text-gray-900 dark:text-white
                    rounded-sm
                    hover:bg-gray-200 dark:hover:bg-gray-600
                    active:scale-95
                    transition-all duration-150
                  "
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  disabled={loading}
                  className="
                    h-14 flex items-center justify-center
                    bg-gray-100 dark:bg-gray-700
                    text-gray-600 dark:text-gray-300
                    rounded-sm
                    hover:bg-gray-200 dark:hover:bg-gray-600
                    active:scale-95
                    transition-all duration-150
                  "
                >
                  <MdBackspace className="w-6 h-6" />
                </button>
              </div>

              {/* Loading indicator */}
              {loading && (
                <div className="flex justify-center mb-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary-600"></div>
                </div>
              )}
            </>
          )}

          {/* Divider */}
          {step === 1 && availableUsers.length > 0 && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    o
                  </span>
                </div>
              </div>

              {/* Email Login Button */}
              <Button
                type="button"
                variant="secondary"
                size="lg"
                fullWidth
                onClick={handleEmailLogin}
                icon={<MdAlternateEmail className="w-5 h-5" />}
                iconPosition="left"
              >
                Ingresar con Email
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PINLoginPageNew;
