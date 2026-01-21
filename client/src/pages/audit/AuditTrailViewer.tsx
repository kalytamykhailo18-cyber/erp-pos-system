import React, { useState, useEffect, useMemo } from 'react';
import { auditService, type AuditLog, type AuditFilters } from '../../services/api/audit.service';
import { useAppDispatch, useAppSelector } from '../../store';
import { showToast } from '../../store/slices/uiSlice';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Card, Pagination } from '../../components/ui';
import type { PaginationState } from '../../components/ui/Pagination';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const AuditTrailViewer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentBranch } = useAppSelector((state) => state.auth);

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [filters, setFilters] = useState<AuditFilters>({
    branch_id: currentBranch?.id,
    page: 1,
    limit: 10
  });
  const [showFilters, setShowFilters] = useState(false);

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filter form state
  const [filterForm, setFilterForm] = useState<AuditFilters>({
    branch_id: currentBranch?.id
  });

  // Calculate pagination state for the Pagination component
  const pagination = useMemo<PaginationState>(() => ({
    page,
    limit,
    total_items: total,
    total_pages: totalPages,
  }), [page, limit, total, totalPages]);

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

  useEffect(() => {
    fetchAuditLogs();
  }, [page, limit, filters]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await auditService.getAuditLogs({
        ...filters,
        page,
        limit
      });

      if (response.success && response.data) {
        setLogs(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotal(response.data.pagination?.total || 0);
      } else {
        dispatch(showToast({
          type: 'error',
          message: 'Error al cargar registros de auditoría'
        }));
      }
    } catch (error) {
      console.error('[AuditTrailViewer] Error fetching logs:', error);
      dispatch(showToast({
        type: 'error',
        message: 'Error al cargar registros de auditoría'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setFilters(filterForm);
    setPage(1);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      branch_id: currentBranch?.id,
      page: 1,
      limit: 10
    };
    setFilterForm(clearedFilters);
    setFilters(clearedFilters);
    setPage(1);
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      CREATE: 'Crear',
      UPDATE: 'Actualizar',
      DELETE: 'Eliminar',
      VOID: 'Anular',
      OPEN: 'Abrir',
      CLOSE: 'Cerrar',
      REOPEN: 'Reabrir',
      LOGIN: 'Iniciar Sesión',
      LOGOUT: 'Cerrar Sesión',
      APPLY_DISCOUNT: 'Aplicar Descuento',
      WITHDRAW: 'Retiro'
    };
    return labels[action] || action;
  };

  const getEntityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SALE: 'Venta',
      REGISTER_SESSION: 'Sesión de Caja',
      PRODUCT: 'Producto',
      CUSTOMER: 'Cliente',
      USER: 'Usuario',
      CASH_WITHDRAWAL: 'Retiro de Efectivo',
      BRANCH: 'Sucursal'
    };
    return labels[type] || type;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      VOID: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      OPEN: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      CLOSE: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      REOPEN: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      LOGIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      LOGOUT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      APPLY_DISCOUNT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    };
    return colors[action] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-md shadow-md p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Registro de Auditoría
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Historial completo de acciones críticas del sistema
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <FilterListIcon className="h-4 w-4" />
              Filtros
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchAuditLogs}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshIcon className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-3">
            <p className="text-sm text-blue-600 dark:text-blue-400">Total Registros</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{total}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-3">
            <p className="text-sm text-green-600 dark:text-green-400">Página Actual</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-300">{page} de {totalPages}</p>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-md shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Filtros de Búsqueda
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Entity Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Entidad
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                value={filterForm.entity_type || ''}
                onChange={(e) => setFilterForm({ ...filterForm, entity_type: e.target.value || undefined })}
              >
                <option value="">Todos</option>
                <option value="SALE">Ventas</option>
                <option value="REGISTER_SESSION">Sesiones de Caja</option>
                <option value="PRODUCT">Productos</option>
                <option value="CUSTOMER">Clientes</option>
                <option value="USER">Usuarios</option>
                <option value="CASH_WITHDRAWAL">Retiros de Efectivo</option>
              </select>
            </div>

            {/* Action Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Acción
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                value={filterForm.action || ''}
                onChange={(e) => setFilterForm({ ...filterForm, action: e.target.value || undefined })}
              >
                <option value="">Todas</option>
                <option value="CREATE">Crear</option>
                <option value="UPDATE">Actualizar</option>
                <option value="DELETE">Eliminar</option>
                <option value="VOID">Anular</option>
                <option value="OPEN">Abrir</option>
                <option value="CLOSE">Cerrar</option>
                <option value="REOPEN">Reabrir</option>
                <option value="APPLY_DISCOUNT">Aplicar Descuento</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha Desde
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                value={filterForm.start_date || ''}
                onChange={(e) => setFilterForm({ ...filterForm, start_date: e.target.value || undefined })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha Hasta
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                value={filterForm.end_date || ''}
                onChange={(e) => setFilterForm({ ...filterForm, end_date: e.target.value || undefined })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" size="sm" onClick={handleClearFilters}>
              Limpiar
            </Button>
            <Button variant="primary" size="sm" onClick={handleApplyFilters} className="flex items-center gap-2">
              <SearchIcon className="h-4 w-4" />
              Aplicar Filtros
            </Button>
          </div>
        </div>
      )}

      {/* Audit Logs Table */}
      <Card className="overflow-hidden relative">
        {loading && (
          <div className="absolute top-4 right-4 z-10">
            <div className="animate-spin rounded-full h-6 w-6 border-4 border-gray-300 border-t-primary-600"></div>
          </div>
        )}
        {!loading && logs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">No hay registros de auditoría</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        ) : (
          <div>
            {/* Top Pagination */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <PaginationNav />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-primary-600 dark:bg-primary-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Fecha/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Acción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Entidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      IP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {log.user ? (
                          <div>
                            <p className="font-medium">{log.user.first_name} {log.user.last_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{log.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">{log.user_email || 'Sistema'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getActionColor(log.action)}`}>
                          {getActionLabel(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {getEntityTypeLabel(log.entity_type)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                        {log.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                        {log.ip_address || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleViewDetails(log)}
                          className="flex items-center gap-1"
                        >
                          <VisibilityIcon className="h-4 w-4" />
                          Ver
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

      {/* Detail Modal */}
      {selectedLog && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedLog(null);
          }}
          title="Detalle del Registro de Auditoría"
          size="lg"
        >
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Fecha/Hora</label>
                <p className="text-sm text-gray-900 dark:text-white">{formatDateTime(selectedLog.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Acción</label>
                <p className="text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getActionColor(selectedLog.action)}`}>
                    {getActionLabel(selectedLog.action)}
                  </span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Usuario</label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {selectedLog.user ? `${selectedLog.user.first_name} ${selectedLog.user.last_name}` : 'Sistema'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{selectedLog.user_email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Sucursal</label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {selectedLog.branch?.name || 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Tipo de Entidad</label>
                <p className="text-sm text-gray-900 dark:text-white">{getEntityTypeLabel(selectedLog.entity_type)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">ID de Entidad</label>
                <p className="text-xs text-gray-700 dark:text-gray-300 font-mono">{selectedLog.entity_id || 'N/A'}</p>
              </div>
            </div>

            {/* Description */}
            {selectedLog.description && (
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Descripción</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedLog.description}</p>
              </div>
            )}

            {/* Technical Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Información Técnica</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">IP:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{selectedLog.ip_address || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">ID Registro:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-mono">{selectedLog.id.substring(0, 8)}...</span>
                </div>
              </div>
              {selectedLog.user_agent && (
                <div className="mt-2">
                  <span className="text-gray-600 dark:text-gray-400">User Agent:</span>
                  <p className="text-gray-900 dark:text-white mt-1 break-all">{selectedLog.user_agent}</p>
                </div>
              )}
            </div>

            {/* Old Values */}
            {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                  Valores Anteriores
                </label>
                <pre className="bg-gray-100 dark:bg-gray-700 rounded-md p-3 text-xs overflow-x-auto">
                  {JSON.stringify(selectedLog.old_values, null, 2)}
                </pre>
              </div>
            )}

            {/* New Values */}
            {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                  Valores Nuevos
                </label>
                <pre className="bg-gray-100 dark:bg-gray-700 rounded-md p-3 text-xs overflow-x-auto">
                  {JSON.stringify(selectedLog.new_values, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AuditTrailViewer;
