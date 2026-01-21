import React, { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  loadZones,
  createZone,
  updateZone,
  deleteZone,
  loadNeighborhoods,
} from '../../store/slices/shippingSlice';
import { Card, Button } from '../../components/ui';
import { ShippingZoneFormModal } from './ShippingZoneFormModal';
import { ShippingZonesTable } from './ShippingZonesTable';
import type { ShippingZone, ShippingZoneFormData } from '../../types';
import { MdLocationOn, MdCheckCircle, MdAttachMoney } from 'react-icons/md';

const initialFormData: ShippingZoneFormData = {
  name: '',
  description: '',
  base_rate: 0,
  free_shipping_threshold: undefined,
  weight_surcharge_per_kg: 0,
  express_surcharge: 0,
  estimated_delivery_hours: 24,
  is_active: true,
};

const ShippingZonesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { zones, neighborhoods } = useAppSelector((state) => state.shipping);
  const loading = useAppSelector((state) => state.ui.loading);

  // Local state
  const [showModal, setShowModal] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [formData, setFormData] = useState<ShippingZoneFormData>(initialFormData);
  const [includeInactive, setIncludeInactive] = useState(false);

  // Load zones and neighborhoods
  useEffect(() => {
    dispatch(loadZones({ includeInactive }));
    dispatch(loadNeighborhoods());
  }, [dispatch, includeInactive]);

  // Handle form changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? undefined : Number(value)) : value,
    }));
  };

  // Open create modal
  const handleCreate = () => {
    setEditingZone(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  // Open edit modal
  const handleEdit = (zone: ShippingZone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      description: zone.description || '',
      base_rate: Number(zone.base_rate),
      free_shipping_threshold: zone.free_shipping_threshold ? Number(zone.free_shipping_threshold) : undefined,
      weight_surcharge_per_kg: zone.weight_surcharge_per_kg ? Number(zone.weight_surcharge_per_kg) : 0,
      express_surcharge: zone.express_surcharge ? Number(zone.express_surcharge) : 0,
      estimated_delivery_hours: zone.estimated_delivery_hours || 24,
      is_active: zone.is_active ?? true,
    });
    setShowModal(true);
  };

  // Submit form
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (editingZone) {
        const result = await dispatch(updateZone({ id: editingZone.id, data: formData }));
        if (updateZone.fulfilled.match(result)) {
          setShowModal(false);
          dispatch(loadZones({ includeInactive }));
        }
      } else {
        const result = await dispatch(
          createZone({
            ...formData,
            is_active: true,
            sort_order: 0,
          })
        );
        if (createZone.fulfilled.match(result)) {
          setShowModal(false);
          dispatch(loadZones({ includeInactive }));
        }
      }
    },
    [dispatch, editingZone, formData, includeInactive]
  );

  // Delete zone
  const handleDelete = useCallback(
    async (id: string) => {
      if (window.confirm('¿Estás seguro de eliminar esta zona de envío? Esta acción no se puede deshacer.')) {
        const result = await dispatch(deleteZone(id));
        if (deleteZone.fulfilled.match(result)) {
          dispatch(loadZones({ includeInactive }));
        }
      }
    },
    [dispatch, includeInactive]
  );

  // Count neighborhoods per zone
  const getNeighborhoodCount = (zoneId: string) => {
    return neighborhoods.filter((n) => n.shipping_zone_id === zoneId && n.is_active).length;
  };

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-down duration-fast">
          <div className="animate-fade-right duration-normal">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Zonas de Envío
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Configura las zonas de envío y sus tarifas
            </p>
          </div>

          <div className="flex gap-2 animate-fade-left duration-fast">
            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-fast">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm">Mostrar inactivas</span>
            </label>

            <Button onClick={handleCreate} variant="primary">
              + Nueva Zona
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-up duration-normal">
          <Card className="animate-fade-right duration-fast">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-sm flex items-center justify-center">
                <MdLocationOn className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Zonas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {zones.filter((z) => z.is_active).length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="animate-fade-up duration-light-slow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-sm flex items-center justify-center">
                <MdCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Barrios Mapeados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {neighborhoods.filter((n) => n.is_active).length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="animate-fade-left duration-normal">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-sm flex items-center justify-center">
                <MdAttachMoney className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Zonas con Envío Gratis</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {zones.filter((z) => z.is_active && z.free_shipping_threshold).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Zones Table */}
        <Card className="animate-fade-up duration-normal">
          <ShippingZonesTable
            zones={zones}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            getNeighborhoodCount={getNeighborhoodCount}
          />
        </Card>
      </div>

      {/* Form Modal */}
      <ShippingZoneFormModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        formData={formData}
        onChange={handleFormChange}
        isEditing={!!editingZone}
      />
    </>
  );
};

export default ShippingZonesPage;
