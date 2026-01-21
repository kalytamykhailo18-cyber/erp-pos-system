import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../../store';
import { createSupplier, updateSupplier, deactivateSupplier } from '../../store/slices/supplierSlice';
import { Button, Input } from '../../components/ui';
import type { Supplier } from '../../services/api/supplier.service';
import { MdClose } from 'react-icons/md';

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
}

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
  isOpen,
  onClose,
  supplier,
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  // Form fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [cuit, setCuit] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [paymentTermsDays, setPaymentTermsDays] = useState('30');
  const [creditLimit, setCreditLimit] = useState('0');
  const [priceListFormat, setPriceListFormat] = useState<'PDF' | 'EXCEL' | 'CSV'>('EXCEL');
  const [defaultMarginPercent, setDefaultMarginPercent] = useState('30');
  const [notes, setNotes] = useState('');

  // Load supplier data when editing
  useEffect(() => {
    if (supplier) {
      setCode(supplier.code);
      setName(supplier.name);
      setLegalName(supplier.legal_name || '');
      setCuit(supplier.cuit || '');
      setAddress(supplier.address || '');
      setCity(supplier.city || '');
      setPhone(supplier.phone || '');
      setEmail(supplier.email || '');
      setWebsite(supplier.website || '');
      setContactName(supplier.contact_name || '');
      setContactPhone(supplier.contact_phone || '');
      setContactEmail(supplier.contact_email || '');
      setPaymentTermsDays(supplier.payment_terms_days.toString());
      setCreditLimit(supplier.credit_limit.toString());
      setPriceListFormat(supplier.price_list_format || 'EXCEL');
      setDefaultMarginPercent(supplier.default_margin_percent.toString());
      setNotes(supplier.notes || '');
    } else {
      // Reset form for new supplier
      setCode('');
      setName('');
      setLegalName('');
      setCuit('');
      setAddress('');
      setCity('');
      setPhone('');
      setEmail('');
      setWebsite('');
      setContactName('');
      setContactPhone('');
      setContactEmail('');
      setPaymentTermsDays('30');
      setCreditLimit('0');
      setPriceListFormat('EXCEL');
      setDefaultMarginPercent('30');
      setNotes('');
    }
  }, [supplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        code,
        name,
        legal_name: legalName || undefined,
        cuit: cuit || undefined,
        address: address || undefined,
        city: city || undefined,
        phone: phone || undefined,
        email: email || undefined,
        website: website || undefined,
        contact_name: contactName || undefined,
        contact_phone: contactPhone || undefined,
        contact_email: contactEmail || undefined,
        payment_terms_days: parseInt(paymentTermsDays) || 30,
        credit_limit: parseFloat(creditLimit) || 0,
        price_list_format: priceListFormat,
        default_margin_percent: parseFloat(defaultMarginPercent) || 30,
        notes: notes || undefined,
      };

      if (supplier) {
        await dispatch(updateSupplier({ id: supplier.id, data })).unwrap();
      } else {
        await dispatch(createSupplier(data)).unwrap();
      }

      onClose();
    } catch (error) {
      // Error handled by slice
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!supplier || !confirm('¿Está seguro que desea desactivar este proveedor?')) return;

    setLoading(true);
    try {
      await dispatch(deactivateSupplier(supplier.id)).unwrap();
      onClose();
    } catch (error) {
      // Error handled by slice
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Cerrar</span>
              <MdClose className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                Información Básica
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Código"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
                <Input
                  label="Nombre Comercial"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Razón Social"
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                />
                <Input
                  label="CUIT"
                  type="text"
                  value={cuit}
                  onChange={(e) => setCuit(e.target.value)}
                />
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                Dirección
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Dirección"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="col-span-2"
                />
                <Input
                  label="Ciudad"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                Contacto
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Teléfono Principal"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Input
                  label="Email Principal"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  label="Sitio Web"
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="col-span-2"
                />
                <Input
                  label="Nombre de Contacto"
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
                <Input
                  label="Teléfono de Contacto"
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
                <Input
                  label="Email de Contacto"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="col-span-2"
                />
              </div>
            </div>

            {/* Commercial Terms */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                Términos Comerciales
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Días de Pago"
                  type="number"
                  value={paymentTermsDays}
                  onChange={(e) => setPaymentTermsDays(e.target.value)}
                  min="0"
                />
                <Input
                  label="Límite de Crédito"
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Formato de Lista de Precios
                  </label>
                  <select
                    value={priceListFormat}
                    onChange={(e) => setPriceListFormat(e.target.value as 'PDF' | 'EXCEL' | 'CSV')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="PDF">PDF</option>
                    <option value="EXCEL">Excel</option>
                    <option value="CSV">CSV</option>
                  </select>
                </div>
                <Input
                  label="Margen por Defecto (%)"
                  type="number"
                  value={defaultMarginPercent}
                  onChange={(e) => setDefaultMarginPercent(e.target.value)}
                  min="0"
                  step="0.1"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notas
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                {supplier && supplier.is_active && (
                  <Button
                    type="button"
                    variant="danger"
                    onClick={handleDeactivate}
                    disabled={loading}
                  >
                    Desactivar
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : supplier ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
