import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchOwnerDashboard } from '../../store/slices/dashboardSlice';
import OverallMetrics from './OverallMetrics';
import BranchSalesChart from './BranchSalesChart';
import DailyTrendChart from './DailyTrendChart';
import CashDiscrepancies from './CashDiscrepancies';
import ShrinkageSummary from './ShrinkageSummary';
import TopProductsList from './TopProductsList';
import PendingInvoicesAlert from './PendingInvoicesAlert';
import BranchShiftStatus from './BranchShiftStatus';
import BranchStatusTable from './BranchStatusTable';
import StockLevelOverview from './StockLevelOverview';
import AlertPanel from './AlertPanel';
import QuickActions from './QuickActions';

const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data, error } = useAppSelector((state) => state.dashboard);
  const { currentBranch } = useAppSelector((state) => state.auth);

  // Track if viewing all branches (null) or a specific branch
  const isAllBranches = currentBranch === null;

  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // Pass branch_id when a specific branch is selected
    dispatch(fetchOwnerDashboard({
      ...dateRange,
      branch_id: currentBranch?.id
    }));
  }, [dispatch, dateRange, currentBranch?.id]);

  const handleDateRangeChange = (start: string, end: string) => {
    setDateRange({ start_date: start, end_date: end });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-lg text-red-600 dark:text-red-400 animate-zoom-in duration-fast">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-down duration-fast">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white animate-fade-right duration-normal">
            Dashboard {isAllBranches ? '- Vista General' : `- ${currentBranch?.name}`}
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-left duration-normal">
            <label className="flex flex-col">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Desde:</span>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => handleDateRangeChange(e.target.value, dateRange.end_date)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hasta:</span>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => handleDateRangeChange(dateRange.start_date, e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Pending Invoices Alert */}
      <PendingInvoicesAlert />

      {/* Branch Status Table - Real-time overview per branch (only for all branches view) */}
      {isAllBranches && (
        <div className="animate-fade-up duration-fast">
          <BranchStatusTable />
        </div>
      )}

      {/* Real-time Alert System */}
      <div className="animate-fade-up duration-normal">
        <AlertPanel />
      </div>

      {/* Quick Actions Panel */}
      <div className="animate-fade-up duration-normal">
        <QuickActions />
      </div>

      {/* Live Branch Shift Status - Detailed shift information (only for all branches view) */}
      {isAllBranches && (
        <div className="animate-fade-up duration-light-slow">
          <BranchShiftStatus />
        </div>
      )}

      {data && (
        <>
          <div className="animate-fade-up duration-normal">
            <OverallMetrics
              totalSales={data.overall.total_sales}
              totalRevenue={data.overall.total_revenue}
              averageTicket={data.overall.average_ticket}
              branches={data.branches}
            />
          </div>

          <div className={`grid grid-cols-1 ${isAllBranches ? 'lg:grid-cols-2' : ''} gap-6`}>
            {/* Branch Sales Chart - only show when viewing all branches */}
            {isAllBranches && (
              <div className="animate-fade-right duration-normal">
                <BranchSalesChart salesByBranch={data.by_branch} />
              </div>
            )}
            <div className="animate-fade-left duration-normal">
              <DailyTrendChart dailyTrend={data.daily_trend} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="animate-fade-right duration-light-slow">
              <CashDiscrepancies discrepancies={data.discrepancies} />
            </div>
            <div className="animate-fade-up duration-light-slow">
              <ShrinkageSummary shrinkage={data.shrinkage} />
            </div>
            <div className="animate-fade-left duration-light-slow">
              <StockLevelOverview />
            </div>
          </div>

          <div className="animate-fade-up duration-slow">
            <TopProductsList products={data.top_products} />
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
