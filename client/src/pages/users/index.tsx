import React, { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchUsers, setFilters } from '../../store/slices/usersSlice';
import { Button } from '../../components/ui';
import UserList from './UserList';
import UserFormModal from './UserFormModal';
import type { User } from '../../types';
import type { PaginationState } from '../../components/ui/Pagination';
import { MdLock, MdAdd } from 'react-icons/md';

const UsersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { users, pagination: reduxPagination, filters } = useAppSelector((state) => state.users);
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const loading = useAppSelector((state) => state.ui.loading);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Map Redux pagination to PaginationState format (handle both naming conventions)
  const pagination: PaginationState = useMemo(() => ({
    page: reduxPagination?.page ?? 1,
    limit: reduxPagination?.limit ?? 20,
    total_items: (reduxPagination as any)?.total_items ?? reduxPagination?.total ?? 0,
    total_pages: (reduxPagination as any)?.total_pages ?? reduxPagination?.pages ?? 0,
  }), [reduxPagination]);

  // Check if user has permission to manage users
  const canManageUsers = currentUser?.role?.can_manage_users || false;

  useEffect(() => {
    dispatch(fetchUsers(filters));
  }, [dispatch, filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setFilters({ ...filters, search: searchTerm, page: 1 }));
  };

  const handleFilterChange = (key: string, value: any) => {
    dispatch(setFilters({ ...filters, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    dispatch(setFilters({ ...filters, page }));
  };

  const handlePageSizeChange = (limit: number) => {
    dispatch(setFilters({ ...filters, limit, page: 1 }));
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsCreateModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setSelectedUser(null);
  };

  const handleUserSaved = () => {
    handleCloseModal();
    dispatch(fetchUsers(filters));
  };

  if (!canManageUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MdLock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            No tienes permisos para gestionar usuarios
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-down duration-normal">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestión de Usuarios
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Administra usuarios, roles y permisos del sistema
          </p>
        </div>
        <Button
          onClick={handleCreateUser}
          icon={<MdAdd className="w-5 h-5" />}
          iconPosition="left"
        >
          Nuevo Usuario
        </Button>
      </div>

      {/* Filters Card */}
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o email..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <Button type="submit" variant="secondary">
              Buscar
            </Button>
            {searchTerm && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSearchTerm('');
                  dispatch(setFilters({ ...filters, search: '', page: 1 }));
                }}
              >
                Limpiar
              </Button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleFilterChange('is_active', undefined)}
              className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                filters.is_active === undefined
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('is_active', true)}
              className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                filters.is_active === true
                  ? 'bg-success-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Activos
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('is_active', false)}
              className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                filters.is_active === false
                  ? 'bg-danger-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Inactivos
            </button>
          </div>
        </form>
      </div>

      {/* User List */}
      <UserList
        users={users}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onEditUser={handleEditUser}
        onRefresh={() => dispatch(fetchUsers(filters))}
        loading={loading}
      />

      {/* Create/Edit Modal */}
      {isCreateModalOpen && (
        <UserFormModal
          user={selectedUser}
          onClose={handleCloseModal}
          onSave={handleUserSaved}
        />
      )}
    </div>
  );
};

export default UsersPage;
