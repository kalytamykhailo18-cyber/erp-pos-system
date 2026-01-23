import React from 'react';
import { Modal, Button, Input } from '../../components/ui';
import type { Product, Category, Species, Variety, ProductType } from '../../types';
import { MdStar } from 'react-icons/md';

export interface ProductFormData {
  name: string;
  sku: string;
  barcode: string;
  description: string;
  category_id: string;
  unit_id: string;
  cost_price: string;
  sell_price: string;
  tax_rate: string;
  is_tax_included: boolean;
  protein_percent: string; // CRITICAL: Protein % for pet food products
  is_active: boolean;
  is_featured: boolean;
  track_stock: boolean;
  min_stock: string;
  is_weighable: boolean;
  scale_plu: string;
  export_to_scale: boolean;
  tare_weight: string; // PART 13: Tare weight in kg
  // PART 6: Three-level taxonomy
  species_id: string;
  variety_id: string;
  product_type_id: string;
  weight_size: string;
  is_factory_direct: boolean;
}

export interface UnitOfMeasure {
  id: string;
  code: string;
  name: string;
  is_fractional: boolean;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: ProductFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  editingProduct: Product | null;
  categories: Category[];
  units: UnitOfMeasure[];
  loading: boolean;
  // PART 6: Taxonomy data
  species: Species[];
  varieties: Variety[];
  productTypes: ProductType[];
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onChange,
  editingProduct,
  categories,
  units,
  loading,
  species,
  varieties,
  productTypes,
}) => {
  // Filter varieties based on selected species
  const filteredVarieties = formData.species_id
    ? varieties.filter((v) => v.species_id === formData.species_id && v.is_active)
    : [];
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-6 animate-fade-up duration-normal">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="animate-fade-right duration-very-fast">
            <Input
              label="Nombre *"
              name="name"
              value={formData.name}
              onChange={onChange}
              required
            />
          </div>
          <div className="animate-fade-left duration-very-fast">
            <Input
              label="SKU"
              name="sku"
              value={formData.sku}
              onChange={onChange}
              placeholder="Código interno"
            />
          </div>
          <div className="animate-fade-right duration-fast">
            <Input
              label="Código de Barras"
              name="barcode"
              value={formData.barcode}
              onChange={onChange}
            />
          </div>
          <div className="animate-fade-left duration-fast">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoría
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Sin categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* PART 6: Three-Level Taxonomy */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 animate-fade-up duration-normal">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Taxonomía del Producto (Especie → Variedad → Tipo)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="animate-fade-right duration-fast">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Especie
              </label>
              <select
                name="species_id"
                value={formData.species_id}
                onChange={onChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Seleccionar especie...</option>
                {species.filter((s) => s.is_active).map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Ej: Perro, Gato, Pájaro
              </p>
            </div>
            <div className="animate-fade-up duration-fast">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Variedad
              </label>
              <select
                name="variety_id"
                value={formData.variety_id}
                onChange={onChange}
                disabled={!formData.species_id}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="">Seleccionar variedad...</option>
                {filteredVarieties.map((variety) => (
                  <option key={variety.id} value={variety.id}>
                    {variety.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Ej: Adulto, Cachorro, Senior
              </p>
            </div>
            <div className="animate-fade-left duration-fast">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Producto
              </label>
              <select
                name="product_type_id"
                value={formData.product_type_id}
                onChange={onChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Seleccionar tipo...</option>
                {productTypes.filter((t) => t.is_active).map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Ej: Alimento, Snack, Accesorio
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="animate-fade-right duration-normal">
            <Input
              label="Tamaño/Peso del Paquete"
              name="weight_size"
              value={formData.weight_size}
              onChange={onChange}
              placeholder="Ej: 20 kg, 3 kg, 500 g"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tamaño o peso del paquete para mostrar en la etiqueta
            </p>
          </div>
          <div className="flex items-center animate-fade-left duration-normal">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_factory_direct"
                checked={formData.is_factory_direct}
                onChange={onChange}
                className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Marca Directa de Fábrica
              </span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 ml-6 mt-1">
              Ayuda a recomendar alternativas económicas a marcas premium
            </p>
          </div>
          <div className="animate-fade-right duration-normal">
            <Input
              label="Precio de Costo"
              name="cost_price"
              type="number"
              min="0"
              step="0.01"
              value={formData.cost_price}
              onChange={onChange}
            />
          </div>
          <div className="animate-fade-left duration-normal">
            <Input
              label="Precio de Venta *"
              name="sell_price"
              type="number"
              min="0"
              step="0.01"
              value={formData.sell_price}
              onChange={onChange}
              required
            />
          </div>
          <div className="animate-fade-right duration-light-slow">
            <Input
              label="IVA %"
              name="tax_rate"
              type="number"
              min="0"
              max="100"
              value={formData.tax_rate}
              onChange={onChange}
            />
          </div>
          <div className="animate-fade-left duration-light-slow">
            <Input
              label="% Proteína"
              name="protein_percent"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.protein_percent}
              onChange={onChange}
              placeholder="Ej: 24.5 para 24.5% proteína"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              💡 Importante para alimentos de mascotas. Ayuda a comparar marcas.
            </p>
          </div>
          <div className="animate-fade-right duration-slow">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Unidad de Medida *
            </label>
            <select
              name="unit_id"
              value={formData.unit_id}
              onChange={onChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Seleccionar unidad</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.code})
                </option>
              ))}
            </select>
          </div>
          <div className="animate-zoom-in duration-slow">
            <Input
              label="Stock Mínimo"
              name="min_stock"
              type="number"
              min="0"
              value={formData.min_stock}
              onChange={onChange}
            />
          </div>
        </div>

        <div className="animate-fade-up duration-slow">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descripción
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={onChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap gap-6 animate-flip-up duration-light-slow">
          <label className="flex items-center gap-2 animate-fade-right duration-fast">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={onChange}
              className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Activo</span>
          </label>
          <label className="flex items-center gap-2 animate-fade-down duration-fast">
            <input
              type="checkbox"
              name="is_featured"
              checked={formData.is_featured}
              onChange={onChange}
              className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
              <MdStar className="w-4 h-4 text-primary-500" />
              Acceso Rápido
            </span>
          </label>
          <label className="flex items-center gap-2 animate-fade-left duration-fast">
            <input
              type="checkbox"
              name="track_stock"
              checked={formData.track_stock}
              onChange={onChange}
              className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Controlar Stock</span>
          </label>
          <label className="flex items-center gap-2 animate-fade-up duration-normal">
            <input
              type="checkbox"
              name="is_tax_included"
              checked={formData.is_tax_included}
              onChange={onChange}
              className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">IVA Incluido</span>
          </label>
          <label className="flex items-center gap-2 animate-fade-up duration-normal">
            <input
              type="checkbox"
              name="is_weighable"
              checked={formData.is_weighable}
              onChange={onChange}
              className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Producto Pesable</span>
          </label>
        </div>

        {/* Scale Configuration Section */}
        {formData.is_weighable && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 animate-fade-up duration-fast">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Configuración de Balanza
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="animate-fade-right duration-fast">
                <Input
                  label="Código PLU"
                  name="scale_plu"
                  type="number"
                  min="1"
                  max="99999"
                  value={formData.scale_plu}
                  onChange={onChange}
                  placeholder="Código PLU para balanza (1-99999)"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Código único para identificar el producto en la balanza Kretz Aura
                </p>
              </div>
              <div className="animate-fade-down duration-fast">
                <Input
                  label="Peso de Tara (kg)"
                  name="tare_weight"
                  type="number"
                  min="0"
                  max="10"
                  step="0.001"
                  value={formData.tare_weight || ''}
                  onChange={onChange}
                  placeholder="0.100"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Peso del envase/bolsa a descontar (ej: 0.100 kg = 100g)
                </p>
              </div>
            </div>
            <div className="flex items-center animate-fade-left duration-fast mt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="export_to_scale"
                    checked={formData.export_to_scale}
                    onChange={onChange}
                    className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Exportar a Balanza
                  </span>
                </label>
              </div>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 animate-fade-up duration-very-slow">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onClose}
            className="animate-zoom-in duration-normal"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
            className="animate-zoom-in duration-light-slow"
          >
            {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
