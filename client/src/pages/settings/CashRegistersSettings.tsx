import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { loadRegisters, createRegister, updateRegister } from '../../store/slices/registersSlice';
import { Button, Card, Modal } from '../../components/ui';
import { MdAdd, MdEdit, MdPointOfSale } from 'react-icons/md';
import type { Register } from '../../types';

interface RegisterFormData {
  register_number: string;
  name: string;
}

const initialFormData: RegisterFormData = {
  register_number: '',
  name: '',
};

const CashRegistersSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const { registers, loading } = useAppSelector((state) => state.registers);
  const { currentBranch } = useAppSelector((state) => state.auth);
  const globalLoading = useAppSelector((state) => state.ui.loading);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRegister, setEditingRegister] = useState<Register | null>(null);
  const [formData, setFormData] = useState<RegisterFormData>(initialFormData);
  const [editName, setEditName] = useState('');

  // Load registers when branch changes
  useEffect(() => {
    if (currentBranch?.id) {
      dispatch(loadRegisters(currentBranch.id));
    }
  }, [dispatch, currentBranch?.id]);

  // Calculate next register number
  const getNextRegisterNumber = (): number => {
    if (registers.length === 0) return 1;
    const maxNumber = Math.max(...registers.map((r) => r.register_number || 0));
    return maxNumber + 1;
  };

  // Handle create form change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Open create modal
  const handleOpenCreate = () => {
    const nextNumber = getNextRegisterNumber();
    setFormData({
      register_number: nextNumber.toString(),
      name: `Caja ${nextNumber}`,
    });
    setShowCreateModal(true);
  };

  // Handle create submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentBranch?.id) return;

    const registerNumber = parseInt(formData.register_number);
    if (isNaN(registerNumber) || registerNumber < 1) {
      return;
    }

    const result = await dispatch(createRegister({
      branch_id: currentBranch.id,
      register_number: registerNumber,
      name: formData.name || `Caja ${registerNumber}`,
    }));

    if (createRegister.fulfilled.match(result)) {
      setShowCreateModal(false);
      setFormData(initialFormData);
    }
  };

  // Open edit modal
  const handleOpenEdit = (register: Register) => {
    setEditingRegister(register);
    setEditName(register.name);
    setShowEditModal(true);
  };

  // Handle edit submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingRegister) return;

    const result = await dispatch(updateRegister({
      id: editingRegister.id,
      name: editName,
    }));

    if (updateRegister.fulfilled.match(result)) {
      setShowEditModal(false);
      setEditingRegister(null);
      setEditName('');
    }
  };

  // Handle toggle active
  const handleToggleActive = async (register: Register) => {
    await dispatch(updateRegister({
      id: register.id,
      is_active: !register.is_active,
    }));
  };

  const inputClassName = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent';

  // Show message if no branch selected (user selected "Todas las sucursales")
  if (!currentBranch) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-up duration-normal">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cajas Registradoras
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Administra las cajas registradoras de cada sucursal
          </p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-sm p-6 text-center animate-fade-up duration-light-slow">
          <MdPointOfSale className="w-12 h-12 mx-auto mb-3 text-amber-500" />
          <p className="text-amber-700 dark:text-amber-400 font-medium">
            Selecciona una sucursal para administrar sus cajas registradoras
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-500 mt-2">
            Usa el selector de sucursal en el menu lateral para elegir una sucursal especifica.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-up duration-normal">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Cajas Registradoras
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Administra las cajas registradoras de la sucursal {currentBranch.name}
            </p>
          </div>
          <Button
            onClick={handleOpenCreate}
            icon={<MdAdd className="w-5 h-5" />}
            iconPosition="left"
          >
            Nueva Caja
          </Button>
        </div>
      </div>

      {/* Registers List */}
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md overflow-hidden animate-fade-up duration-light-slow">
        {loading || globalLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-primary-600"></div>
          </div>
        ) : registers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500 dark:text-gray-400">
            <MdPointOfSale className="w-12 h-12 mb-2 opacity-50" />
            <p>No hay cajas registradoras configuradas</p>
            <Button
              variant="ghost"
              onClick={handleOpenCreate}
              className="mt-2"
            >
              Crear primera caja
            </Button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Numero
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Sesion Actual
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {registers.map((register, index) => (
                <tr
                  key={register.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors animate-fade-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MdPointOfSale className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Caja {register.register_number}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {register.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(register)}
                      className={`px-2 py-1 text-xs font-medium rounded-sm transition-colors ${
                        register.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      title={register.is_active ? 'Clic para desactivar' : 'Clic para activar'}
                    >
                      {register.is_active ? 'Activa' : 'Inactiva'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {register.current_session_id ? (
                      <span className="text-amber-600 dark:text-amber-400">
                        Sesion abierta
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">
                        Sin sesion
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(register)}
                      icon={<MdEdit className="w-4 h-4" />}
                      iconPosition="left"
                    >
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 animate-fade-up duration-slow">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          <strong>Nota:</strong> Las cajas registradoras no se pueden eliminar, solo desactivar.
          Una caja desactivada no aparecera como opcion al abrir turno en el POS.
          Si una caja tiene una sesion abierta, no se puede desactivar hasta que se cierre la sesion.
        </p>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nueva Caja Registradora"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Numero de Caja:
            </label>
            <input
              type="number"
              name="register_number"
              value={formData.register_number}
              onChange={handleFormChange}
              min="1"
              required
              className={inputClassName}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre:
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              placeholder="Ej: Caja 1, Caja Principal..."
              maxLength={50}
              className={inputClassName}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowCreateModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={globalLoading}>
              {globalLoading ? 'Creando...' : 'Crear Caja'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Editar ${editingRegister?.name || 'Caja'}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Numero de Caja:
            </label>
            <input
              type="text"
              value={editingRegister?.register_number || ''}
              disabled
              className={`${inputClassName} bg-gray-100 dark:bg-gray-800 cursor-not-allowed`}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              El numero de caja no se puede modificar
            </p>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre:
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Ej: Caja 1, Caja Principal..."
              maxLength={50}
              className={inputClassName}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowEditModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={globalLoading}>
              {globalLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CashRegistersSettings;
