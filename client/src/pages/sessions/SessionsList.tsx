import React, { useState } from 'react';
import type { RegisterSession } from '../../types';
import { Pagination } from '../../components/ui';
import type { PaginationState } from '../../components/ui/Pagination';
import ReopenSessionModal from './ReopenSessionModal';
import Button from '../../components/ui/Button';
import LockOpenIcon from '@mui/icons-material/LockOpen';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

interface SessionsListProps {
  sessions: RegisterSession[];
  onSessionsUpdate?: () => void;
  loading?: boolean;
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (limit: number) => void;
}

const SessionsList: React.FC<SessionsListProps> = ({
  sessions,
  onSessionsUpdate,
  loading = false,
  pagination,
  onPageChange,
  onPageSizeChange,
}) => {
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<RegisterSession | null>(null);

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColors = (status: string) => {
    const colors: { [key: string]: { bg: string; text: string } } = {
      OPEN: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
      CLOSED: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300' },
      CANCELLED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
      REOPENED: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' }
    };
    return colors[status] || colors.CLOSED;
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      OPEN: 'Abierto',
      CLOSED: 'Cerrado',
      CANCELLED: 'Cancelado',
      REOPENED: 'Reabierto'
    };
    return labels[status] || status;
  };

  const handleReopenClick = (session: RegisterSession) => {
    setSelectedSession(session);
    setShowReopenModal(true);
  };

  const handleReopenSuccess = () => {
    setSelectedSession(null);
    if (onSessionsUpdate) {
      onSessionsUpdate();
    }
  };

  const getShiftLabel = (shiftType: string) => {
    const labels: { [key: string]: string } = {
      MORNING: 'Turno Mañana',
      AFTERNOON: 'Turno Tarde',
      FULL_DAY: 'Día Completo'
    };
    return labels[shiftType] || shiftType;
  };

  // Reusable pagination component
  const PaginationNav = () => (
    <Pagination
      pagination={pagination}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      loading={loading}
      variant="extended"
      showPageSize
      pageSizeOptions={PAGE_SIZE_OPTIONS}
    />
  );

  return (
    <div className="animate-fade-up duration-normal">
      {sessions && sessions.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md overflow-hidden animate-zoom-in duration-light-slow">
          {/* Top Pagination */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <PaginationNav />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-primary-600 dark:bg-primary-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Sucursal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Turno</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Cajero Apertura</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Abierto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Cerrado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Discrepancia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sessions.map((session) => {
                  const statusColors = getStatusColors(session.status);
                  const hasDiscrepancy = session.discrepancy_cash && Number(session.discrepancy_cash) !== 0;
                  return (
                    <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{session.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{session.branch?.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                          {getShiftLabel(session.shift_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {session.opener ? `${session.opener.first_name} ${session.opener.last_name}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatDateTime(session.opened_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {session.closed_at ? formatDateTime(session.closed_at) : 'Abierto'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors.bg} ${statusColors.text} inline-block`}>
                            {getStatusLabel(session.status)}
                          </span>
                          {session.status === 'REOPENED' && session.reopened_at && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Reabierto: {formatDateTime(session.reopened_at)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${hasDiscrepancy ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                        {formatCurrency(session.discrepancy_cash ? Number(session.discrepancy_cash) : 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {session.status === 'CLOSED' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleReopenClick(session)}
                            className="flex items-center gap-1"
                          >
                            <LockOpenIcon className="h-4 w-4" />
                            Reabrir
                          </Button>
                        )}
                        {session.status === 'REOPENED' && session.reopen_reason && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
                            <span className="font-medium">Motivo:</span> {session.reopen_reason}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Pagination */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <PaginationNav />
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-8 text-center animate-zoom-out duration-normal">
          <p className="text-gray-600 dark:text-gray-400 animate-fade-up duration-light-slow">No hay cierres de caja</p>
        </div>
      )}

      {/* Reopen Session Modal */}
      {selectedSession && (
        <ReopenSessionModal
          isOpen={showReopenModal}
          onClose={() => {
            setShowReopenModal(false);
            setSelectedSession(null);
          }}
          sessionId={selectedSession.id}
          sessionNumber={selectedSession.session_number}
          branchName={selectedSession.branch?.name || 'N/A'}
          onSuccess={handleReopenSuccess}
        />
      )}
    </div>
  );
};

export default SessionsList;
