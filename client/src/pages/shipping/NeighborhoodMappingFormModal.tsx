import React from 'react';
import { Modal } from '../../components/ui';
import type { NeighborhoodMappingFormData, ShippingZone } from '../../types';
import { MdInfo } from 'react-icons/md';

interface NeighborhoodMappingFormModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: NeighborhoodMappingFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  zones: ShippingZone[];
  isEditing: boolean;
}

export const NeighborhoodMappingFormModal: React.FC<NeighborhoodMappingFormModalProps> = ({
  show,
  onClose,
  onSubmit,
  formData,
  onChange,
  zones,
  isEditing,
}) => {
  return (
    <Modal
      isOpen={show}
      onClose={onClose}
      title={isEditing ? 'Editar Mapeo de Barrio' : 'Nuevo Mapeo de Barrio'}
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Neighborhood Name */}
        <div className="animate-fade-right duration-fast">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre del Barrio *
          </label>
          <input
            type="text"
            name="neighborhood_name"
            value={formData.neighborhood_name}
            onChange={onChange}
            required
            placeholder="Ej: Villa del Parque"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Shipping Zone */}
        <div className="animate-fade-left duration-fast">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Zona de Envío *
          </label>
          <select
            name="shipping_zone_id"
            value={formData.shipping_zone_id}
            onChange={onChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Seleccionar zona...</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </div>

        {/* Postal Code */}
        <div className="animate-fade-up duration-normal">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Código Postal
          </label>
          <input
            type="text"
            name="postal_code"
            value={formData.postal_code}
            onChange={onChange}
            placeholder="Ej: 1416"
            maxLength={20}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Postal Code Pattern */}
        <div className="animate-fade-down duration-fast">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Patrón de Código Postal
          </label>
          <input
            type="text"
            name="postal_code_pattern"
            value={formData.postal_code_pattern}
            onChange={onChange}
            placeholder="Ej: 1416% (para todos los códigos que empiezan con 1416)"
            maxLength={50}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Usa % como comodín para coincidir con múltiples códigos postales
          </p>
        </div>

        {/* City */}
        <div className="animate-fade-right duration-light-slow">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ciudad
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={onChange}
            placeholder="Ej: Buenos Aires"
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-sm p-4 animate-fade-up duration-normal">
          <div className="flex gap-3">
            <MdInfo className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">Información sobre el mapeo:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>El nombre del barrio se normalizará automáticamente para búsquedas</li>
                <li>Si defines un patrón de código postal, se usará para coincidencias dinámicas</li>
                <li>Los clientes podrán seleccionar el barrio al hacer una compra con envío</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 animate-fade-down duration-normal">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-fast"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-sm hover:bg-primary-700 transition-colors duration-fast"
          >
            {isEditing ? 'Actualizar' : 'Crear'} Mapeo
          </button>
        </div>
      </form>
    </Modal>
  );
};
