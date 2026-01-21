import React from 'react';
import { Modal } from '../../components/ui';
import type { ShippingZoneFormData } from '../../types';

interface ShippingZoneFormModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: ShippingZoneFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isEditing: boolean;
}

export const ShippingZoneFormModal: React.FC<ShippingZoneFormModalProps> = ({
  show,
  onClose,
  onSubmit,
  formData,
  onChange,
  isEditing,
}) => {
  return (
    <Modal
      isOpen={show}
      onClose={onClose}
      title={isEditing ? 'Editar Zona de Envío' : 'Nueva Zona de Envío'}
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Zone Name */}
        <div className="animate-fade-right duration-fast">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre de la Zona *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={onChange}
            required
            placeholder="Ej: La Tablada / San Justo"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div className="animate-fade-left duration-fast">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descripción
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={onChange}
            rows={2}
            placeholder="Descripción opcional de la zona"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Base Rate */}
        <div className="animate-fade-up duration-normal">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tarifa Base ($) *
          </label>
          <input
            type="number"
            name="base_rate"
            value={formData.base_rate}
            onChange={onChange}
            required
            min="0"
            step="0.01"
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Costo base del envío. Ingrese 0 para envío gratis.
          </p>
        </div>

        {/* Free Shipping Threshold */}
        <div className="animate-fade-down duration-fast">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Envío Gratis Desde ($)
          </label>
          <input
            type="number"
            name="free_shipping_threshold"
            value={formData.free_shipping_threshold || ''}
            onChange={onChange}
            min="0"
            step="0.01"
            placeholder="Ej: 50000"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Monto mínimo de compra para envío gratis (opcional)
          </p>
        </div>

        {/* Weight Surcharge */}
        <div className="animate-fade-right duration-light-slow">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recargo por Peso ($/kg)
          </label>
          <input
            type="number"
            name="weight_surcharge_per_kg"
            value={formData.weight_surcharge_per_kg || ''}
            onChange={onChange}
            min="0"
            step="0.01"
            placeholder="Ej: 100"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Costo adicional por cada kilogramo (opcional)
          </p>
        </div>

        {/* Express Surcharge */}
        <div className="animate-fade-left duration-normal">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recargo Express ($)
          </label>
          <input
            type="number"
            name="express_surcharge"
            value={formData.express_surcharge || ''}
            onChange={onChange}
            min="0"
            step="0.01"
            placeholder="Ej: 2000"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Costo adicional por entrega express (opcional)
          </p>
        </div>

        {/* Estimated Delivery Hours */}
        <div className="animate-fade-up duration-fast">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tiempo Estimado de Entrega (horas)
          </label>
          <input
            type="number"
            name="estimated_delivery_hours"
            value={formData.estimated_delivery_hours || ''}
            onChange={onChange}
            min="1"
            step="1"
            placeholder="24"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Horas estimadas para la entrega estándar
          </p>
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
            {isEditing ? 'Actualizar' : 'Crear'} Zona
          </button>
        </div>
      </form>
    </Modal>
  );
};
