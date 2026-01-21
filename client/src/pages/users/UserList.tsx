import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { deactivateUser, unlockUser, resetUserPassword } from '../../store/slices/usersSlice';
import { Pagination } from '../../components/ui';
import type { PaginationState } from '../../components/ui/Pagination';
import type { User } from '../../types';
import { MdGroup, MdLock, MdEdit, MdLockOpen, MdKey, MdBlock } from 'react-icons/md';

interface UserListProps {
  users: User[];
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (limit: number) => void;
  onEditUser: (user: User) => void;
  onRefresh: () => void;
  loading?: boolean;
}

const UserList: React.FC<UserListProps> = ({
  users,
  pagination,
  onPageChange,
  onPageSizeChange,
  onEditUser,
  onRefresh,
  loading = false,
}) => {
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAppSelector((state) => state.auth);

  const handleDeactivate = async (userId: string) => {
    if (window.confirm('¿Estás seguro de desactivar este usuario?')) {
      await dispatch(deactivateUser(userId));
      onRefresh();
    }
  };

  const handleUnlock = async (userId: string) => {
    await dispatch(unlockUser(userId));
    onRefresh();
  };

  const handleResetPassword = async (userId: string) => {
    const newPassword = window.prompt(
      'Ingresa la nueva contraseña temporal para este usuario:'
    );
    if (newPassword && newPassword.length >= 8) {
      await dispatch(resetUserPassword({ id: userId, newPassword }));
      alert('Contraseña restablecida. El usuario deberá cambiarla en su próximo inicio de sesión.');
    } else if (newPassword) {
      alert('La contraseña debe tener al menos 8 caracteres');
    }
  };

  const isLocked = (user: User) => {
    return user.locked_until && new Date(user.locked_until) > new Date();
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Sucursal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Último Acceso
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="text-gray-500 dark:text-gray-400">
                    <MdGroup className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No se encontraron usuarios</p>
                    <p className="text-sm mt-1">
                      Intenta ajustar los filtros o crea un nuevo usuario
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const locked = isLocked(user);
                const isCurrentUser = user.id === currentUser?.id;

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                          <span className="text-primary-700 dark:text-primary-300 font-semibold">
                            {user.first_name?.charAt(0)}
                            {user.last_name?.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.first_name} {user.last_name}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-primary-600 dark:text-primary-400">
                                (Tú)
                              </span>
                            )}
                          </div>
                          {user.employee_code && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.employee_code}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        {user.role?.name || 'Sin rol'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.primary_branch?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {locked ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-sm bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-300 flex items-center gap-1 w-fit">
                          <MdLock className="w-3 h-3" />
                          Bloqueado
                        </span>
                      ) : user.is_active ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-sm bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-300">
                          Activo
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-sm bg-danger-100 dark:bg-danger-900/30 text-danger-800 dark:text-danger-300">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(user.last_login_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEditUser(user)}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
                          title="Editar"
                        >
                          <MdEdit className="w-5 h-5" />
                        </button>

                        {locked && (
                          <button
                            onClick={() => handleUnlock(user.id)}
                            className="text-warning-600 dark:text-warning-400 hover:text-warning-900 dark:hover:text-warning-300"
                            title="Desbloquear"
                          >
                            <MdLockOpen className="w-5 h-5" />
                          </button>
                        )}

                        {!isCurrentUser && (
                          <>
                            <button
                              onClick={() => handleResetPassword(user.id)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                              title="Restablecer contraseña"
                            >
                              <MdKey className="w-5 h-5" />
                            </button>

                            {user.is_active && (
                              <button
                                onClick={() => handleDeactivate(user.id)}
                                className="text-danger-600 dark:text-danger-400 hover:text-danger-900 dark:hover:text-danger-300"
                                title="Desactivar"
                              >
                                <MdBlock className="w-5 h-5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        loading={loading}
        variant="extended"
        showPageSize
      />
    </div>
  );
};

export default UserList;
