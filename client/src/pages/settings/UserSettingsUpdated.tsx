import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../store';
// Import the thunks (will be added to authSlice)
import { updateProfile, changePassword } from '../../store/slices/authThunks';

const UserSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const profileData: any = {};
    if (formData.first_name !== user?.first_name) profileData.first_name = formData.first_name;
    if (formData.last_name !== user?.last_name) profileData.last_name = formData.last_name;
    if (formData.email !== user?.email) profileData.email = formData.email;

    if (Object.keys(profileData).length > 0) {
      await dispatch(updateProfile(profileData));
    }
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.new_password !== formData.confirm_password) {
      // This will be handled by the Redux action with toast
      alert('Las contraseñas no coinciden');
      return;
    }

    if (!formData.current_password || !formData.new_password) {
      alert('Por favor complete todos los campos');
      return;
    }

    const result = await dispatch(changePassword({
      currentPassword: formData.current_password,
      newPassword: formData.new_password
    }));

    // Clear password fields on success
    if (changePassword.fulfilled.match(result)) {
      setFormData({
        ...formData,
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-down duration-normal">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 animate-fade-right duration-fast">Información Personal</h2>
        <form onSubmit={handleSubmitProfile} className="space-y-4">
          <div className="flex flex-col animate-fade-left duration-normal">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre:</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col animate-fade-right duration-light-slow">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Apellido:</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col animate-fade-up duration-normal">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-primary-500 text-white rounded-sm hover:bg-primary-600 transition-colors font-medium animate-zoom-in duration-fast"
          >
            Guardar Cambios
          </button>
        </form>
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-up duration-light-slow">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 animate-fade-left duration-fast">Cambiar Contraseña</h2>
        <form onSubmit={handleSubmitPassword} className="space-y-4">
          <div className="flex flex-col animate-fade-right duration-normal">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contraseña Actual:</label>
            <input
              type="password"
              name="current_password"
              value={formData.current_password}
              onChange={handleChange}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col animate-fade-down duration-light-slow">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nueva Contraseña:</label>
            <input
              type="password"
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col animate-fade-left duration-normal">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirmar Nueva Contraseña:</label>
            <input
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-primary-500 text-white rounded-sm hover:bg-primary-600 transition-colors font-medium animate-flip-up duration-normal"
          >
            Cambiar Contraseña
          </button>
        </form>
      </section>
    </div>
  );
};

export default UserSettings;
