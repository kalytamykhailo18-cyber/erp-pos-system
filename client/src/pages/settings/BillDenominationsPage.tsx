import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  loadDenominations,
  createDenomination,
  updateDenomination,
  deleteDenomination,
  reorderDenominations,
  setSelectedDenomination
} from '../../store/slices/denominationSlice';
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdArrowUpward,
  MdArrowDownward,
  MdClose,
  MdCheckCircle,
  MdCancel
} from 'react-icons/md';
import type { DenominationConfig, DenominationConfigFormData } from '../../types';

const BillDenominationsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { denominations, loading } = useAppSelector((state) => state.denomination);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<DenominationConfigFormData>({
    value: 0,
    label: '',
    is_active: true,
    display_order: 0
  });

  useEffect(() => {
    // Load all denominations including inactive ones
    dispatch(loadDenominations({ includeInactive: true }));
  }, [dispatch]);

  const handleOpenModal = (denomination?: DenominationConfig) => {
    if (denomination) {
      // Edit mode
      setEditingId(denomination.id);
      setFormData({
        value: parseFloat(denomination.value),
        label: denomination.label,
        is_active: denomination.is_active,
        display_order: denomination.display_order
      });
    } else {
      // Create mode - set display_order to next available
      const maxOrder = denominations.reduce((max, d) => Math.max(max, d.display_order), 0);
      setEditingId(null);
      setFormData({
        value: 0,
        label: '',
        is_active: true,
        display_order: maxOrder + 1
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      value: 0,
      label: '',
      is_active: true,
      display_order: 0
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        // Update existing denomination
        await dispatch(updateDenomination({ id: editingId, data: formData })).unwrap();
      } else {
        // Create new denomination
        await dispatch(createDenomination(formData)).unwrap();
      }
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save denomination:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea desactivar esta denominación? Se mantendrá el historial pero no aparecerá en futuros formularios.')) {
      try {
        await dispatch(deleteDenomination(id)).unwrap();
      } catch (error) {
        console.error('Failed to delete denomination:', error);
      }
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    const reordered = [...denominations];
    const temp = reordered[index];
    reordered[index] = reordered[index - 1];
    reordered[index - 1] = temp;

    // Update display_order for affected denominations
    const updates = reordered.map((d, i) => ({
      id: d.id,
      display_order: i + 1
    }));

    try {
      await dispatch(reorderDenominations(updates)).unwrap();
    } catch (error) {
      console.error('Failed to reorder denominations:', error);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === denominations.length - 1) return;

    const reordered = [...denominations];
    const temp = reordered[index];
    reordered[index] = reordered[index + 1];
    reordered[index + 1] = temp;

    // Update display_order for affected denominations
    const updates = reordered.map((d, i) => ({
      id: d.id,
      display_order: i + 1
    }));

    try {
      await dispatch(reorderDenominations(updates)).unwrap();
    } catch (error) {
      console.error('Failed to reorder denominations:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Denominaciones de Billetes</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Administre las denominaciones de billetes utilizadas en el sistema para el conteo de caja
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-sm hover:bg-primary-700 transition-colors"
          >
            <MdAdd className="w-5 h-5" />
            Agregar Denominación
          </button>
        </div>

        {/* Denominations Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Orden
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Etiqueta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {denominations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No hay denominaciones configuradas
                  </td>
                </tr>
              ) : (
                denominations.map((denomination, index) => (
                  <tr key={denomination.id} className={denomination.is_active ? '' : 'opacity-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-1 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <MdArrowUpward className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === denominations.length - 1}
                          className="p-1 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <MdArrowDownward className="w-4 h-4" />
                        </button>
                        <span className="ml-2">{denomination.display_order}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ${Number(denomination.value).toLocaleString('es-AR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {denomination.label}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {denomination.is_active ? (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <MdCheckCircle className="w-4 h-4" />
                          Activo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                          <MdCancel className="w-4 h-4" />
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(denomination)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-sm"
                          title="Editar"
                        >
                          <MdEdit className="w-5 h-5" />
                        </button>
                        {denomination.is_active && (
                          <button
                            onClick={() => handleDelete(denomination.id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-sm"
                            title="Desactivar"
                          >
                            <MdDelete className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-sm">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Nota:</strong> Las denominaciones inactivas (como $10 y $20 obsoletos) se mantienen para historial
            pero no aparecen en formularios de conteo de caja. Puede agregar nuevas denominaciones cuando se introduzcan
            (por ejemplo, el billete de $50,000).
          </p>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-sm shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingId ? 'Editar Denominación' : 'Nueva Denominación'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                  placeholder="Ej: 50000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Ingrese el valor numérico del billete (ej: 50000 para cincuenta mil pesos)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Etiqueta <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Ej: $50,000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Cómo se mostrará en la interfaz (ej: $50,000)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Orden de visualización <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Números menores aparecen primero (puede reordenar después con las flechas)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Denominación activa (aparece en formularios de conteo)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-sm hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillDenominationsPage;
