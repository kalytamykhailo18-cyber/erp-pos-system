import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ShippingZonesPage from './ShippingZonesPage';
import NeighborhoodMappingsPage from './NeighborhoodMappingsPage';
import ShippingCalculatorPage from './ShippingCalculatorPage';
import ShipmentsPage from './ShipmentsPage';

const ShippingRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/shipping/zones" replace />} />
      <Route path="/zones" element={<ShippingZonesPage />} />
      <Route path="/neighborhoods" element={<NeighborhoodMappingsPage />} />
      <Route path="/calculator" element={<ShippingCalculatorPage />} />
      <Route path="/shipments" element={<ShipmentsPage />} />
    </Routes>
  );
};

export default ShippingRoutes;
