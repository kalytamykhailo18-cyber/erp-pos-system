import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  loadExpenses,
  loadCategories,
  loadExpenseStats,
  clearFilters,
  approveExpense,
  rejectExpense,
  markExpenseAsPaid,
  deleteExpense,
  setPage,
  setLimit,
} from '../../store/slices/expenseSlice';
import { Card, Button } from '../../components/ui';
import { ExpenseFormModal } from './ExpenseFormModal';
import { ExpensesTable } from './ExpensesTable';
import { ExpenseStatsCards } from './ExpenseStatsCards';
import type { Expense, ExpenseStatus, UUID } from '../../types';
import type { PaginationState } from '../../components/ui/Pagination';

const ExpensesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { expenses, categories, stats, pagination: reduxPagination } = useAppSelector((state) => state.expense);
  const loading = useAppSelector((state) => state.ui.loading);

  // Map Redux pagination to PaginationState format
  const pagination: PaginationState = useMemo(() => ({
    page: reduxPagination.page,
    limit: reduxPagination.limit,
    total_items: reduxPagination.total,
    total_pages: reduxPagination.pages,
  }), [reduxPagination]);

  // Local state
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingExpenseId, setRejectingExpenseId] = useState<UUID | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Filter state
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<UUID | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Load categories and stats on mount
  useEffect(() => {
    dispatch(loadCategories());
    dispatch(loadExpenseStats());
  }, [dispatch]);

  // Load expenses when pagination or filters change
  useEffect(() => {
    dispatch(loadExpenses({
      page: reduxPagination.page,
      limit: reduxPagination.limit,
      status: statusFilter || undefined,
      category_id: categoryFilter || undefined,
      from_date: dateFrom || undefined,
      to_date: dateTo || undefined,
      search: searchTerm || undefined,
    }));
  }, [dispatch, reduxPagination.page, reduxPagination.limit, statusFilter, categoryFilter, dateFrom, dateTo, searchTerm]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    dispatch(setPage(page));
  };

  const handlePageSizeChange = (limit: number) => {
    dispatch(setLimit(limit));
  };

  // Helper to get current filter params for reloading
  const getCurrentFilterParams = useCallback(() => ({
    page: reduxPagination.page,
    limit: reduxPagination.limit,
    status: statusFilter || undefined,
    category_id: categoryFilter || undefined,
    from_date: dateFrom || undefined,
    to_date: dateTo || undefined,
    search: searchTerm || undefined,
  }), [reduxPagination.page, reduxPagination.limit, statusFilter, categoryFilter, dateFrom, dateTo, searchTerm]);

  // Open create modal
  const handleCreate = () => {
    setEditingExpense(null);
    setShowModal(true);
  };

  // Open edit modal
  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowModal(true);
  };

  // View expense details
  const handleView = (expense: Expense) => {
    setEditingExpense(expense);
    setShowModal(true);
  };

  // Approve expense
  const handleApprove = useCallback(
    async (id: UUID) => {
      if (window.confirm('¿Estás seguro de aprobar este gasto?')) {
        const result = await dispatch(approveExpense(id));
        if (approveExpense.fulfilled.match(result)) {
          dispatch(loadExpenses(getCurrentFilterParams()));
          dispatch(loadExpenseStats());
        }
      }
    },
    [dispatch, getCurrentFilterParams]
  );

  // Reject expense
  const handleRejectClick = (id: UUID) => {
    setRejectingExpenseId(id);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!rejectingExpenseId || !rejectionReason.trim()) return;

      const result = await dispatch(rejectExpense({ id: rejectingExpenseId, reason: rejectionReason }));
      if (rejectExpense.fulfilled.match(result)) {
        setShowRejectModal(false);
        setRejectingExpenseId(null);
        setRejectionReason('');
        dispatch(loadExpenses(getCurrentFilterParams()));
        dispatch(loadExpenseStats());
      }
    },
    [dispatch, rejectingExpenseId, rejectionReason, getCurrentFilterParams]
  );

  // Mark as paid
  const handleMarkAsPaid = useCallback(
    async (id: UUID) => {
      if (window.confirm('¿Estás seguro de marcar este gasto como pagado?')) {
        const result = await dispatch(markExpenseAsPaid({ id }));
        if (markExpenseAsPaid.fulfilled.match(result)) {
          dispatch(loadExpenses(getCurrentFilterParams()));
          dispatch(loadExpenseStats());
        }
      }
    },
    [dispatch, getCurrentFilterParams]
  );

  // Delete expense
  const handleDelete = useCallback(
    async (id: UUID) => {
      if (window.confirm('¿Estás seguro de eliminar este gasto? Esta acción no se puede deshacer.')) {
        const result = await dispatch(deleteExpense(id));
        if (deleteExpense.fulfilled.match(result)) {
          dispatch(loadExpenses(getCurrentFilterParams()));
          dispatch(loadExpenseStats());
        }
      }
    },
    [dispatch, getCurrentFilterParams]
  );

  // Clear all filters
  const handleClearFilters = () => {
    setStatusFilter('');
    setCategoryFilter('');
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
    dispatch(clearFilters());
  };

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-down duration-fast">
          <div className="animate-fade-right duration-normal">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestión de Gastos
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Administra los gastos de tu negocio
            </p>
          </div>

          <Button onClick={handleCreate} variant="primary" className="animate-fade-left duration-fast">
            + Nuevo Gasto
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <ExpenseStatsCards stats={stats} />
        )}

        {/* Filters */}
        <Card className="animate-fade-up duration-normal">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Buscar
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  dispatch(setPage(1));
                }}
                placeholder="Buscar por descripción..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-fast"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as ExpenseStatus | '');
                  dispatch(setPage(1));
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-fast"
              >
                <option value="">Todos los estados</option>
                <option value="PENDING">Pendiente</option>
                <option value="APPROVED">Aprobado</option>
                <option value="PAID">Pagado</option>
                <option value="REJECTED">Rechazado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoría
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  dispatch(setPage(1));
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-fast"
              >
                <option value="">Todas las categorías</option>
                {categories.filter(c => c.is_active).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  dispatch(setPage(1));
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-fast"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  dispatch(setPage(1));
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-fast"
              />
            </div>
          </div>

          {(statusFilter || categoryFilter || dateFrom || dateTo || searchTerm) && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button onClick={handleClearFilters} variant="secondary" size="sm">
                Limpiar Filtros
              </Button>
            </div>
          )}
        </Card>

        {/* Expenses Table */}
        <Card className="animate-fade-up duration-normal">
          <ExpensesTable
            expenses={expenses}
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onView={handleView}
            onEdit={handleEdit}
            onApprove={handleApprove}
            onReject={handleRejectClick}
            onMarkAsPaid={handleMarkAsPaid}
            onDelete={handleDelete}
          />
        </Card>
      </div>

      {/* Form Modal */}
      <ExpenseFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingExpense(null);
        }}
        expense={editingExpense}
      />

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-sm shadow-xl max-w-md w-full animate-fade-up duration-fast">
            <form onSubmit={handleRejectSubmit}>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Rechazar Gasto
                </h2>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Motivo del Rechazo <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                    rows={4}
                    placeholder="Explica el motivo del rechazo..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-fast"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 px-6 py-4 bg-gray-50 dark:bg-gray-900 rounded-b-sm">
                <Button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectingExpenseId(null);
                    setRejectionReason('');
                  }}
                  variant="secondary"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  disabled={!rejectionReason.trim()}
                >
                  Rechazar Gasto
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ExpensesPage;
