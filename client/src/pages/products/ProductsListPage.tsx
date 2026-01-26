import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  loadProducts,
  loadCategories,
  loadUnits,
  createProduct,
  updateProduct,
  deleteProduct,
  setPage,
  setLimit,
} from '../../store/slices/productsSlice';
import {
  loadSpecies,
  loadVarieties,
  loadProductTypes,
} from '../../store/slices/taxonomySlice';
import { Card, Button, Input } from '../../components/ui';
import { ProductsTable } from './ProductsTable';
import { ProductFormModal } from './ProductFormModal';
import type { Product } from '../../types';
import type { ProductFormData } from './ProductFormModal';
import type { PaginationState } from '../../components/ui/Pagination';
import { MdLocalOffer, MdAdd, MdSearch } from 'react-icons/md';

const initialFormData: ProductFormData = {
  name: '',
  sku: '',
  barcode: '',
  description: '',
  category_id: '',
  unit_id: '',
  cost_price: '',
  sell_price: '',
  tax_rate: '21',
  is_tax_included: true,
  protein_percent: '', // CRITICAL: Protein % for pet food products
  is_active: true,
  is_featured: false,
  track_stock: true,
  min_stock: '5',
  initial_stock: '0',
  is_weighable: false,
  scale_plu: '',
  export_to_scale: false,
  tare_weight: '', // PART 13: Tare weight in kg
  // PART 6: Three-level taxonomy
  species_id: '',
  variety_id: '',
  product_type_id: '',
  weight_size: '',
  is_factory_direct: false,
};

const ProductsListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { products, categories, units, pagination: reduxPagination } = useAppSelector((state) => state.products);
  const { species, varieties, productTypes } = useAppSelector((state) => state.taxonomy);
  const loading = useAppSelector((state) => state.ui.loading);

  // Map Redux pagination to PaginationState format
  const pagination: PaginationState = useMemo(() => ({
    page: reduxPagination.page,
    limit: reduxPagination.limit,
    total_items: reduxPagination.total,
    total_pages: reduxPagination.pages,
  }), [reduxPagination]);

  // Local state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);

  // Load categories, units, and taxonomy on mount
  useEffect(() => {
    dispatch(loadCategories());
    dispatch(loadUnits());
    dispatch(loadSpecies({ is_active: true }));
    dispatch(loadVarieties({ is_active: true }));
    dispatch(loadProductTypes({ is_active: true }));
  }, [dispatch]);

  // Load products when pagination or filters change
  useEffect(() => {
    dispatch(loadProducts({
      page: reduxPagination.page,
      limit: reduxPagination.limit,
      search: search || undefined,
      category_id: selectedCategory || undefined,
    }));
  }, [dispatch, reduxPagination.page, reduxPagination.limit, search, selectedCategory]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    dispatch(setPage(page));
  };

  const handlePageSizeChange = (limit: number) => {
    dispatch(setLimit(limit));
  };

  // Handle form changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // Open create modal
  const handleCreate = () => {
    setEditingProduct(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  // Open edit modal
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || '',
      barcode: product.barcode || '',
      description: product.description || '',
      category_id: product.category_id || '',
      unit_id: product.unit_id || '',
      cost_price: product.cost_price?.toString() || '',
      sell_price: product.selling_price?.toString() || '',
      tax_rate: product.tax_rate?.toString() || '21',
      is_tax_included: product.is_tax_included ?? true,
      protein_percent: product.protein_percent?.toString() || '',
      is_active: product.is_active ?? true,
      is_featured: product.is_featured ?? false,
      track_stock: product.track_stock ?? true,
      min_stock: product.minimum_stock?.toString() || '5',
      initial_stock: '0', // Not used when editing
      is_weighable: product.is_weighable ?? false,
      scale_plu: product.scale_plu?.toString() || '',
      export_to_scale: product.export_to_scale ?? false,
      tare_weight: product.tare_weight?.toString() || '', // PART 13: Tare weight
      // PART 6: Three-level taxonomy
      species_id: product.species_id || '',
      variety_id: product.variety_id || '',
      product_type_id: product.product_type_id || '',
      weight_size: product.weight_size || '',
      is_factory_direct: product.is_factory_direct ?? false,
    });
    setShowModal(true);
  };

  // Submit form
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Helper function to format decimal to max 2 decimal places
    const formatDecimal = (value: string): string => {
      if (!value || value === '') return value;
      const num = parseFloat(value);
      if (isNaN(num)) return value;
      return num.toFixed(2);
    };

    // Build payload with proper type handling
    const productData: Record<string, any> = {
      name: formData.name,
    };

    // Optional string fields - only include if non-empty
    if (formData.sku) productData.sku = formData.sku;
    if (formData.barcode) productData.barcode = formData.barcode;
    if (formData.description) productData.description = formData.description;

    // UUID fields - only include if non-empty
    if (formData.category_id) productData.category_id = formData.category_id;
    if (formData.unit_id) productData.unit_id = formData.unit_id;

    // Decimal fields - format to max 2 decimal places, only include if non-empty
    if (formData.cost_price) productData.cost_price = formatDecimal(formData.cost_price);
    if (formData.sell_price) productData.selling_price = formatDecimal(formData.sell_price);
    if (formData.tax_rate) productData.tax_rate = formatDecimal(formData.tax_rate);
    if (formData.min_stock) productData.minimum_stock = formatDecimal(formData.min_stock);
    if (formData.protein_percent) productData.protein_percent = formatDecimal(formData.protein_percent);
    if (formData.tare_weight) productData.tare_weight = formatDecimal(formData.tare_weight);

    // Integer fields - only include if non-empty
    if (formData.scale_plu) productData.scale_plu = parseInt(formData.scale_plu);

    // Boolean fields - always include with explicit boolean values
    productData.is_tax_included = Boolean(formData.is_tax_included);
    productData.is_active = Boolean(formData.is_active);
    productData.is_featured = Boolean(formData.is_featured);
    productData.track_stock = Boolean(formData.track_stock);
    productData.is_weighable = Boolean(formData.is_weighable);
    productData.export_to_scale = Boolean(formData.export_to_scale);
    productData.is_factory_direct = Boolean(formData.is_factory_direct);

    // Taxonomy fields - only include if non-empty
    if (formData.species_id) productData.species_id = formData.species_id;
    if (formData.variety_id) productData.variety_id = formData.variety_id;
    if (formData.product_type_id) productData.product_type_id = formData.product_type_id;
    if (formData.weight_size) productData.weight_size = formData.weight_size;

    // Initial stock only needed for create
    if (!editingProduct && formData.initial_stock) {
      productData.initial_stock = formatDecimal(formData.initial_stock);
    }

    if (editingProduct) {
      const result = await dispatch(updateProduct({
        id: editingProduct.id,
        data: productData,
      }));
      if (updateProduct.fulfilled.match(result)) {
        setShowModal(false);
      }
    } else {
      const result = await dispatch(createProduct(productData));
      if (createProduct.fulfilled.match(result)) {
        setShowModal(false);
      }
    }
  }, [dispatch, editingProduct, formData]);

  // Delete product
  const handleDelete = useCallback(async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      await dispatch(deleteProduct(id));
    }
  }, [dispatch]);

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-down duration-fast">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white animate-fade-right duration-normal">
              Productos
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 animate-fade-right duration-light-slow">
              Gestiona el catálogo de productos
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate('/products/bulk-update')}
              className="animate-zoom-in duration-normal"
              icon={<MdLocalOffer className="w-5 h-5" />}
              iconPosition="left"
            >
              Actualización Masiva
            </Button>

            <Button
              variant="primary"
              onClick={handleCreate}
              className="animate-zoom-in duration-normal"
              icon={<MdAdd className="w-5 h-5" />}
              iconPosition="left"
            >
              Nuevo Producto
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 animate-fade-up duration-normal">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 animate-fade-left duration-fast">
              <Input
                placeholder="Buscar por nombre, SKU o código..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  handlePageChange(1);
                }}
                leftIcon={<MdSearch className="w-5 h-5" />}
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                handlePageChange(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent animate-fade-right duration-fast"
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Products Table */}
        <Card className="overflow-hidden animate-fade-up duration-light-slow">
          <ProductsTable
            products={products}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreate={handleCreate}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </Card>
      </div>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        formData={formData}
        onChange={handleFormChange}
        editingProduct={editingProduct}
        categories={categories}
        units={units}
        loading={loading}
        species={species}
        varieties={varieties}
        productTypes={productTypes}
      />
    </>
  );
};

export default ProductsListPage;
