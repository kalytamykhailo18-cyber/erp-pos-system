import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchInvoices,
  fetchInvoiceStats,
  retryPendingInvoices,
  setFilters,
  resetFilters,
  setPage,
  setLimit,
} from '../../store/slices/invoicesSlice';
import { Card, Button, Input } from '../../components/ui';
import { MdRefresh, MdSearch } from 'react-icons/md';
import InvoicesList from './InvoicesList';
import InvoiceStatsCards from './InvoiceStatsCards';

const InvoicesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { invoices, stats, pagination, filters, error } = useAppSelector((state) => state.invoices);
  const { currentBranch } = useAppSelector((state) => state.auth);
  const loading = useAppSelector((state) => state.ui.loading);

  const [localFilters, setLocalFilters] = useState({
    search: filters.search || '',
    branch_id: filters.branch_id || '',
    invoice_type: filters.invoice_type || '',
    status: filters.status || '',
    start_date: filters.start_date || '',
    end_date: filters.end_date || '',
  });

  // Load invoices when pagination or filters change
  useEffect(() => {
    dispatch(fetchInvoices({ ...filters, page: pagination.page, limit: pagination.limit }));
  }, [dispatch, filters, pagination.page, pagination.limit]);

  // Load stats when relevant filters change
  useEffect(() => {
    dispatch(fetchInvoiceStats({
      branch_id: filters.branch_id,
      start_date: filters.start_date,
      end_date: filters.end_date,
    }));
  }, [dispatch, filters.branch_id, filters.start_date, filters.end_date]);

  // Handle filter changes
  const handleFilterChange = (name: string, value: string) => {
    setLocalFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Apply filters
  const handleApplyFilters = () => {
    dispatch(setFilters(localFilters));
  };

  // Reset filters
  const handleResetFilters = () => {
    const resetData = {
      search: '',
      branch_id: '',
      invoice_type: '',
      status: '',
      start_date: '',
      end_date: '',
    };
    setLocalFilters(resetData);
    dispatch(resetFilters());
  };

  // Retry pending invoices
  const handleRetryPending = async () => {
    if (window.confirm('¿Reintentar enviar todas las facturas pendientes?')) {
      await dispatch(retryPendingInvoices(currentBranch?.id));
      dispatch(fetchInvoices({ ...filters, page: pagination.page, limit: pagination.limit }));
      dispatch(fetchInvoiceStats({
        branch_id: filters.branch_id,
        start_date: filters.start_date,
        end_date: filters.end_date,
      }));
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    dispatch(setPage(newPage));
  };

  const handlePageSizeChange = (newLimit: number) => {
    dispatch(setLimit(newLimit));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-down duration-fast">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white animate-fade-right duration-normal">
            Facturas Electrónicas
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 animate-fade-right duration-light-slow">
            Gestión de facturación AFIP mediante FactuHoy
          </p>
        </div>

        {stats && stats.pending_count > 0 && (
          <Button
            variant="warning"
            onClick={handleRetryPending}
            disabled={loading}
            className="animate-zoom-in duration-normal"
            icon={<MdRefresh className="w-5 h-5" />}
            iconPosition="left"
          >
            Reintentar Pendientes ({stats.pending_count})
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="animate-fade-up duration-normal">
          <InvoiceStatsCards stats={stats} />
        </div>
      )}

      {/* Filters */}
      <Card className="p-4 animate-fade-up duration-light-slow">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div className="xl:col-span-2 animate-fade-right duration-fast">
              <Input
                placeholder="Buscar por número, CAE o cliente..."
                value={localFilters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                leftIcon={<MdSearch className="w-5 h-5" />}
              />
            </div>

            {/* Invoice Type */}
            <select
              value={localFilters.invoice_type}
              onChange={(e) => handleFilterChange('invoice_type', e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent animate-fade-up duration-fast"
            >
              <option value="">Todos los tipos</option>
              <option value="A">Tipo A</option>
              <option value="B">Tipo B</option>
              <option value="C">Tipo C</option>
              <option value="NC_A">Nota de Crédito A</option>
              <option value="NC_B">Nota de Crédito B</option>
              <option value="NC_C">Nota de Crédito C</option>
            </select>

            {/* Status */}
            <select
              value={localFilters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent animate-fade-up duration-normal"
            >
              <option value="">Todos los estados</option>
              <option value="PENDING">Pendiente</option>
              <option value="ISSUED">Emitida</option>
              <option value="FAILED">Fallida</option>
              <option value="CANCELLED">Cancelada</option>
            </select>

            {/* Start Date */}
            <div className="animate-fade-up duration-light-slow">
              <input
                type="date"
                value={localFilters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Fecha desde"
              />
            </div>

            {/* End Date */}
            <div className="animate-fade-up duration-slow">
              <input
                type="date"
                value={localFilters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Fecha hasta"
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex gap-3 animate-fade-up duration-normal">
            <Button variant="primary" onClick={handleApplyFilters}>
              Aplicar Filtros
            </Button>
            <Button variant="secondary" onClick={handleResetFilters}>
              Limpiar
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-sm p-4 animate-zoom-in duration-fast">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Invoices List */}
      <Card className="overflow-hidden animate-fade-up duration-slow">
        <InvoicesList
          invoices={invoices}
          loading={loading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </Card>
    </div>
  );
};

export default InvoicesPage;
