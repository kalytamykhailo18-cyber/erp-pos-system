import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchSessions } from '../../store/slices/registersSlice';
import { usePagination } from '../../hooks';
import SessionsList from './SessionsList';
import SessionFilters from './SessionFilters';
import CloseSessionModal from '../pos/CloseSessionModal';

const SessionsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sessions, totalSessions, error, currentSession } = useAppSelector((state) => state.registers);
  const loading = useAppSelector((state) => state.ui.loading);

  const [showCloseModal, setShowCloseModal] = useState(false);

  // Pagination hook
  const {
    pagination,
    setPage,
    setLimit,
    updateFromResponse,
  } = usePagination({ initialPage: 1, initialLimit: 20 });

  const [filters, setFilters] = useState({
    branch_id: '',
    status: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    dispatch(fetchSessions({
      ...filters,
      page: pagination.page,
      limit: pagination.limit,
    }));
  }, [dispatch, filters, pagination.page, pagination.limit]);

  // Update pagination from Redux state
  useEffect(() => {
    if (totalSessions > 0) {
      updateFromResponse({
        page: pagination.page,
        limit: pagination.limit,
        total_items: totalSessions,
        total_pages: Math.ceil(totalSessions / pagination.limit),
      });
    }
  }, [totalSessions, pagination.page, pagination.limit, updateFromResponse]);

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters({ ...filters, ...newFilters });
    setPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-down duration-fast">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white animate-zoom-in duration-normal">Cierres de Caja</h1>

          {currentSession && (
            <button
              onClick={() => setShowCloseModal(true)}
              className="px-6 py-2 bg-red-600 text-white font-semibold rounded-sm hover:bg-red-700 transition-colors"
            >
              Cerrar Turno Actual
            </button>
          )}
        </div>
      </div>

      <div className="animate-fade-right duration-normal">
        <SessionFilters filters={filters} onFilterChange={handleFilterChange} />
      </div>

      {error ? (
        <div className="flex items-center justify-center py-20 animate-fade-up duration-fast">
          <div className="text-lg text-red-600 dark:text-red-400 animate-zoom-out duration-normal">Error: {error}</div>
        </div>
      ) : (
        <div className="animate-fade-up duration-light-slow relative">
          {loading && (
            <div className="absolute top-4 right-4 z-10">
              <div className="animate-spin rounded-full h-6 w-6 border-4 border-gray-300 border-t-primary-600"></div>
            </div>
          )}
          <SessionsList
            sessions={sessions}
            loading={loading}
            pagination={pagination}
            onPageChange={setPage}
            onPageSizeChange={setLimit}
          />
        </div>
      )}

      <CloseSessionModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
      />
    </div>
  );
};

export default SessionsPage;
