import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import {
  loadSpecies,
  loadVarieties,
  loadProductTypes,
  createSpecies,
  updateSpecies,
  deleteSpecies,
  activateSpecies,
  deactivateSpecies,
  createVariety,
  updateVariety,
  deleteVariety,
  activateVariety,
  deactivateVariety,
  createProductType,
  updateProductType,
  deleteProductType,
  activateProductType,
  deactivateProductType,
} from '../../store/slices/taxonomySlice';
import { MdAdd, MdEdit, MdDelete, MdToggleOn, MdToggleOff } from 'react-icons/md';
import type { Species, Variety, ProductType, UUID } from '../../types';

const TaxonomySettings: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { species, varieties, productTypes } = useSelector(
    (state: RootState) => state.taxonomy
  );

  const [activeTab, setActiveTab] = useState<'species' | 'varieties' | 'types'>('species');

  // Species state
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [editingSpecies, setEditingSpecies] = useState<Species | null>(null);
  const [speciesForm, setSpeciesForm] = useState({ name: '', description: '', sort_order: 0 });
  const [speciesErrors, setSpeciesErrors] = useState<{ name?: string; sort_order?: string }>({});

  // Variety state
  const [showVarietyModal, setShowVarietyModal] = useState(false);
  const [editingVariety, setEditingVariety] = useState<Variety | null>(null);
  const [selectedSpeciesForVariety, setSelectedSpeciesForVariety] = useState<UUID | ''>('');
  const [varietyForm, setVarietyForm] = useState({ name: '', description: '', sort_order: 0 });
  const [varietyErrors, setVarietyErrors] = useState<{ name?: string; species_id?: string; sort_order?: string }>({});

  // Product Type state
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingType, setEditingType] = useState<ProductType | null>(null);
  const [typeForm, setTypeForm] = useState({ name: '', description: '', sort_order: 0 });
  const [typeErrors, setTypeErrors] = useState<{ name?: string; sort_order?: string }>({});

  useEffect(() => {
    dispatch(loadSpecies());
    dispatch(loadVarieties());
    dispatch(loadProductTypes());
  }, [dispatch]);

  // ============================================
  // VALIDATION FUNCTIONS
  // ============================================

  const validateSpeciesForm = (): boolean => {
    const errors: typeof speciesErrors = {};

    if (!speciesForm.name || speciesForm.name.trim().length === 0) {
      errors.name = 'El nombre es requerido';
    } else if (speciesForm.name.trim().length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres';
    } else if (speciesForm.name.trim().length > 100) {
      errors.name = 'El nombre no puede exceder 100 caracteres';
    }

    // Check for duplicate names (excluding current if editing)
    const duplicate = species.find(
      (s) =>
        s.name.toLowerCase() === speciesForm.name.trim().toLowerCase() &&
        (!editingSpecies || s.id !== editingSpecies.id)
    );
    if (duplicate) {
      errors.name = 'Ya existe una especie con este nombre';
    }

    if (speciesForm.sort_order < 0 || speciesForm.sort_order > 9999) {
      errors.sort_order = 'El orden debe estar entre 0 y 9999';
    }

    setSpeciesErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateVarietyForm = (): boolean => {
    const errors: typeof varietyErrors = {};

    if (!selectedSpeciesForVariety) {
      errors.species_id = 'Debe seleccionar una especie';
    }

    if (!varietyForm.name || varietyForm.name.trim().length === 0) {
      errors.name = 'El nombre es requerido';
    } else if (varietyForm.name.trim().length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres';
    } else if (varietyForm.name.trim().length > 100) {
      errors.name = 'El nombre no puede exceder 100 caracteres';
    }

    // Check for duplicate names within the same species (excluding current if editing)
    const duplicate = varieties.find(
      (v) =>
        v.species_id === selectedSpeciesForVariety &&
        v.name.toLowerCase() === varietyForm.name.trim().toLowerCase() &&
        (!editingVariety || v.id !== editingVariety.id)
    );
    if (duplicate) {
      errors.name = 'Ya existe una variedad con este nombre para esta especie';
    }

    if (varietyForm.sort_order < 0 || varietyForm.sort_order > 9999) {
      errors.sort_order = 'El orden debe estar entre 0 y 9999';
    }

    setVarietyErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateTypeForm = (): boolean => {
    const errors: typeof typeErrors = {};

    if (!typeForm.name || typeForm.name.trim().length === 0) {
      errors.name = 'El nombre es requerido';
    } else if (typeForm.name.trim().length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres';
    } else if (typeForm.name.trim().length > 100) {
      errors.name = 'El nombre no puede exceder 100 caracteres';
    }

    // Check for duplicate names (excluding current if editing)
    const duplicate = productTypes.find(
      (t) =>
        t.name.toLowerCase() === typeForm.name.trim().toLowerCase() &&
        (!editingType || t.id !== editingType.id)
    );
    if (duplicate) {
      errors.name = 'Ya existe un tipo de producto con este nombre';
    }

    if (typeForm.sort_order < 0 || typeForm.sort_order > 9999) {
      errors.sort_order = 'El orden debe estar entre 0 y 9999';
    }

    setTypeErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ============================================
  // SPECIES HANDLERS
  // ============================================

  const handleCreateSpecies = () => {
    setEditingSpecies(null);
    setSpeciesForm({ name: '', description: '', sort_order: 0 });
    setSpeciesErrors({});
    setShowSpeciesModal(true);
  };

  const handleEditSpecies = (sp: Species) => {
    setEditingSpecies(sp);
    setSpeciesForm({
      name: sp.name,
      description: sp.description || '',
      sort_order: sp.sort_order,
    });
    setSpeciesErrors({});
    setShowSpeciesModal(true);
  };

  const handleSaveSpecies = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSpeciesForm()) {
      return;
    }

    if (editingSpecies) {
      await dispatch(updateSpecies({ id: editingSpecies.id, data: speciesForm }));
    } else {
      await dispatch(createSpecies(speciesForm));
    }
    setShowSpeciesModal(false);
    dispatch(loadSpecies());
  };

  const handleDeleteSpecies = async (id: UUID) => {
    if (window.confirm('¿Estás seguro de eliminar esta especie?')) {
      await dispatch(deleteSpecies(id));
      dispatch(loadSpecies());
    }
  };

  const handleToggleSpecies = async (sp: Species) => {
    if (sp.is_active) {
      await dispatch(deactivateSpecies(sp.id));
    } else {
      await dispatch(activateSpecies(sp.id));
    }
    dispatch(loadSpecies());
  };

  // ============================================
  // VARIETY HANDLERS
  // ============================================

  const handleCreateVariety = () => {
    setEditingVariety(null);
    setVarietyForm({ name: '', description: '', sort_order: 0 });
    setSelectedSpeciesForVariety('');
    setVarietyErrors({});
    setShowVarietyModal(true);
  };

  const handleEditVariety = (variety: Variety) => {
    setEditingVariety(variety);
    setVarietyForm({
      name: variety.name,
      description: variety.description || '',
      sort_order: variety.sort_order,
    });
    setSelectedSpeciesForVariety(variety.species_id);
    setVarietyErrors({});
    setShowVarietyModal(true);
  };

  const handleSaveVariety = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateVarietyForm()) {
      return;
    }

    if (editingVariety) {
      await dispatch(
        updateVariety({
          id: editingVariety.id,
          data: { ...varietyForm, species_id: selectedSpeciesForVariety },
        })
      );
    } else {
      await dispatch(
        createVariety({
          ...varietyForm,
          species_id: selectedSpeciesForVariety,
        })
      );
    }
    setShowVarietyModal(false);
    dispatch(loadVarieties());
  };

  const handleDeleteVariety = async (id: UUID) => {
    if (window.confirm('¿Estás seguro de eliminar esta variedad?')) {
      await dispatch(deleteVariety(id));
      dispatch(loadVarieties());
    }
  };

  const handleToggleVariety = async (variety: Variety) => {
    if (variety.is_active) {
      await dispatch(deactivateVariety(variety.id));
    } else {
      await dispatch(activateVariety(variety.id));
    }
    dispatch(loadVarieties());
  };

  // ============================================
  // PRODUCT TYPE HANDLERS
  // ============================================

  const handleCreateType = () => {
    setEditingType(null);
    setTypeForm({ name: '', description: '', sort_order: 0 });
    setTypeErrors({});
    setShowTypeModal(true);
  };

  const handleEditType = (type: ProductType) => {
    setEditingType(type);
    setTypeForm({
      name: type.name,
      description: type.description || '',
      sort_order: type.sort_order,
    });
    setTypeErrors({});
    setShowTypeModal(true);
  };

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateTypeForm()) {
      return;
    }

    if (editingType) {
      await dispatch(updateProductType({ id: editingType.id, data: typeForm }));
    } else {
      await dispatch(createProductType(typeForm));
    }
    setShowTypeModal(false);
    dispatch(loadProductTypes());
  };

  const handleDeleteType = async (id: UUID) => {
    if (window.confirm('¿Estás seguro de eliminar este tipo de producto?')) {
      await dispatch(deleteProductType(id));
      dispatch(loadProductTypes());
    }
  };

  const handleToggleType = async (type: ProductType) => {
    if (type.is_active) {
      await dispatch(deactivateProductType(type.id));
    } else {
      await dispatch(activateProductType(type.id));
    }
    dispatch(loadProductTypes());
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Gestión de Taxonomía
        </h2>

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'species'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('species')}
          >
            Especies
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'varieties'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('varieties')}
          >
            Variedades
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'types'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('types')}
          >
            Tipos de Producto
          </button>
        </div>

        {/* Species Tab */}
        {activeTab === 'species' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Especies</h3>
              <button
                onClick={handleCreateSpecies}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-sm hover:bg-primary-700 transition-colors"
              >
                <MdAdd size={20} />
                Agregar Especie
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Descripción
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Orden
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {species.map((sp) => (
                    <tr key={sp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {sp.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {sp.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {sp.sort_order}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            sp.is_active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {sp.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleEditSpecies(sp)}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          title="Editar"
                        >
                          <MdEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleSpecies(sp)}
                          className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400"
                          title={sp.is_active ? 'Desactivar' : 'Activar'}
                        >
                          {sp.is_active ? <MdToggleOff size={18} /> : <MdToggleOn size={18} />}
                        </button>
                        <button
                          onClick={() => handleDeleteSpecies(sp.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400"
                          title="Eliminar"
                        >
                          <MdDelete size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Varieties Tab */}
        {activeTab === 'varieties' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Variedades</h3>
              <button
                onClick={handleCreateVariety}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-sm hover:bg-primary-700 transition-colors"
              >
                <MdAdd size={20} />
                Agregar Variedad
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Especie
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Descripción
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Orden
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {varieties.map((variety) => (
                    <tr key={variety.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {variety.species?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {variety.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {variety.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {variety.sort_order}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            variety.is_active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {variety.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleEditVariety(variety)}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          title="Editar"
                        >
                          <MdEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleVariety(variety)}
                          className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400"
                          title={variety.is_active ? 'Desactivar' : 'Activar'}
                        >
                          {variety.is_active ? <MdToggleOff size={18} /> : <MdToggleOn size={18} />}
                        </button>
                        <button
                          onClick={() => handleDeleteVariety(variety.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400"
                          title="Eliminar"
                        >
                          <MdDelete size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Product Types Tab */}
        {activeTab === 'types' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Tipos de Producto
              </h3>
              <button
                onClick={handleCreateType}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-sm hover:bg-primary-700 transition-colors"
              >
                <MdAdd size={20} />
                Agregar Tipo
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Descripción
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Orden
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {productTypes.map((type) => (
                    <tr key={type.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {type.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {type.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {type.sort_order}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            type.is_active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {type.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleEditType(type)}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          title="Editar"
                        >
                          <MdEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleType(type)}
                          className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400"
                          title={type.is_active ? 'Desactivar' : 'Activar'}
                        >
                          {type.is_active ? <MdToggleOff size={18} /> : <MdToggleOn size={18} />}
                        </button>
                        <button
                          onClick={() => handleDeleteType(type.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400"
                          title="Eliminar"
                        >
                          <MdDelete size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Species Modal */}
      {showSpeciesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-sm shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingSpecies ? 'Editar Especie' : 'Agregar Especie'}
            </h3>
            <form onSubmit={handleSaveSpecies} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={speciesForm.name}
                  onChange={(e) => {
                    setSpeciesForm({ ...speciesForm, name: e.target.value });
                    setSpeciesErrors({ ...speciesErrors, name: undefined });
                  }}
                  className={`w-full px-3 py-2 border ${
                    speciesErrors.name
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                  } rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2`}
                />
                {speciesErrors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{speciesErrors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={speciesForm.description}
                  onChange={(e) => setSpeciesForm({ ...speciesForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Orden
                </label>
                <input
                  type="number"
                  min="0"
                  max="9999"
                  value={speciesForm.sort_order}
                  onChange={(e) => {
                    setSpeciesForm({ ...speciesForm, sort_order: parseInt(e.target.value) || 0 });
                    setSpeciesErrors({ ...speciesErrors, sort_order: undefined });
                  }}
                  className={`w-full px-3 py-2 border ${
                    speciesErrors.sort_order
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                  } rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2`}
                />
                {speciesErrors.sort_order && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{speciesErrors.sort_order}</p>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowSpeciesModal(false);
                    setSpeciesErrors({});
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-sm hover:bg-primary-700 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Variety Modal */}
      {showVarietyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-sm shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingVariety ? 'Editar Variedad' : 'Agregar Variedad'}
            </h3>
            <form onSubmit={handleSaveVariety} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Especie *
                </label>
                <select
                  required
                  value={selectedSpeciesForVariety}
                  onChange={(e) => {
                    setSelectedSpeciesForVariety(e.target.value);
                    setVarietyErrors({ ...varietyErrors, species_id: undefined });
                  }}
                  className={`w-full px-3 py-2 border ${
                    varietyErrors.species_id
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                  } rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2`}
                >
                  <option value="">Seleccionar especie...</option>
                  {species.filter((s) => s.is_active).map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.name}
                    </option>
                  ))}
                </select>
                {varietyErrors.species_id && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{varietyErrors.species_id}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={varietyForm.name}
                  onChange={(e) => {
                    setVarietyForm({ ...varietyForm, name: e.target.value });
                    setVarietyErrors({ ...varietyErrors, name: undefined });
                  }}
                  className={`w-full px-3 py-2 border ${
                    varietyErrors.name
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                  } rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2`}
                />
                {varietyErrors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{varietyErrors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={varietyForm.description}
                  onChange={(e) => setVarietyForm({ ...varietyForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Orden
                </label>
                <input
                  type="number"
                  min="0"
                  max="9999"
                  value={varietyForm.sort_order}
                  onChange={(e) => {
                    setVarietyForm({ ...varietyForm, sort_order: parseInt(e.target.value) || 0 });
                    setVarietyErrors({ ...varietyErrors, sort_order: undefined });
                  }}
                  className={`w-full px-3 py-2 border ${
                    varietyErrors.sort_order
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                  } rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2`}
                />
                {varietyErrors.sort_order && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{varietyErrors.sort_order}</p>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowVarietyModal(false);
                    setVarietyErrors({});
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-sm hover:bg-primary-700 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Type Modal */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-sm shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingType ? 'Editar Tipo de Producto' : 'Agregar Tipo de Producto'}
            </h3>
            <form onSubmit={handleSaveType} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={typeForm.name}
                  onChange={(e) => {
                    setTypeForm({ ...typeForm, name: e.target.value });
                    setTypeErrors({ ...typeErrors, name: undefined });
                  }}
                  className={`w-full px-3 py-2 border ${
                    typeErrors.name
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                  } rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2`}
                />
                {typeErrors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{typeErrors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={typeForm.description}
                  onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Orden
                </label>
                <input
                  type="number"
                  min="0"
                  max="9999"
                  value={typeForm.sort_order}
                  onChange={(e) => {
                    setTypeForm({ ...typeForm, sort_order: parseInt(e.target.value) || 0 });
                    setTypeErrors({ ...typeErrors, sort_order: undefined });
                  }}
                  className={`w-full px-3 py-2 border ${
                    typeErrors.sort_order
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                  } rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2`}
                />
                {typeErrors.sort_order && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{typeErrors.sort_order}</p>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowTypeModal(false);
                    setTypeErrors({});
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-sm hover:bg-primary-700 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxonomySettings;
