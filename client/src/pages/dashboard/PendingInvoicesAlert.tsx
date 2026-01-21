import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchInvoiceStats, retryPendingInvoices } from '../../store/slices/invoicesSlice';
import { useNavigation } from '../../hooks';
import { Button } from '../../components/ui';
import { MdWarning, MdRefresh, MdDescription, MdClose } from 'react-icons/md';

const PendingInvoicesAlert: React.FC = () => {
  const dispatch = useAppDispatch();
  const { goTo } = useNavigation();
  const { stats } = useAppSelector((state) => state.invoices);
  const { currentBranch } = useAppSelector((state) => state.auth);
  const loading = useAppSelector((state) => state.ui.loading);

  useEffect(() => {
    dispatch(fetchInvoiceStats({
      branch_id: currentBranch?.id,
    }));
  }, [dispatch, currentBranch?.id]);

  const handleRetryPending = async () => {
    await dispatch(retryPendingInvoices(currentBranch?.id));
    dispatch(fetchInvoiceStats({
      branch_id: currentBranch?.id,
    }));
  };

  const handleViewInvoices = () => {
    goTo('/invoices');
  };

  if (!stats || stats.pending_count === 0) {
    return null;
  }

  return (
    <div className="bg-warning-50 dark:bg-warning-900/20 border-l-4 border-warning-500 p-6 rounded-sm shadow-md animate-fade-down duration-fast">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-full flex items-center justify-center animate-pulse-slow">
            <MdWarning className="w-6 h-6 text-warning-600 dark:text-warning-400" />
          </div>
        </div>

        <div className="flex-1 animate-fade-right duration-normal">
          <h3 className="text-lg font-semibold text-warning-800 dark:text-warning-300 mb-2">
            Facturas Pendientes de AFIP
          </h3>
          <p className="text-warning-700 dark:text-warning-400 mb-4">
            Hay <span className="font-bold">{stats.pending_count}</span> factura{stats.pending_count > 1 ? 's' : ''} pendiente{stats.pending_count > 1 ? 's' : ''} de envío a AFIP.
            {stats.pending_count > 1
              ? ' Estas facturas no tienen CAE y deben ser procesadas.'
              : ' Esta factura no tiene CAE y debe ser procesada.'}
          </p>

          <div className="flex flex-wrap gap-3 animate-fade-up duration-light-slow">
            <Button
              variant="warning"
              onClick={handleRetryPending}
              disabled={loading}
              icon={<MdRefresh className="w-5 h-5" />}
              iconPosition="left"
            >
              Reintentar Envío
            </Button>

            <Button
              variant="secondary"
              onClick={handleViewInvoices}
              icon={<MdDescription className="w-5 h-5" />}
              iconPosition="left"
            >
              Ver Todas las Facturas
            </Button>
          </div>
        </div>

        <button
          onClick={() => {/* Close alert - could add to local storage */}}
          className="flex-shrink-0 text-warning-600 dark:text-warning-400 hover:text-warning-800 dark:hover:text-warning-200 transition-colors"
        >
          <MdClose className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default PendingInvoicesAlert;
