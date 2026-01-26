import React, { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  advancedProductSearch,
  clearSearchResults,
} from '../../store/slices/productsSlice';
import {
  loadSpecies,
  loadVarieties,
  loadProductTypes,
  loadVarietiesBySpecies,
} from '../../store/slices/taxonomySlice';
import { Card, Button, Input } from '../../components/ui';
import { SearchResultsTable } from './SearchResultsTable';
import { MdSearch, MdClear, MdFileDownload } from 'react-icons/md';
import type { UUID } from '../../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdvancedSearchPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { searchResults } = useAppSelector((state) => state.products);
  const { species, varieties, productTypes } = useAppSelector((state) => state.taxonomy);
  const loading = useAppSelector((state) => state.ui.loading);

  // Filter state
  const [filters, setFilters] = useState({
    species_id: '',
    variety_id: '',
    product_type_id: '',
    protein_min: '',
    protein_max: '',
    is_factory_direct: '',
    search: '',
  });

  // Load taxonomy data on mount
  useEffect(() => {
    dispatch(loadSpecies({ is_active: true }));
    dispatch(loadVarieties({ is_active: true }));
    dispatch(loadProductTypes({ is_active: true }));
  }, [dispatch]);

  // Load varieties when species changes
  useEffect(() => {
    if (filters.species_id) {
      dispatch(loadVarietiesBySpecies({ speciesId: filters.species_id, is_active: true }));
    }
  }, [dispatch, filters.species_id]);

  // Handle filter change
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      // Reset variety when species changes
      ...(name === 'species_id' ? { variety_id: '' } : {}),
    }));
  };

  // Handle search
  const handleSearch = useCallback(() => {
    const searchParams: any = {};

    if (filters.species_id) searchParams.species_id = filters.species_id;
    if (filters.variety_id) searchParams.variety_id = filters.variety_id;
    if (filters.product_type_id) searchParams.product_type_id = filters.product_type_id;
    if (filters.protein_min) searchParams.protein_min = parseFloat(filters.protein_min);
    if (filters.protein_max) searchParams.protein_max = parseFloat(filters.protein_max);
    if (filters.is_factory_direct !== '') searchParams.is_factory_direct = filters.is_factory_direct === 'true';
    if (filters.search) searchParams.search = filters.search;

    dispatch(advancedProductSearch(searchParams));
  }, [dispatch, filters]);

  // Handle clear
  const handleClear = () => {
    setFilters({
      species_id: '',
      variety_id: '',
      product_type_id: '',
      protein_min: '',
      protein_max: '',
      is_factory_direct: '',
      search: '',
    });
    dispatch(clearSearchResults());
  };

  // Get varieties for selected species
  const filteredVarieties = filters.species_id
    ? varieties.filter((v) => v.species_id === filters.species_id)
    : varieties;

  // Export to Excel
  const handleExportExcel = () => {
    if (!searchResults?.all_products.length) return;

    const data = searchResults.all_products.map((p) => ({
      'Código': p.sku || '',
      'Producto': p.name,
      'Especie': p.species?.name || '',
      'Variedad': p.variety?.name || '',
      'Tipo': p.product_type?.name || '',
      'Tamaño': p.weight_size || '',
      'Proteína %': p.protein_percent || '',
      'Precio': p.selling_price,
      'Tipo de Marca': p.is_factory_direct ? 'Fábrica Directa' : 'Premium',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    XLSX.writeFile(wb, `busqueda-productos-${timestamp}.xlsx`);
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (!searchResults?.all_products.length) return;

    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString('es-AR');

    // Title
    doc.setFontSize(16);
    doc.text('Búsqueda Avanzada de Productos', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generado: ${timestamp}`, 14, 22);

    // Table data
    const tableData = searchResults.all_products.map((p) => [
      p.sku || '',
      p.name,
      `${p.protein_percent || '-'}%`,
      p.weight_size || '',
      `$${p.selling_price.toLocaleString('es-AR')}`,
      p.is_factory_direct ? 'Fábrica' : 'Premium',
    ]);

    autoTable(doc, {
      head: [['SKU', 'Producto', 'Proteína', 'Tamaño', 'Precio', 'Tipo']],
      body: tableData,
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    const timestampFile = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    doc.save(`busqueda-productos-${timestampFile}.pdf`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-down duration-fast">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white animate-fade-right duration-normal">
            Búsqueda Avanzada de Productos
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 animate-fade-right duration-light-slow">
            Busca productos por especie, variedad, proteína y marca
          </p>
        </div>

        {searchResults && searchResults.count > 0 && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleExportExcel}
              icon={<MdFileDownload className="w-5 h-5" />}
              iconPosition="left"
            >
              Exportar Excel
            </Button>
            <Button
              variant="secondary"
              onClick={handleExportPDF}
              icon={<MdFileDownload className="w-5 h-5" />}
              iconPosition="left"
            >
              Exportar PDF
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card className="p-6 animate-fade-up duration-normal">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Text Search */}
          <div className="lg:col-span-2">
            <Input
              label="Buscar por nombre o SKU"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Ej: Pro Plan, Dog Chow..."
              leftIcon={<MdSearch className="w-5 h-5" />}
            />
          </div>

          {/* Species */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Especie
            </label>
            <select
              name="species_id"
              value={filters.species_id}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Todas</option>
              {species.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Variety */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Variedad
            </label>
            <select
              name="variety_id"
              value={filters.variety_id}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={!filters.species_id}
            >
              <option value="">Todas</option>
              {filteredVarieties.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Producto
            </label>
            <select
              name="product_type_id"
              value={filters.product_type_id}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              {productTypes.map((pt) => (
                <option key={pt.id} value={pt.id}>
                  {pt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Protein Min */}
          <div>
            <Input
              label="Proteína Mínima %"
              name="protein_min"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={filters.protein_min}
              onChange={handleFilterChange}
              placeholder="Ej: 20"
            />
          </div>

          {/* Protein Max */}
          <div>
            <Input
              label="Proteína Máxima %"
              name="protein_max"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={filters.protein_max}
              onChange={handleFilterChange}
              placeholder="Ej: 30"
            />
          </div>

          {/* Factory Direct */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Marca
            </label>
            <select
              name="is_factory_direct"
              value={filters.is_factory_direct}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Todas</option>
              <option value="true">Solo Fábrica Directa</option>
              <option value="false">Solo Premium</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="primary"
            onClick={handleSearch}
            loading={loading}
            icon={<MdSearch className="w-5 h-5" />}
            iconPosition="left"
          >
            Buscar
          </Button>
          <Button
            variant="outline"
            onClick={handleClear}
            icon={<MdClear className="w-5 h-5" />}
            iconPosition="left"
          >
            Limpiar
          </Button>
        </div>
      </Card>

      {/* Results */}
      {searchResults && (
        <Card className="overflow-hidden animate-fade-up duration-light-slow">
          <SearchResultsTable searchResults={searchResults} />
        </Card>
      )}

      {/* No Results */}
      {searchResults && searchResults.count === 0 && (
        <Card className="p-8 text-center animate-fade-up duration-normal">
          <p className="text-gray-500 dark:text-gray-400">
            No se encontraron productos con los filtros seleccionados.
          </p>
        </Card>
      )}
    </div>
  );
};

export default AdvancedSearchPage;
