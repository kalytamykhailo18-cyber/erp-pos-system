import { useState, useEffect, useCallback, useRef } from 'react';
import type { PaginationState } from '../components/ui/Pagination';
import type { PaginatedResponse } from '../types';

export interface UseServerPaginationOptions<T, F extends Record<string, unknown> = Record<string, unknown>> {
  /** The fetch function that returns paginated data */
  fetchFn: (params: { page: number; limit: number } & F) => Promise<PaginatedResponse<T>>;
  /** Initial page number */
  initialPage?: number;
  /** Initial items per page */
  initialLimit?: number;
  /** Initial filters */
  initialFilters?: F;
  /** Whether to fetch on mount */
  fetchOnMount?: boolean;
  /** Dependencies that trigger a refetch when changed (will reset to page 1) */
  deps?: unknown[];
}

export interface UseServerPaginationReturn<T, F extends Record<string, unknown> = Record<string, unknown>> {
  /** The paginated data */
  data: T[];
  /** Pagination state */
  pagination: PaginationState;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Current filters */
  filters: F;
  /** Set the current page */
  setPage: (page: number) => void;
  /** Set items per page (resets to page 1) */
  setLimit: (limit: number) => void;
  /** Update filters (resets to page 1) */
  setFilters: (filters: F | ((prev: F) => F)) => void;
  /** Manually trigger a refetch */
  refetch: () => Promise<void>;
  /** Reset to initial state and refetch */
  reset: () => void;
}

/**
 * Hook for server-side pagination with data fetching
 * Handles loading states, error handling, and automatic refetching
 */
export function useServerPagination<T, F extends Record<string, unknown> = Record<string, unknown>>(
  options: UseServerPaginationOptions<T, F>
): UseServerPaginationReturn<T, F> {
  const {
    fetchFn,
    initialPage = 1,
    initialLimit = 20,
    initialFilters = {} as F,
    fetchOnMount = true,
    deps = [],
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    page: initialPage,
    limit: initialLimit,
    total_items: 0,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<F>(initialFilters);

  // Track if mounted to prevent state updates after unmount
  const isMounted = useRef(true);
  const isInitialMount = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchData = useCallback(async (page: number, limit: number, currentFilters: F) => {
    if (!isMounted.current) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchFn({ page, limit, ...currentFilters });

      if (!isMounted.current) return;

      if (response.success) {
        setData(response.data);
        setPagination({
          page: response.pagination.page,
          limit: response.pagination.limit,
          total_items: response.pagination.total_items,
          total_pages: response.pagination.total_pages,
        });
      } else {
        setError(response.error || 'Error al cargar los datos');
        setData([]);
      }
    } catch (err) {
      if (!isMounted.current) return;
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      setData([]);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [fetchFn]);

  // Fetch on mount and when pagination/filters change
  useEffect(() => {
    if (fetchOnMount || !isInitialMount.current) {
      fetchData(pagination.page, pagination.limit, filters);
    }
    isInitialMount.current = false;
  }, [pagination.page, pagination.limit, filters, fetchData, fetchOnMount]);

  // Reset to page 1 when deps change
  useEffect(() => {
    if (!isInitialMount.current && deps.length > 0) {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  const setFilters = useCallback((newFilters: F | ((prev: F) => F)) => {
    setFiltersState((prev) => {
      const updated = typeof newFilters === 'function' ? newFilters(prev) : newFilters;
      return updated;
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const refetch = useCallback(async () => {
    await fetchData(pagination.page, pagination.limit, filters);
  }, [fetchData, pagination.page, pagination.limit, filters]);

  const reset = useCallback(() => {
    setFiltersState(initialFilters);
    setPagination({
      page: initialPage,
      limit: initialLimit,
      total_items: 0,
      total_pages: 0,
    });
    setData([]);
    setError(null);
  }, [initialFilters, initialPage, initialLimit]);

  return {
    data,
    pagination,
    loading,
    error,
    filters,
    setPage,
    setLimit,
    setFilters,
    refetch,
    reset,
  };
}

export default useServerPagination;
