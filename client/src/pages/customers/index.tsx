import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  loadCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  setPage,
  setLimit,
} from '../../store/slices/customersSlice';
import { Card, Button, Input } from '../../components/ui';
import { CustomersTable } from './CustomersTable';
import { CustomerFormModal } from './CustomerFormModal';
import { CustomerDetailModal } from './CustomerDetailModal';
import type { Customer } from '../../types';
import type { CustomerFormData } from './CustomerFormModal';
import type { PaginationState } from '../../components/ui/Pagination';
import { MdAdd, MdSearch } from 'react-icons/md';

const initialFormData: CustomerFormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  document_type: 'DNI',
  document_number: '',
  tax_condition: 'CONSUMIDOR_FINAL',
  company_name: '',
  address: '',
  doorbell_apt: '',
  neighborhood: '',
  city: '',
  postal_code: '',
  is_wholesale: false,
  wholesale_discount_percent: '',
  assigned_vendor_id: '',
  notes: '',
};

const CustomersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { customers, pagination: reduxPagination } = useAppSelector((state) => state.customers);
  const loading = useAppSelector((state) => state.ui.loading);

  // Map Redux pagination to PaginationState format
  const pagination: PaginationState = useMemo(() => ({
    page: reduxPagination.page,
    limit: reduxPagination.limit,
    total_items: reduxPagination.total,
    total_pages: reduxPagination.pages,
  }), [reduxPagination]);

  // Local state
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Load customers when pagination or search changes
  useEffect(() => {
    dispatch(loadCustomers({
      page: reduxPagination.page,
      limit: reduxPagination.limit,
      search: search || undefined,
    }));
  }, [dispatch, reduxPagination.page, reduxPagination.limit, search]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    dispatch(setPage(page));
  };

  const handlePageSizeChange = (limit: number) => {
    dispatch(setLimit(limit));
  };

  // Handle form changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open create modal
  const handleCreate = () => {
    setEditingCustomer(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  // Open edit modal
  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      document_type: customer.document_type || 'DNI',
      document_number: customer.document_number || '',
      tax_condition: customer.tax_condition || 'CONSUMIDOR_FINAL',
      company_name: customer.company_name || '',
      address: customer.address || '',
      doorbell_apt: customer.doorbell_apt || '',
      neighborhood: customer.neighborhood || '',
      city: customer.city || '',
      postal_code: customer.postal_code || '',
      is_wholesale: customer.is_wholesale || false,
      wholesale_discount_percent: customer.wholesale_discount_percent ? String(customer.wholesale_discount_percent) : '',
      assigned_vendor_id: customer.assigned_vendor_id || '',
      notes: customer.notes || '',
    });
    setShowModal(true);
  };

  // Submit form
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const customerData = {
      first_name: formData.first_name || undefined,
      last_name: formData.last_name || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      document_type: formData.document_type || undefined,
      document_number: formData.document_number || undefined,
      tax_condition: formData.tax_condition || undefined,
      company_name: formData.company_name || undefined,
      address: formData.address || undefined,
      doorbell_apt: formData.doorbell_apt || undefined,
      neighborhood: formData.neighborhood || undefined,
      city: formData.city || undefined,
      postal_code: formData.postal_code || undefined,
      is_wholesale: formData.is_wholesale,
      wholesale_discount_percent: formData.wholesale_discount_percent || undefined,
      assigned_vendor_id: formData.assigned_vendor_id || undefined,
      notes: formData.notes || undefined,
    };

    if (editingCustomer) {
      const result = await dispatch(updateCustomer({
        id: editingCustomer.id,
        data: customerData,
      }));
      if (updateCustomer.fulfilled.match(result)) {
        setShowModal(false);
      }
    } else {
      const result = await dispatch(createCustomer(customerData));
      if (createCustomer.fulfilled.match(result)) {
        setShowModal(false);
      }
    }
  }, [dispatch, editingCustomer, formData]);

  // Delete customer
  const handleDelete = useCallback(async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
      await dispatch(deleteCustomer(id));
    }
  }, [dispatch]);

  // View customer details
  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  };

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-down duration-fast">
          <div className="animate-fade-right duration-normal">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Clientes
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Gestiona los clientes y su información
            </p>
          </div>

          <Button
            variant="primary"
            onClick={handleCreate}
            icon={<MdAdd className="w-5 h-5" />}
            iconPosition="left"
          >
            Nuevo Cliente
          </Button>
        </div>

        {/* Search */}
        <Card className="p-4 animate-fade-up duration-normal">
          <Input
            placeholder="Buscar por nombre, email, teléfono o documento..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              handlePageChange(1);
            }}
            leftIcon={<MdSearch className="w-5 h-5" />}
          />
        </Card>

        {/* Customers Table */}
        <Card className="overflow-hidden animate-fade-up duration-light-slow">
          <CustomersTable
            customers={customers}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewDetails={handleViewDetails}
            onCreate={handleCreate}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </Card>
      </div>

      {/* Customer Form Modal */}
      <CustomerFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        formData={formData}
        onChange={handleFormChange}
        editingCustomer={editingCustomer}
        loading={loading}
      />

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        customer={selectedCustomer}
        onEdit={handleEdit}
      />
    </>
  );
};

export default CustomersPage;
