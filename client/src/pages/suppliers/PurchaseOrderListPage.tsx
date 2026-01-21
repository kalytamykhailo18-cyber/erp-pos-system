import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { loadPurchaseOrders, loadSuppliers, setCurrentPurchaseOrder } from '../../store/slices/supplierSlice';
import { Card, Button, Input, Pagination } from '../../components/ui';
import type { PaginationState } from '../../components/ui/Pagination';
import { PurchaseOrderFormModal } from './PurchaseOrderFormModal';
import { PurchaseOrderDetailModal } from './PurchaseOrderDetailModal';
import type { PurchaseOrder } from '../../services/api/supplier.service';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export const PurchaseOrderListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { purchaseOrders, suppliers } = useAppSelector((state) => state.supplier);
  const { currentBranch } = useAppSelector((state) => state.auth);
  const loading = useAppSelector((state) => state.ui.loading);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  // Client-side pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    dispatch(loadPurchaseOrders());
    dispatch(loadSuppliers({ is_active: true }));
  }, [dispatch]);

  const handleSearch = () => {
    const filters: any = {};
    if (selectedSupplier) filters.supplier_id = selectedSupplier;
    if (selectedStatus) filters.status = selectedStatus;
    if (currentBranch) filters.branch_id = currentBranch.id;

    dispatch(loadPurchaseOrders(filters));
  };

  const handleCreateNew = () => {
    setSelectedOrder(null);
    setIsFormModalOpen(true);
  };

  const handleViewDetail = (order: PurchaseOrder) => {
    dispatch(setCurrentPurchaseOrder(order));
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setSelectedOrder(null);
    // Reload orders after form closes
    dispatch(loadPurchaseOrders());
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedOrder(null);
    // Reload orders after detail closes
    dispatch(loadPurchaseOrders());
  };

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    const styles: Record<PurchaseOrder['status'], string> = {
      DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      SUBMITTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      PARTIALLY_RECEIVED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      RECEIVED: 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    };

    const labels: Record<PurchaseOrder['status'], string> = {
      DRAFT: 'Borrador',
      SUBMITTED: 'Enviado',
      APPROVED: 'Aprobado',
      PARTIALLY_RECEIVED: 'Parcialmente Recibido',
      RECEIVED: 'Recibido',
      CANCELLED: 'Cancelado',
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter((order) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          order.order_number.toLowerCase().includes(term) ||
          order.supplier?.name.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [purchaseOrders, searchTerm]);

  // Calculate paginated data
  const { paginatedData, pagination } = useMemo(() => {
    const total_items = filteredOrders.length;
    const total_pages = Math.ceil(total_items / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      paginatedData: filteredOrders.slice(startIndex, endIndex),
      pagination: {
        page,
        limit,
        total_items,
        total_pages,
      } as PaginationState,
    };
  }, [filteredOrders, page, limit]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedSupplier, selectedStatus]);

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
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/suppliers')}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ← Volver a Proveedores
              </button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              Órdenes de Compra
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Gestiona las órdenes de compra a proveedores
            </p>
          </div>
          <Button variant="primary" onClick={handleCreateNew}>
            Nueva Orden de Compra
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-4 gap-4">
            <Input
              type="text"
              placeholder="Buscar por número o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Todos los proveedores</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Todos los estados</option>
              <option value="DRAFT">Borrador</option>
              <option value="SUBMITTED">Enviado</option>
              <option value="APPROVED">Aprobado</option>
              <option value="PARTIALLY_RECEIVED">Parcialmente Recibido</option>
              <option value="RECEIVED">Recibido</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
            <Button variant="secondary" onClick={handleSearch}>
              Buscar
            </Button>
          </div>
        </Card>

        {/* Orders Table */}
        <Card className="overflow-hidden relative">
          {loading && (
            <div className="absolute top-4 right-4 z-10">
              <div className="animate-spin rounded-full h-6 w-6 border-4 border-gray-300 border-t-primary-600"></div>
            </div>
          )}
          {!loading && paginatedData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No se encontraron órdenes de compra
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
                        Número
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Proveedor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Sucursal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Fecha Creación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Fecha Esperada
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                        Total
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
                    {paginatedData.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => handleViewDetail(order)}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {order.order_number}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {order.supplier?.name || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {order.branch?.name || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {order.expected_date ? formatDate(order.expected_date) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                          {formatCurrency(order.total_amount)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetail(order);
                            }}
                          >
                            Ver Detalle
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

      {/* Purchase Order Form Modal */}
      <PurchaseOrderFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        order={selectedOrder}
      />

      {/* Purchase Order Detail Modal */}
      {selectedOrder && (
        <PurchaseOrderDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          order={selectedOrder}
        />
      )}
    </>
  );
};

export default PurchaseOrderListPage;
