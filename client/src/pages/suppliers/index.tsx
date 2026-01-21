import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Lazy load pages
const SupplierListPage = React.lazy(() => import('./SupplierListPage'));
const PurchaseOrderListPage = React.lazy(() => import('./PurchaseOrderListPage'));

const SuppliersPage: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary-600"></div>
        </div>
      }
    >
      <Routes>
        <Route index element={<SupplierListPage />} />
        <Route path="purchase-orders" element={<PurchaseOrderListPage />} />
        <Route path="*" element={<Navigate to="/suppliers" replace />} />
      </Routes>
    </Suspense>
  );
};

export default SuppliersPage;
