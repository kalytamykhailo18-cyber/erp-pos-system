import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import BranchSettings from './BranchSettings';
import SystemSettings from './SystemSettings';
import AlertSettings from './AlertSettings';
import TaxonomySettings from './TaxonomySettings';
import ScaleSettings from './ScaleSettings';
import BillDenominationsPage from './BillDenominationsPage';
import UsersManagement from '../users';

const SettingsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  // Show loading state while user data is being fetched
  if (!user) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-600"></div>
        </div>
      </div>
    );
  }

  const isOwner = user?.role?.name === 'OWNER';
  const isManager = user?.role?.name === 'MANAGER';
  const canManageUsers = user?.role?.can_manage_users || false;

  // Determine default tab based on user permissions
  const getDefaultTab = (): 'branch' | 'system' | 'alerts' | 'taxonomy' | 'scale' | 'denominations' | 'users' => {
    if (isOwner || isManager) return 'branch';
    if (canManageUsers) return 'users';
    return 'branch'; // Fallback
  };

  const [activeTab, setActiveTab] = useState<'branch' | 'system' | 'alerts' | 'taxonomy' | 'scale' | 'denominations' | 'users'>(getDefaultTab());

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-down duration-fast">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white animate-fade-right duration-normal">Configuración</h1>
        {/* Debug info - remove after verification */}
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Usuario: {user.first_name} {user.last_name} | Rol: {user.role?.name} | Permisos: can_manage_users={String(canManageUsers)}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md animate-fade-up duration-normal">
        <div className="flex flex-col sm:flex-row border-b border-gray-200 dark:border-gray-700">
          {(isOwner || isManager) && (
            <button
              className={`px-6 py-3 text-sm font-medium transition-colors animate-fade-up duration-normal ${
                activeTab === 'branch'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab('branch')}
            >
              Sucursal
            </button>
          )}

          {isOwner && (
            <button
              className={`px-6 py-3 text-sm font-medium transition-colors animate-fade-left duration-light-slow ${
                activeTab === 'system'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab('system')}
            >
              Sistema
            </button>
          )}

          {canManageUsers && (
            <button
              className={`px-6 py-3 text-sm font-medium transition-colors animate-fade-up duration-fast ${
                activeTab === 'users'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab('users')}
            >
              Gestión de Usuarios
            </button>
          )}

          {(isOwner || isManager) && (
            <button
              className={`px-6 py-3 text-sm font-medium transition-colors animate-fade-down duration-normal ${
                activeTab === 'alerts'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab('alerts')}
            >
              Alertas
            </button>
          )}

          {isOwner && (
            <button
              className={`px-6 py-3 text-sm font-medium transition-colors animate-fade-up duration-fast ${
                activeTab === 'taxonomy'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab('taxonomy')}
            >
              Taxonomía
            </button>
          )}

          {(isOwner || isManager) && (
            <button
              className={`px-6 py-3 text-sm font-medium transition-colors animate-fade-down duration-normal ${
                activeTab === 'scale'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab('scale')}
            >
              Balanza
            </button>
          )}

          {isOwner && (
            <button
              className={`px-6 py-3 text-sm font-medium transition-colors animate-fade-right duration-fast ${
                activeTab === 'denominations'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab('denominations')}
            >
              Denominaciones
            </button>
          )}
        </div>
      </div>

      <div className="animate-zoom-in duration-normal">
        {activeTab === 'branch' && (isOwner || isManager) && <BranchSettings />}
        {activeTab === 'system' && isOwner && <SystemSettings />}
        {activeTab === 'users' && canManageUsers && <UsersManagement />}
        {activeTab === 'alerts' && (isOwner || isManager) && <AlertSettings />}
        {activeTab === 'taxonomy' && isOwner && <TaxonomySettings />}
        {activeTab === 'scale' && (isOwner || isManager) && <ScaleSettings />}
        {activeTab === 'denominations' && isOwner && <BillDenominationsPage />}
      </div>
    </div>
  );
};

export default SettingsPage;
