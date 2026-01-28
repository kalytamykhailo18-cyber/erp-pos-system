import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { loadBranches, createBranch, updateBranch, deactivateBranch } from '../../store/slices/branchesSlice';
import { Button, Card, Modal } from '../../components/ui';
import { MdAdd, MdEdit, MdStore, MdCheck, MdClose } from 'react-icons/md';
import type { Branch } from '../../types';

interface BranchFormData {
  code: string;
  name: string;
  address: string;
  neighborhood: string;
  city: string;
  postal_code: string;
  phone: string;
  email: string;
}

const initialFormData: BranchFormData = {
  code: '',
  name: '',
  address: '',
  neighborhood: '',
  city: '',
  postal_code: '',
  phone: '',
  email: '',
};

const BranchManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { branches, loading: branchesLoading } = useAppSelector((state) => state.branches);
  const globalLoading = useAppSelector((state) => state.ui.loading);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deactivatingBranch, setDeactivatingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<BranchFormData>(initialFormData);

  // Load branches on mount
  useEffect(() => {
    dispatch(loadBranches());
  }, [dispatch]);

  // Handle form change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Open create modal
  const handleOpenCreate = () => {
    setFormData(initialFormData);
    setShowCreateModal(true);
  };

  // Handle create submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim() || !formData.name.trim()) {
      return;
    }

    const result = await dispatch(createBranch({
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      address: formData.address.trim() || undefined,
      neighborhood: formData.neighborhood.trim() || undefined,
      city: formData.city.trim() || undefined,
      postal_code: formData.postal_code.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
    }));

    if (createBranch.fulfilled.match(result)) {
      setShowCreateModal(false);
      setFormData(initialFormData);
    }
  };

  // Open edit modal
  const handleOpenEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      code: branch.code || '',
      name: branch.name || '',
      address: branch.address || '',
      neighborhood: branch.neighborhood || '',
      city: branch.city || '',
      postal_code: branch.postal_code || '',
      phone: branch.phone || '',
      email: branch.email || '',
    });
    setShowEditModal(true);
  };

  // Handle edit submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingBranch || !formData.name.trim()) return;

    const result = await dispatch(updateBranch({
      id: editingBranch.id,
      data: {
        code: formData.code.trim().toUpperCase() || undefined,
        name: formData.name.trim(),
        address: formData.address.trim() || undefined,
        neighborhood: formData.neighborhood.trim() || undefined,
        city: formData.city.trim() || undefined,
        postal_code: formData.postal_code.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
      },
    }));

    if (updateBranch.fulfilled.match(result)) {
      setShowEditModal(false);
      setEditingBranch(null);
      setFormData(initialFormData);
    }
  };

  // Handle toggle active
  const handleToggleActive = async (branch: Branch) => {
    if (branch.is_active) {
      // Show confirmation modal for deactivation
      setDeactivatingBranch(branch);
      setShowDeactivateModal(true);
    } else {
      // Reactivate directly
      await dispatch(updateBranch({
        id: branch.id,
        data: { is_active: true },
      }));
    }
  };

  // Confirm deactivation
  const handleConfirmDeactivate = async () => {
    if (!deactivatingBranch) return;

    await dispatch(deactivateBranch(deactivatingBranch.id));
    setShowDeactivateModal(false);
    setDeactivatingBranch(null);
  };

  const inputClassName = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent';

  const loading = branchesLoading || globalLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-up duration-normal">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestion de Sucursales
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Administra las sucursales del sistema
            </p>
          </div>
          <Button
            onClick={handleOpenCreate}
            icon={<MdAdd className="w-5 h-5" />}
            iconPosition="left"
          >
            Nueva Sucursal
          </Button>
        </div>
      </div>

      {/* Branches List */}
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md overflow-hidden animate-fade-up duration-light-slow">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-primary-600"></div>
          </div>
        ) : branches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500 dark:text-gray-400">
            <MdStore className="w-12 h-12 mb-2 opacity-50" />
            <p>No hay sucursales configuradas</p>
            <Button
              variant="ghost"
              onClick={handleOpenCreate}
              className="mt-2"
            >
              Crear primera sucursal
            </Button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Codigo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Direccion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Telefono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {branches.map((branch, index) => (
                <tr
                  key={branch.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors animate-fade-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
                      {branch.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MdStore className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {branch.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {branch.address || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {branch.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(branch)}
                      className={`px-2 py-1 text-xs font-medium rounded-sm transition-colors ${
                        branch.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      title={branch.is_active ? 'Clic para desactivar' : 'Clic para activar'}
                    >
                      {branch.is_active ? 'Activa' : 'Inactiva'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(branch)}
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
          <strong>Nota:</strong> Las sucursales no se eliminan, solo se desactivan.
          Una sucursal desactivada no aparecera en el selector de sucursales y no podra realizar operaciones.
          Al crear una nueva sucursal, se crea automaticamente una caja registradora (Caja 1).
        </p>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nueva Sucursal"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Codigo *:
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleFormChange}
                placeholder="Ej: SUC1"
                maxLength={10}
                required
                className={`${inputClassName} uppercase`}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Codigo corto unico (max 10 caracteres)
              </p>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre *:
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="Ej: Sucursal Centro"
                maxLength={100}
                required
                className={inputClassName}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Direccion:
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleFormChange}
              placeholder="Ej: Av. Principal 1234"
              maxLength={255}
              className={inputClassName}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Barrio:
              </label>
              <input
                type="text"
                name="neighborhood"
                value={formData.neighborhood}
                onChange={handleFormChange}
                placeholder="Ej: Centro"
                maxLength={100}
                className={inputClassName}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ciudad:
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleFormChange}
                placeholder="Ej: Buenos Aires"
                maxLength={100}
                className={inputClassName}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Codigo Postal:
              </label>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleFormChange}
                placeholder="Ej: C1234ABC"
                maxLength={20}
                className={inputClassName}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Telefono:
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
                placeholder="Ej: 011-1234-5678"
                maxLength={50}
                className={inputClassName}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email:
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleFormChange}
              placeholder="Ej: sucursal@empresa.com"
              maxLength={100}
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
              {globalLoading ? 'Creando...' : 'Crear Sucursal'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Editar ${editingBranch?.name || 'Sucursal'}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Codigo:
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleFormChange}
                placeholder="Ej: SUC1"
                maxLength={10}
                className={`${inputClassName} uppercase`}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre *:
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="Ej: Sucursal Centro"
                maxLength={100}
                required
                className={inputClassName}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Direccion:
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleFormChange}
              placeholder="Ej: Av. Principal 1234"
              maxLength={255}
              className={inputClassName}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Barrio:
              </label>
              <input
                type="text"
                name="neighborhood"
                value={formData.neighborhood}
                onChange={handleFormChange}
                placeholder="Ej: Centro"
                maxLength={100}
                className={inputClassName}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ciudad:
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleFormChange}
                placeholder="Ej: Buenos Aires"
                maxLength={100}
                className={inputClassName}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Codigo Postal:
              </label>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleFormChange}
                placeholder="Ej: C1234ABC"
                maxLength={20}
                className={inputClassName}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Telefono:
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
                placeholder="Ej: 011-1234-5678"
                maxLength={50}
                className={inputClassName}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email:
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleFormChange}
              placeholder="Ej: sucursal@empresa.com"
              maxLength={100}
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

      {/* Deactivate Confirmation Modal */}
      <Modal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        title="Desactivar Sucursal"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            ¿Estas seguro de que deseas desactivar la sucursal <strong>{deactivatingBranch?.name}</strong>?
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Una sucursal desactivada no podra realizar operaciones y no aparecera en los selectores.
            Podras reactivarla en cualquier momento.
          </p>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowDeactivateModal(false)}
              icon={<MdClose className="w-4 h-4" />}
              iconPosition="left"
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDeactivate}
              disabled={globalLoading}
              icon={<MdCheck className="w-4 h-4" />}
              iconPosition="left"
            >
              {globalLoading ? 'Desactivando...' : 'Desactivar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BranchManagement;
