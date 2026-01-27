import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import UserSettings from './settings/UserSettings';

const UserProfilePage: React.FC = () => {
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

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-down duration-fast">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white animate-fade-right duration-normal">Mi Perfil</h1>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Gestiona tu información personal y configuración de cuenta
        </div>
      </div>

      <div className="animate-fade-up duration-normal">
        <UserSettings />
      </div>
    </div>
  );
};

export default UserProfilePage;
