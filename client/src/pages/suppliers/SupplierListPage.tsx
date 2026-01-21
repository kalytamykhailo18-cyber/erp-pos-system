import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { loadSuppliers } from '../../store/slices/supplierSlice';
import { Card, Button, Input, Pagination } from '../../components/ui';
import type { PaginationState } from '../../components/ui/Pagination';
import { SupplierFormModal } from './SupplierFormModal';
import type { Supplier } from '../../services/api/supplier.service';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export const SupplierListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { suppliers } = useAppSelector((state) => state.supplier);
  const loading = useAppSelector((state) => state.ui.loading);

  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Client-side pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    dispatch(loadSuppliers({ is_active: showActiveOnly }));
  }, [dispatch, showActiveOnly]);

  const handleSearch = () => {
    dispatch(loadSuppliers({ search: searchTerm, is_active: showActiveOnly }));
  };

  const handleCreateNew = () => {
    setEditingSupplier(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsFormModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsFormModalOpen(false);
    setEditingSupplier(null);
    // Reload suppliers after form closes
    dispatch(loadSuppliers({ is_active: showActiveOnly }));
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) =>
      searchTerm
        ? supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.code.toLowerCase().includes(searchTerm.toLowerCase())
        : true
    );
  }, [suppliers, searchTerm]);

  // Calculate paginated data
  const { paginatedData, pagination } = useMemo(() => {
    const total_items = filteredSuppliers.length;
    const total_pages = Math.ceil(total_items / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      paginatedData: filteredSuppliers.slice(startIndex, endIndex),
      pagination: {
        page,
        limit,
        total_items,
        total_pages,
      } as PaginationState,
    };
  }, [filteredSuppliers, page, limit]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, showActiveOnly]);

  // Pagination handlers
  const handlePageChange = (newPage: number) => setPage(newPage);
  const handlePageSizeChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  // Reusable pagination component
  const PaginationNav = () => (
    <Pagination
      pagination={pagination}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      loading={loading}
      variant="extended"
      showPageSize
      pageSizeOptions={PAGE_SIZE_OPTIONS}
    />
  );

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Proveedores
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Gestiona tus proveedores y órdenes de compra
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate('/suppliers/purchase-orders')}
            >
              Ver Órdenes de Compra
            </Button>
            <Button variant="primary" onClick={handleCreateNew}>
              Nuevo Proveedor
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button variant="secondary" onClick={handleSearch}>
              Buscar
            </Button>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="w-4 h-4 text-primary-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Solo activos
              </span>
            </label>
          </div>
        </Card>

        {/* Suppliers Table */}
        <Card className="overflow-hidden relative">
          {loading && (
            <div className="absolute top-4 right-4 z-10">
              <div className="animate-spin rounded-full h-6 w-6 border-4 border-gray-300 border-t-primary-600"></div>
            </div>
          )}
          {!loading && paginatedData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No se encontraron proveedores
            </div>
          ) : (
            <div>
              {/* Top Pagination */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <PaginationNav />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-primary-600 dark:bg-primary-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Contacto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Teléfono
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                        Margen %
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedData.map((supplier) => (
                      <tr
                        key={supplier.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {supplier.code}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {supplier.name}
                            </p>
                            {supplier.legal_name && (
                              <p className="text-xs text-gray-500">{supplier.legal_name}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {supplier.contact_name || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {supplier.email || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {supplier.phone || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                          {supplier.default_margin_percent.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 text-center">
                          {supplier.is_active ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                              Inactivo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEdit(supplier)}
                          >
                            Editar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Pagination */}
              <div className="border-t border-gray-200 dark:border-gray-700">
                <PaginationNav />
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Supplier Form Modal */}
      <SupplierFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseModal}
        supplier={editingSupplier}
      />
    </>
  );
};

export default SupplierListPage;
