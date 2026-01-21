import { useState, useCallback, useMemo } from 'react';
import type { PaginationState } from '../components/ui/Pagination';

export interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
}

export interface UsePaginationReturn {
  pagination: PaginationState;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setTotalItems: (total: number) => void;
  updateFromResponse: (response: { page: number; limit: number; total_items: number; total_pages: number }) => void;
  resetPagination: () => void;
  paginationParams: { page: number; limit: number };
}

/**
 * Hook for managing pagination state
 * Works with server-side pagination where total_items and total_pages come from API responses
 */
export const usePagination = (options: UsePaginationOptions = {}): UsePaginationReturn => {
  const { initialPage = 1, initialLimit = 20 } = options;

  const [pagination, setPagination] = useState<PaginationState>({
    page: initialPage,
    limit: initialLimit,
    total_items: 0,
    total_pages: 0,
  });

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setPagination((prev) => ({
      ...prev,
      limit,
      page: 1, // Reset to page 1 when limit changes
    }));
  }, []);

  const setTotalItems = useCallback((total_items: number) => {
    setPagination((prev) => ({
      ...prev,
      total_items,
      total_pages: Math.ceil(total_items / prev.limit),
    }));
  }, []);

  const updateFromResponse = useCallback((response: { page: number; limit: number; total_items: number; total_pages: number }) => {
    setPagination({
      page: response.page,
      limit: response.limit,
      total_items: response.total_items,
      total_pages: response.total_pages,
    });
  }, []);

  const resetPagination = useCallback(() => {
    setPagination({
      page: initialPage,
      limit: initialLimit,
      total_items: 0,
      total_pages: 0,
    });
  }, [initialPage, initialLimit]);

  const paginationParams = useMemo(() => ({
    page: pagination.page,
    limit: pagination.limit,
  }), [pagination.page, pagination.limit]);

  return {
    pagination,
    setPagination,
    setPage,
    setLimit,
    setTotalItems,
    updateFromResponse,
    resetPagination,
    paginationParams,
  };
};

export default usePagination;
