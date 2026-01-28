import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../store';
import { logout, setCurrentBranch } from '../../store/slices/authSlice';
import { toggleTheme } from '../../store/slices/uiSlice';
import { useNavigation } from '../../hooks';
import { Branch } from '../../types';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
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
  MdPerson,
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

  // MUI Menu anchor elements (null = closed, element = open)
  const [branchAnchorEl, setBranchAnchorEl] = useState<null | HTMLElement>(null);
  const [userAnchorEl, setUserAnchorEl] = useState<null | HTMLElement>(null);

  const branchMenuOpen = Boolean(branchAnchorEl);
  const userMenuOpen = Boolean(userAnchorEl);

  const canAccessAllBranches = user?.role?.can_view_all_branches;

  const handleBranchMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setBranchAnchorEl(event.currentTarget);
  };

  const handleBranchMenuClose = () => {
    setBranchAnchorEl(null);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserAnchorEl(null);
  };

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
    handleUserMenuClose();
    dispatch(logout());
    goTo('/login');
  };

  const handleBranchChange = (branchId: string) => {
    const branch = availableBranches.find((b: Branch) => b.id === branchId);
    if (branch) {
      dispatch(setCurrentBranch(branch));
    }
    handleBranchMenuClose();
  };

  const isActive = (path: string) => {
    // Exact match - highest priority
    if (currentPath === path) return true;

    // For sub-routes (e.g., /products/search when checking /products)
    // Only highlight parent if NO exact match exists in navigation
    if (currentPath.startsWith(path + '/')) {
      // Check if there's an exact match for currentPath in navigation
      const hasExactMatch = navigation.some(item => item.path === currentPath);

      // If there's an exact match, don't highlight parent routes
      if (hasExactMatch) return false;

      // Otherwise, highlight the parent (e.g., /products when on /products/some-unknown-route)
      return true;
    }

    return false;
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
          <div className="px-4 py-3 border-b border-primary-600/30 bg-primary-700/40">
            <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold mb-1.5 px-1">
              Sucursal Activa
            </p>
            <button
              onClick={handleBranchMenuOpen}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm bg-white/20 border border-white/20 rounded-md hover:bg-white/30 hover:border-white/30 backdrop-blur-sm shadow-sm transition-all"
              aria-controls={branchMenuOpen ? 'branch-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={branchMenuOpen ? 'true' : undefined}
            >
              <MdStore className="w-5 h-5 text-white/80 flex-shrink-0" />
              <span className="font-semibold text-white truncate flex-1 text-left">
                {currentBranch?.name || 'Todas las sucursales'}
              </span>
              <MdKeyboardArrowDown
                className={`w-5 h-5 text-white/70 flex-shrink-0 transition-transform ${
                  branchMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            <Menu
              id="branch-menu"
              anchorEl={branchAnchorEl}
              open={branchMenuOpen}
              onClose={handleBranchMenuClose}
              MenuListProps={{
                'aria-labelledby': 'branch-button',
              }}
              sx={{ zIndex: 9999 }}
              slotProps={{
                paper: {
                  sx: {
                    bgcolor: 'rgb(30 58 138 / 0.95)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgb(37 99 235 / 0.3)',
                    minWidth: 200,
                  },
                },
              }}
            >
              <MenuItem
                onClick={() => handleBranchChange('')}
                sx={{
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              >
                Todas las sucursales
              </MenuItem>
              {availableBranches.map((branch: Branch) => (
                <MenuItem
                  key={branch.id}
                  onClick={() => handleBranchChange(branch.id)}
                  selected={currentBranch?.id === branch.id}
                  sx={{
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                    '&.Mui-selected': {
                      bgcolor: 'rgb(29 78 216)',
                      fontWeight: 600,
                      '&:hover': { bgcolor: 'rgb(29 78 216)' },
                    },
                  }}
                >
                  {branch.name}
                </MenuItem>
              ))}
            </Menu>
          </div>
        )}

        {/* Navigation - Scrollable */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30">
          <div className="space-y-1">
            {navigation.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  console.log('=== SIDEBAR NAVIGATION ===', { path: item.path, name: item.name });
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
          <button
            onClick={handleUserMenuOpen}
            className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-white/10"
            aria-controls={userMenuOpen ? 'user-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={userMenuOpen ? 'true' : undefined}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center backdrop-blur-sm ring-2 ring-white/20 bg-gradient-to-br from-white/30 to-white/10">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={`${user.first_name} ${user.last_name}`}
                  className="w-10 h-10 object-cover"
                />
              ) : (
                <span className="text-white font-bold text-sm">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </span>
              )}
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
              className={`w-5 h-5 text-white/70 flex-shrink-0 transition-transform ${
                userMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          <Menu
            id="user-menu"
            anchorEl={userAnchorEl}
            open={userMenuOpen}
            onClose={handleUserMenuClose}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            MenuListProps={{
              'aria-labelledby': 'user-button',
            }}
            sx={{ zIndex: 9999 }}
            slotProps={{
              paper: {
                sx: {
                  bgcolor: 'rgb(30 58 138 / 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgb(37 99 235 / 0.3)',
                  minWidth: 200,
                },
              },
            }}
          >
            <MenuItem
              onClick={() => {
                handleUserMenuClose();
                goTo('/profile');
              }}
              sx={{
                color: 'white',
                gap: 1.5,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              <MdPerson className="w-5 h-5" />
              <span>Mi Perfil</span>
            </MenuItem>
            <MenuItem
              onClick={() => {
                dispatch(toggleTheme());
                handleUserMenuClose();
              }}
              sx={{
                color: 'white',
                gap: 1.5,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
              }}
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
            </MenuItem>
            <MenuItem
              onClick={handleLogout}
              sx={{
                color: 'rgb(252 165 165)',
                gap: 1.5,
                '&:hover': {
                  bgcolor: 'rgba(239, 68, 68, 0.2)',
                  color: 'rgb(254 202 202)',
                },
              }}
            >
              <MdLogout className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </MenuItem>
          </Menu>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
