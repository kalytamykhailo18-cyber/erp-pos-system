import React from 'react';
import { Button } from './index';

export interface PaginationState {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

interface PaginationProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  loading?: boolean;
  variant?: 'simple' | 'extended';
  showPageSize?: boolean;
  pageSizeOptions?: number[];
  onPageSizeChange?: (limit: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  pagination,
  onPageChange,
  loading = false,
  variant = 'simple',
  showPageSize = false,
  pageSizeOptions = [10, 20, 50, 100],
  onPageSizeChange,
}) => {
  const { page, limit, total_items, total_pages } = pagination;

  // Don't render if no items at all
  if (total_items === 0) {
    return null;
  }

  // If only 1 page but showPageSize is enabled, still show the component for page size selection
  const showNavigation = total_pages > 1;

  const handlePreviousPage = () => {
    if (page > 1 && !loading) {
      onPageChange(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < total_pages && !loading) {
      onPageChange(page + 1);
    }
  };

  const handlePageClick = (pageNumber: number) => {
    if (pageNumber !== page && !loading) {
      onPageChange(pageNumber);
    }
  };

  // Calculate page numbers to display with ellipsis for large page counts
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisible = 7; // Max visible page buttons (excluding ellipsis)

    if (total_pages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= total_pages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page <= 3) {
        // Near start: 1 2 3 4 5 ... last
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(total_pages);
      } else if (page >= total_pages - 2) {
        // Near end: 1 ... last-4 last-3 last-2 last-1 last
        pages.push('...');
        for (let i = total_pages - 4; i <= total_pages; i++) {
          pages.push(i);
        }
      } else {
        // Middle: 1 ... page-1 page page+1 ... last
        pages.push('...');
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(total_pages);
      }
    }

    return pages;
  };

  // Calculate displayed items range
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total_items);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
      {/* Items info */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Mostrando {startItem.toLocaleString()} - {endItem.toLocaleString()} de {total_items.toLocaleString()} registros
      </div>

      <div className="flex items-center gap-4">
        {/* Page size selector */}
        {showPageSize && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">
              Por página:
            </label>
            <select
              value={limit}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              disabled={loading}
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation buttons - only show if more than 1 page */}
        {showNavigation && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePreviousPage}
              disabled={page === 1 || loading}
            >
              Anterior
            </Button>

            {variant === 'extended' && (
              <div className="flex items-center gap-1">
                {getPageNumbers().map((item, index) => (
                  item === '...' ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="w-8 h-8 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => handlePageClick(item as number)}
                      disabled={loading}
                      className={`
                        w-8 h-8 text-sm font-medium rounded-sm transition-colors
                        ${item === page
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }
                        ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      {item}
                    </button>
                  )
                ))}
              </div>
            )}

            {variant === 'simple' && (
              <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
                Página {page} de {total_pages}
              </span>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={handleNextPage}
              disabled={page === total_pages || loading}
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pagination;
