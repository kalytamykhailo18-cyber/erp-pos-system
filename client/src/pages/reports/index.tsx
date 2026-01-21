import React, { useState, lazy, Suspense, useMemo, useCallback, useRef } from 'react';
import {
  MdToday,
  MdShoppingCart,
  MdInventory,
  MdPerson,
  MdWarehouse,
  MdCategory,
  MdWarning,
  MdPayment,
  MdDelete,
  MdSchedule,
  MdCompareArrows,
  MdMenu,
  MdClose,
} from 'react-icons/md';

// Lazy load report components for better initial load performance
const DailyReport = lazy(() => import('./DailyReport'));
const SalesReport = lazy(() => import('./SalesReport'));
const ProductReport = lazy(() => import('./ProductReport'));
const CashierReport = lazy(() => import('./CashierReport'));
const InventoryReport = lazy(() => import('./InventoryReport'));
const CategoryReport = lazy(() => import('./CategoryReport'));
const DiscrepancyReport = lazy(() => import('./DiscrepancyReport'));
const PaymentMethodReport = lazy(() => import('./PaymentMethodReport'));
const ShrinkageReport = lazy(() => import('./ShrinkageReport'));
const HourlyReport = lazy(() => import('./HourlyReport'));
const BranchComparisonReport = lazy(() => import('./BranchComparisonReport'));

type TabType = 'daily' | 'sales' | 'products' | 'cashiers' | 'inventory' | 'categories' | 'discrepancies' | 'payments' | 'shrinkage' | 'hourly' | 'comparison';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ReactElement;
  component: React.LazyExoticComponent<React.FC>;
}

const TABS: TabConfig[] = [
  { id: 'daily', label: 'Reporte Diario', icon: <MdToday className="w-5 h-5" />, component: DailyReport },
  { id: 'sales', label: 'Ventas', icon: <MdShoppingCart className="w-5 h-5" />, component: SalesReport },
  { id: 'products', label: 'Productos', icon: <MdInventory className="w-5 h-5" />, component: ProductReport },
  { id: 'cashiers', label: 'Cajeros', icon: <MdPerson className="w-5 h-5" />, component: CashierReport },
  { id: 'inventory', label: 'Inventario', icon: <MdWarehouse className="w-5 h-5" />, component: InventoryReport },
  { id: 'categories', label: 'Categorías', icon: <MdCategory className="w-5 h-5" />, component: CategoryReport },
  { id: 'discrepancies', label: 'Discrepancias', icon: <MdWarning className="w-5 h-5" />, component: DiscrepancyReport },
  { id: 'payments', label: 'Métodos de Pago', icon: <MdPayment className="w-5 h-5" />, component: PaymentMethodReport },
  { id: 'shrinkage', label: 'Mermas', icon: <MdDelete className="w-5 h-5" />, component: ShrinkageReport },
  { id: 'hourly', label: 'Por Hora', icon: <MdSchedule className="w-5 h-5" />, component: HourlyReport },
  { id: 'comparison', label: 'Comparación', icon: <MdCompareArrows className="w-5 h-5" />, component: BranchComparisonReport },
];

const LoadingFallback: React.FC = () => (
  <div className="flex justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary-600"></div>
  </div>
);

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleTabClick = useCallback((tabId: TabType) => {
    setActiveTab(tabId);
    setIsDrawerOpen(false);
  }, []);

  // Desktop only: hover to open
  const handleMouseEnter = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  // Desktop only: mouse leave to close
  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    const relatedTarget = e.relatedTarget as Node | null;
    if (
      drawerRef.current?.contains(relatedTarget) ||
      triggerRef.current?.contains(relatedTarget)
    ) {
      return;
    }
    setIsDrawerOpen(false);
  }, []);

  // Mobile only: click to toggle
  const handleClickToggle = useCallback(() => {
    setIsDrawerOpen(prev => !prev);
  }, []);

  const ActiveComponent = useMemo(() => {
    const tab = TABS.find(t => t.id === activeTab);
    return tab?.component || DailyReport;
  }, [activeTab]);

  const activeTabConfig = useMemo(() => TABS.find(t => t.id === activeTab), [activeTab]);

  return (
    <div className="p-4 lg:p-6">
      {/* Page Header with Drawer Trigger */}
      <div className="mb-6 animate-fade-down duration-fast flex items-center gap-4">
        {/* Mobile: Click to toggle */}
        <button
          className="lg:hidden flex items-center gap-3 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          onClick={handleClickToggle}
        >
          <div className="p-1.5 bg-primary-500 rounded-md">
            <MdMenu className="w-5 h-5 text-white" />
          </div>
          <span className="text-primary-500">{activeTabConfig?.icon}</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{activeTabConfig?.label}</span>
        </button>
        {/* Desktop: Hover to open */}
        <div
          ref={triggerRef}
          className="hidden lg:flex items-center gap-3 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="p-1.5 bg-primary-500 rounded-md">
            <MdMenu className="w-5 h-5 text-white" />
          </div>
          <span className="text-primary-500">{activeTabConfig?.icon}</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{activeTabConfig?.label}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reportes</h1>
      </div>

      {/* Backdrop - mobile only */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Drawer - Mobile: below header at left-0, Desktop: below header at left-64 */}
      <div
        ref={drawerRef}
        className={`fixed top-16 left-0 lg:left-64 bottom-0 w-64 lg:w-56 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto z-40 lg:z-20 shadow-xl transition-transform duration-200 ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header with close button on mobile */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Reportes</h2>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`w-full flex items-center gap-3 px-3 py-2.5 mb-1 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }`}
              onClick={() => handleTabClick(tab.id)}
            >
              <span className={activeTab === tab.id ? 'text-primary-500' : 'text-gray-400'}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="min-h-[calc(100vh-12rem)]">
        {/* Report Content */}
        <div className="animate-zoom-in duration-normal">
          <Suspense fallback={<LoadingFallback />}>
            <ActiveComponent />
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;
