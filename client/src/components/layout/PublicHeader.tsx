import React from 'react';
import { useNavigation } from '../../hooks/useNavigation';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LoginIcon from '@mui/icons-material/Login';

const PublicHeader: React.FC = () => {
  const { goTo, goToLogin } = useNavigation();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => goTo('/')}
          >
            <div className="w-10 h-10 bg-primary-600 rounded-sm flex items-center justify-center">
              <StorefrontIcon sx={{ fontSize: 24 }} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Juan POS
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Sistema Multi-Sucursal
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Características
            </a>
            <a
              href="#benefits"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Beneficios
            </a>
            <a
              href="#contact"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Contacto
            </a>
          </nav>

          {/* Login Button */}
          <button
            onClick={goToLogin}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-sm hover:bg-primary-700 transition-colors"
          >
            <LoginIcon sx={{ fontSize: 20 }} />
            <span className="hidden sm:inline">Iniciar Sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;
