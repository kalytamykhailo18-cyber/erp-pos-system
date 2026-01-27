import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../store';
import { updateProfile, changePassword } from '../../store/slices/authSlice';
import { showToast } from '../../store/slices/uiSlice';
import { Button } from '../../components/ui';
import { MdEdit, MdSave, MdClose, MdKey } from 'react-icons/md';

const UserSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [originalFormData, setOriginalFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditProfile = () => {
    setOriginalFormData({
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
    });
    setIsEditingProfile(true);
  };

  const handleCancelProfile = () => {
    setFormData({
      ...formData,
      first_name: originalFormData.first_name,
      last_name: originalFormData.last_name,
      email: originalFormData.email,
    });
    setIsEditingProfile(false);
  };

  const handleSubmitProfile = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();

    const profileData: any = {};
    if (formData.first_name !== user?.first_name) profileData.first_name = formData.first_name;
    if (formData.last_name !== user?.last_name) profileData.last_name = formData.last_name;
    if (formData.email !== user?.email) profileData.email = formData.email;

    if (Object.keys(profileData).length === 0) {
      setIsEditingProfile(false);
      return;
    }

    setSavingProfile(true);

    try {
      await dispatch(updateProfile(profileData)).unwrap();
      setOriginalFormData({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
      });
      setIsEditingProfile(false);
      // Toast is already dispatched by authSlice thunk
    } catch (error) {
      // Error toast is already dispatched by authSlice thunk
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.new_password !== formData.confirm_password) {
      dispatch(showToast({
        type: 'error',
        message: 'Las contrasenas no coinciden',
      }));
      return;
    }

    if (!formData.current_password || !formData.new_password) {
      dispatch(showToast({
        type: 'error',
        message: 'Por favor complete todos los campos',
      }));
      return;
    }

    setSavingPassword(true);

    try {
      const result = await dispatch(changePassword({
        currentPassword: formData.current_password,
        newPassword: formData.new_password
      }));

      // Clear password fields on success
      // Toast is already dispatched by authSlice thunk
      if (changePassword.fulfilled.match(result)) {
        setFormData({
          ...formData,
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      }
    } catch (error) {
      // Error toast is already dispatched by authSlice thunk
    } finally {
      setSavingPassword(false);
    }
  };

  const inputClassName = `px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent`;
  const inputDisabledClassName = `${inputClassName} bg-gray-100 dark:bg-gray-800 cursor-not-allowed`;

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-down duration-normal">
        {/* Header with Edit/Save buttons */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Informacion Personal</h2>
          <div className="flex items-center gap-3">
            {!isEditingProfile ? (
              <Button
                onClick={handleEditProfile}
                variant="secondary"
                icon={<MdEdit className="w-5 h-5" />}
                iconPosition="left"
              >
                Editar
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleCancelProfile}
                  variant="ghost"
                  disabled={savingProfile}
                  icon={<MdClose className="w-5 h-5" />}
                  iconPosition="left"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmitProfile}
                  disabled={savingProfile}
                  icon={savingProfile ? undefined : <MdSave className="w-5 h-5" />}
                  iconPosition="left"
                >
                  {savingProfile ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </span>
                  ) : (
                    'Guardar'
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmitProfile} className="space-y-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre:</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              disabled={!isEditingProfile}
              className={isEditingProfile ? inputClassName : inputDisabledClassName}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Apellido:</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              disabled={!isEditingProfile}
              className={isEditingProfile ? inputClassName : inputDisabledClassName}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!isEditingProfile}
              className={isEditingProfile ? inputClassName : inputDisabledClassName}
            />
          </div>
        </form>
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-up duration-normal">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cambiar Contrasena</h2>
        </div>

        <form onSubmit={handleSubmitPassword} className="space-y-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contrasena Actual:</label>
            <input
              type="password"
              name="current_password"
              value={formData.current_password}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nueva Contrasena:</label>
            <input
              type="password"
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirmar Nueva Contrasena:</label>
            <input
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>
          <div className="pt-2">
            <Button
              type="submit"
              disabled={savingPassword}
              icon={savingPassword ? undefined : <MdKey className="w-5 h-5" />}
              iconPosition="left"
            >
              {savingPassword ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Cambiando...
                </span>
              ) : (
                'Cambiar Contrasena'
              )}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default UserSettings;
