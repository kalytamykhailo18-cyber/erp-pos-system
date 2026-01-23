import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../../store';
import { logout, setCurrentBranch } from '../../store/slices/authSlice';
import { toggleTheme } from '../../store/slices/uiSlice';
import { useNavigation } from '../../hooks';
import { Branch } from '../../types';
import {
  MdDashboard,
  MdPointOfSale,
  MdInventory,
  MdPeople,
  MdAccountBalance,
  MdBarChart,
  MdWarehouse,
  MdCloudUpload,
  MdCardGiftcard,
  MdReceipt,
  MdNotifications,
  MdSettings,
  MdKeyboardArrowDown,
  MdLightMode,
  MdDarkMode,
  MdLogout,
  MdClose,
  MdStore,
  MdChat,
  MdSearch,
  MdLocalShipping,
} from 'react-icons/md';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavigationItem {
  name: string;
  path: string;
  icon: React.ReactElement;
  badge?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const { goTo, currentPath } = useNavigation();
  const { user, availableBranches, currentBranch } = useAppSelector((state) => state.auth);
  const { theme } = useAppSelector((state) => state.ui);

  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const branchDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const canAccessAllBranches = user?.role?.can_view_all_branches;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target as Node)) {
        setBranchDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <MdDashboard className="w-5 h-5" />,
    },
    {
      name: 'Punto de Venta',
      path: '/pos',
      icon: <MdPointOfSale className="w-5 h-5" />,
    },
    {
      name: 'Productos',
      path: '/products',
      icon: <MdInventory className="w-5 h-5" />,
    },
    {
      name: 'Búsqueda Avanzada',
      path: '/products/search',
      icon: <MdSearch className="w-5 h-5" />,
    },
    {
      name: 'Clientes',
      path: '/customers',
      icon: <MdPeople className="w-5 h-5" />,
    },
    {
      name: 'Zonas de Envío',
      path: '/shipping',
      icon: <MdLocalShipping className="w-5 h-5" />,
    },
    {
      name: 'Sesiones de Caja',
      path: '/sessions',
      icon: <MdAccountBalance className="w-5 h-5" />,
    },
    {
      name: 'Reportes',
      path: '/reports',
      icon: <MdBarChart className="w-5 h-5" />,
    },
    {
      name: 'Inventario',
      path: '/stock',
      icon: <MdWarehouse className="w-5 h-5" />,
    },
    {
      name: 'Chat entre Sucursales',
      path: '/chat',
      icon: <MdChat className="w-5 h-5" />,
    },
    {
      name: 'Importar Precios',
      path: '/prices',
      icon: <MdCloudUpload className="w-5 h-5" />,
    },
    {
      name: 'Fidelización',
      path: '/loyalty',
      icon: <MdCardGiftcard className="w-5 h-5" />,
    },
    {
      name: 'Facturas',
      path: '/invoices',
      icon: <MdReceipt className="w-5 h-5" />,
    },
    {
      name: 'Alertas',
      path: '/alerts',
      icon: <MdNotifications className="w-5 h-5" />,
    },
    {
      name: 'Configuración',
      path: '/settings',
      icon: <MdSettings className="w-5 h-5" />,
    },
  ];

  const handleLogout = () => {
    dispatch(logout());
    goTo('/login');
  };

  const handleBranchChange = (branchId: string) => {
    const branch = availableBranches.find((b: Branch) => b.id === branchId);
    if (branch) {
      dispatch(setCurrentBranch(branch));
    }
    setBranchDropdownOpen(false);
  };

  const isActive = (path: string) => {
    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  return (
    <>
      {/* Sidebar Container */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-primary-500/95 dark:bg-primary-600/95
          backdrop-blur-md shadow-2xl flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          top-0 lg:top-16
        `}
      >
        {/* Mobile Header with Close Button */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-primary-600/30 bg-primary-600/50 backdrop-blur-sm">
          <button
            onClick={() => {
              goTo('/dashboard');
              onClose();
            }}
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 bg-white/20 rounded-md flex items-center justify-center backdrop-blur-sm">
              <MdStore className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-white text-lg">POS Multi</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-md"
            aria-label="Close menu"
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        {/* Branch Selector (for owners) */}
        {canAccessAllBranches && availableBranches && availableBranches.length > 1 && (
          <div className="px-4 py-3 border-b border-primary-600/30">
            <div className="relative" ref={branchDropdownRef}>
              <button
                onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm bg-white/10 rounded-md hover:bg-white/20 backdrop-blur-sm"
              >
                <span className="font-medium text-white truncate">
                  {currentBranch?.name || 'Todas las sucursales'}
                </span>
                <MdKeyboardArrowDown
                  className={`w-5 h-5 text-white/70 ${
                    branchDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {branchDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-primary-800/95 rounded-md shadow-2xl border border-primary-600/30 z-20 backdrop-blur-md overflow-hidden">
                  <button
                    onClick={() => handleBranchChange('')}
                    className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10"
                  >
                    Todas las sucursales
                  </button>
                  {availableBranches.map((branch: Branch) => (
                    <button
                      key={branch.id}
                      onClick={() => handleBranchChange(branch.id)}
                      className={`w-full px-4 py-2.5 text-left text-sm ${
                        currentBranch?.id === branch.id
                          ? 'bg-primary-700 text-white font-semibold'
                          : 'text-white/90 hover:bg-white/10'
                      }`}
                    >
                      {branch.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation - Scrollable */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30">
          <div className="space-y-1">
            {navigation.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  goTo(item.path);
                  onClose();
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium
                  ${isActive(item.path)
                    ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                    : 'text-white/90 hover:bg-white/10 hover:text-white'}
                `}
              >
                <span className={isActive(item.path) ? 'text-white' : 'text-white/70'}>
                  {item.icon}
                </span>
                <span className="flex-1 text-left">{item.name}</span>
                {item.badge && item.badge > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-danger-500 rounded-full">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* User Info - Fixed at Bottom */}
        <div className="p-4 border-t border-primary-600/30 bg-primary-600/30 backdrop-blur-sm">
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-white/10"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-white/30 to-white/10 rounded-full flex items-center justify-center backdrop-blur-sm ring-2 ring-white/20">
                <span className="text-white font-bold text-sm">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-white/70 truncate">
                  {user?.role?.name}
                </p>
              </div>
              <MdKeyboardArrowDown
                className={`w-5 h-5 text-white/70 flex-shrink-0 ${
                  userDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {userDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-primary-800/95 rounded-md shadow-2xl border border-primary-600/30 backdrop-blur-md overflow-hidden">
                <button
                  onClick={() => {
                    dispatch(toggleTheme());
                    setUserDropdownOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 flex items-center gap-3"
                >
                  {theme === 'dark' ? (
                    <>
                      <MdLightMode className="w-5 h-5" />
                      <span>Modo Claro</span>
                    </>
                  ) : (
                    <>
                      <MdDarkMode className="w-5 h-5" />
                      <span>Modo Oscuro</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left text-sm text-red-300 hover:bg-red-500/20 hover:text-red-200 flex items-center gap-3"
                >
                  <MdLogout className="w-5 h-5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
