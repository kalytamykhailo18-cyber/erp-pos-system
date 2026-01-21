import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { login, clearError } from '../../store/slices/authSlice';
import { useNavigation } from '../../hooks';
import { Button, Input, Card } from '../../components/ui';
import { MdStore, MdAlternateEmail, MdLock, MdVisibility, MdVisibilityOff, MdQrCode2 } from 'react-icons/md';

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { goTo } = useNavigation();
  const { isAuthenticated, error } = useAppSelector((state) => state.auth);
  const { loading } = useAppSelector((state) => state.ui);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      goTo('/dashboard');
    }
  }, [isAuthenticated, goTo]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) {
      dispatch(clearError());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(login(formData));
  };

  const handlePINLogin = () => {
    goTo('/pin-login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 p-4">
      <div className="w-full max-w-md animate-fade-up duration-normal">
        <Card className="p-8">
          {/* Logo and Title */}
          <div className="text-center mb-8 animate-zoom-in duration-fast">
            <div className="w-16 h-16 bg-primary-500 rounded-sm mx-auto mb-4 flex items-center justify-center">
              <MdStore className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              POS Multi-Sucursal
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Ingresa a tu cuenta para continuar
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-sm animate-fade-down duration-fast">
              <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-up duration-normal">
            <Input
              label="Correo electrónico"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              required
              autoComplete="email"
              leftIcon={<MdAlternateEmail className="w-5 h-5" />}
            />

            <Input
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              leftIcon={<MdLock className="w-5 h-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <MdVisibilityOff className="w-5 h-5" />
                  ) : (
                    <MdVisibility className="w-5 h-5" />
                  )}
                </button>
              }
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              Iniciar Sesión
            </Button>
          </form>

          {/* Divider */}
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

          {/* PIN Login Button */}
          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            onClick={handlePINLogin}
            icon={<MdQrCode2 className="w-5 h-5" />}
            iconPosition="left"
          >
            Ingresar con PIN
          </Button>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Sistema POS para tiendas de mascotas
          </p>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
