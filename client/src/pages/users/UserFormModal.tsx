import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch } from '../../store';
import { createUser, updateUser, uploadUserAvatar, deleteUserAvatar } from '../../store/slices/usersSlice';
import { roleService, branchService } from '../../services/api';
import { Button } from '../../components/ui';
import type { User, Role, Branch } from '../../types';
import { MdClose, MdCameraAlt, MdDelete, MdPerson } from 'react-icons/md';

interface UserFormModalProps {
  user: User | null;
  onClose: () => void;
  onSave: () => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ user, onClose, onSave }) => {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url || null);
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    employee_code: user?.employee_code || '',
    email: user?.email || '',
    password: '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    role_id: user?.role_id || '',
    primary_branch_id: user?.primary_branch_id || '',
    pin_code: '',
    language: user?.language || 'es',
    is_active: user?.is_active !== undefined ? user.is_active : true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, branchesRes] = await Promise.all([
          roleService.getAll(),
          branchService.getAll(),
        ]);

        if (rolesRes.success && rolesRes.data) {
          setRoles(rolesRes.data);
        }

        if (branchesRes.success && branchesRes.data) {
          setBranches(branchesRes.data);
        }
      } catch (error) {
        console.error('Error fetching form data:', error);
      }
    };

    fetchData();
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, avatar: 'El archivo debe ser una imagen' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, avatar: 'La imagen no debe superar 5MB' });
      return;
    }

    // Clear previous error
    if (errors.avatar) {
      setErrors({ ...errors, avatar: '' });
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setAvatarPreview(base64);
      setPendingAvatar(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAvatar = async () => {
    if (user?.id && user.avatar_url) {
      setAvatarLoading(true);
      try {
        await dispatch(deleteUserAvatar(user.id)).unwrap();
        setAvatarPreview(null);
        setPendingAvatar(null);
      } catch (error) {
        console.error('Error deleting avatar:', error);
      } finally {
        setAvatarLoading(false);
      }
    } else {
      // Just clear the preview for new users or pending uploads
      setAvatarPreview(null);
      setPendingAvatar(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });

    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!user && !formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (!formData.first_name) {
      newErrors.first_name = 'El nombre es requerido';
    }

    if (!formData.last_name) {
      newErrors.last_name = 'El apellido es requerido';
    }

    if (!formData.role_id) {
      newErrors.role_id = 'El rol es requerido';
    }

    if (formData.pin_code && !/^\d{4,6}$/.test(formData.pin_code)) {
      newErrors.pin_code = 'El PIN debe tener entre 4 y 6 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare data (remove empty optional fields)
      const submitData: any = {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role_id: formData.role_id,
        language: formData.language,
      };

      if (formData.employee_code) submitData.employee_code = formData.employee_code;
      if (formData.phone) submitData.phone = formData.phone;
      if (formData.primary_branch_id) submitData.primary_branch_id = formData.primary_branch_id;
      if (formData.pin_code) submitData.pin_code = formData.pin_code;

      let userId: string;

      if (user) {
        // Update existing user
        submitData.is_active = formData.is_active;
        if (formData.password) {
          submitData.password = formData.password;
        }
        await dispatch(updateUser({ id: user.id, data: submitData })).unwrap();
        userId = user.id;
      } else {
        // Create new user
        submitData.password = formData.password;
        const result = await dispatch(createUser(submitData)).unwrap();
        userId = result.id;
      }

      // Upload avatar if there's a pending one
      if (pendingAvatar && userId) {
        await dispatch(uploadUserAvatar({ id: userId, avatar: pendingAvatar })).unwrap();
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving user:', error);
      // Show API error message to user
      const errorMessage = error?.error || error?.message || 'Error al guardar el usuario';
      setApiError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {user ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* API Error Message */}
          {apiError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-sm">
              <p className="text-sm text-red-700 dark:text-red-300">{apiError}</p>
            </div>
          )}

          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div
                onClick={handleAvatarClick}
                className="w-24 h-24 rounded-sm bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 border-dashed border-gray-300 dark:border-gray-600"
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <MdPerson className="w-12 h-12 text-gray-400" />
                )}
                {avatarLoading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleAvatarClick}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors"
                title="Cambiar avatar"
              >
                <MdCameraAlt className="w-4 h-4" />
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  disabled={avatarLoading}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-danger-500 text-white rounded-full flex items-center justify-center hover:bg-danger-600 transition-colors disabled:opacity-50"
                  title="Eliminar avatar"
                >
                  <MdDelete className="w-3 h-3" />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Haz clic para subir una foto (max 5MB)
            </p>
            {errors.avatar && (
              <p className="text-danger-500 text-sm">{errors.avatar}</p>
            )}
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Código de Empleado
              </label>
              <input
                type="text"
                name="employee_code"
                value={formData.employee_code}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Opcional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email <span className="text-danger-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  errors.email ? 'border-danger-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                placeholder="usuario@ejemplo.com"
              />
              {errors.email && (
                <p className="text-danger-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  errors.first_name ? 'border-danger-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
              />
              {errors.first_name && (
                <p className="text-danger-500 text-sm mt-1">{errors.first_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Apellido <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  errors.last_name ? 'border-danger-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
              />
              {errors.last_name && (
                <p className="text-danger-500 text-sm mt-1">{errors.last_name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Opcional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                PIN de Acceso Rápido
              </label>
              <input
                type="text"
                name="pin_code"
                value={formData.pin_code}
                onChange={handleChange}
                maxLength={6}
                className={`w-full px-3 py-2 border ${
                  errors.pin_code ? 'border-danger-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                placeholder="4-6 dígitos"
              />
              {errors.pin_code && (
                <p className="text-danger-500 text-sm mt-1">{errors.pin_code}</p>
              )}
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contraseña {!user && <span className="text-danger-500">*</span>}
              {user && <span className="text-gray-500 text-xs">(dejar vacío para no cambiar)</span>}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${
                errors.password ? 'border-danger-500' : 'border-gray-300 dark:border-gray-600'
              } rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
              placeholder="Mínimo 8 caracteres"
            />
            {errors.password && (
              <p className="text-danger-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Role and Branch */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rol <span className="text-danger-500">*</span>
              </label>
              <select
                name="role_id"
                value={formData.role_id}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  errors.role_id ? 'border-danger-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
              >
                <option value="">Seleccionar rol...</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              {errors.role_id && (
                <p className="text-danger-500 text-sm mt-1">{errors.role_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sucursal Principal
              </label>
              <select
                name="primary_branch_id"
                value={formData.primary_branch_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Ninguna</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Language and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Idioma
              </label>
              <select
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>

            {user && (
              <div className="flex items-center pt-8">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Usuario activo
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : user ? 'Actualizar' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
