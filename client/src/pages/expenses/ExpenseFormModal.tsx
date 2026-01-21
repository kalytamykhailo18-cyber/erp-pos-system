import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { createExpense, updateExpense, loadExpenses } from '../../store/slices/expenseSlice';
import { Modal } from '../../components/ui';
import type { Expense, ExpenseFormData } from '../../types';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
}

const initialFormData: ExpenseFormData = {
  category_id: '',
  description: '',
  amount: 0,
  payment_method: 'CASH',
  expense_date: new Date().toISOString().split('T')[0],
};

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  expense,
}) => {
  const dispatch = useAppDispatch();
  const { categories, filters } = useAppSelector((state) => state.expense);
  const { availableBranches } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState<ExpenseFormData>(initialFormData);
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Load form data when expense changes
  useEffect(() => {
    if (expense) {
      // Check if expense is viewable only (not editable)
      const viewOnly = expense.status !== 'PENDING';
      setIsViewOnly(viewOnly);

      setFormData({
        category_id: expense.category_id,
        branch_id: expense.branch_id,
        description: expense.description,
        amount: Number(expense.amount),
        payment_method: expense.payment_method,
        vendor_name: expense.vendor_name,
        vendor_tax_id: expense.vendor_tax_id,
        invoice_number: expense.invoice_number,
        expense_date: expense.expense_date.split('T')[0],
        due_date: expense.due_date ? expense.due_date.split('T')[0] : undefined,
        is_recurring: expense.is_recurring,
        recurrence_pattern: expense.recurrence_pattern,
        recurrence_day: expense.recurrence_day,
        account_code: expense.account_code,
        is_tax_deductible: expense.is_tax_deductible,
        tax_year: expense.tax_year,
        notes: expense.notes,
      });
    } else {
      setFormData(initialFormData);
      setIsViewOnly(false);
    }
  }, [expense]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else if (type === 'number') {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? undefined : Number(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value || undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isViewOnly) {
      onClose();
      return;
    }

    if (expense) {
      // Update expense
      const result = await dispatch(updateExpense({ id: expense.id, data: formData }));
      if (updateExpense.fulfilled.match(result)) {
        dispatch(loadExpenses(filters));
        onClose();
      }
    } else {
      // Create expense
      const result = await dispatch(createExpense(formData));
      if (createExpense.fulfilled.match(result)) {
        dispatch(loadExpenses(filters));
        onClose();
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isViewOnly
          ? `Gasto ${expense?.expense_number}`
          : expense
          ? 'Editar Gasto'
          : 'Nuevo Gasto'
      }
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category and Branch */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="animate-fade-right duration-fast">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categoría <span className="text-red-500">*</span>
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
              disabled={isViewOnly}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
            >
              <option value="">Seleccione una categoría</option>
              {categories.filter(c => c.is_active).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="animate-fade-left duration-fast">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sucursal
            </label>
            <select
              name="branch_id"
              value={formData.branch_id || ''}
              onChange={handleChange}
              disabled={isViewOnly}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
            >
              <option value="">Todas las sucursales</option>
              {availableBranches?.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="animate-fade-up duration-normal">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descripción <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            disabled={isViewOnly}
            rows={3}
            placeholder="Describe el gasto..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
          />
        </div>

        {/* Amount and Payment Method */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="animate-fade-right duration-light-slow">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Monto ($) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              disabled={isViewOnly}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
            />
          </div>

          <div className="animate-fade-left duration-normal">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Método de Pago <span className="text-red-500">*</span>
            </label>
            <select
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
              required
              disabled={isViewOnly}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
            >
              <option value="CASH">Efectivo</option>
              <option value="BANK_TRANSFER">Transferencia Bancaria</option>
              <option value="CHECK">Cheque</option>
              <option value="CREDIT_CARD">Tarjeta de Crédito</option>
              <option value="DEBIT_CARD">Tarjeta de Débito</option>
            </select>
          </div>
        </div>

        {/* Vendor Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="animate-fade-right duration-fast">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre del Proveedor
            </label>
            <input
              type="text"
              name="vendor_name"
              value={formData.vendor_name || ''}
              onChange={handleChange}
              disabled={isViewOnly}
              placeholder="Proveedor..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
            />
          </div>

          <div className="animate-fade-up duration-normal">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              CUIT del Proveedor
            </label>
            <input
              type="text"
              name="vendor_tax_id"
              value={formData.vendor_tax_id || ''}
              onChange={handleChange}
              disabled={isViewOnly}
              placeholder="XX-XXXXXXXX-X"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
            />
          </div>

          <div className="animate-fade-left duration-fast">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Número de Factura
            </label>
            <input
              type="text"
              name="invoice_number"
              value={formData.invoice_number || ''}
              onChange={handleChange}
              disabled={isViewOnly}
              placeholder="Número de factura..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="animate-fade-right duration-normal">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha del Gasto <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="expense_date"
              value={formData.expense_date}
              onChange={handleChange}
              required
              disabled={isViewOnly}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
            />
          </div>

          <div className="animate-fade-left duration-normal">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha de Vencimiento
            </label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date || ''}
              onChange={handleChange}
              disabled={isViewOnly}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Recurring */}
        {!expense && (
          <div className="animate-fade-up duration-fast">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_recurring"
                checked={formData.is_recurring || false}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Gasto Recurrente
              </span>
            </label>

            {formData.is_recurring && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Patrón de Recurrencia
                  </label>
                  <select
                    name="recurrence_pattern"
                    value={formData.recurrence_pattern || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Seleccione...</option>
                    <option value="MONTHLY">Mensual</option>
                    <option value="QUARTERLY">Trimestral</option>
                    <option value="YEARLY">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Día del Mes (1-31)
                  </label>
                  <input
                    type="number"
                    name="recurrence_day"
                    value={formData.recurrence_day || ''}
                    onChange={handleChange}
                    min="1"
                    max="31"
                    placeholder="Día del mes..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Accounting */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="animate-fade-right duration-normal">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Código Contable
            </label>
            <input
              type="text"
              name="account_code"
              value={formData.account_code || ''}
              onChange={handleChange}
              disabled={isViewOnly}
              placeholder="Código..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
            />
          </div>

          <div className="animate-fade-left duration-normal">
            <label className="flex items-center gap-2 cursor-pointer mt-8">
              <input
                type="checkbox"
                name="is_tax_deductible"
                checked={formData.is_tax_deductible || false}
                onChange={handleChange}
                disabled={isViewOnly}
                className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Deducible de Impuestos
              </span>
            </label>
          </div>
        </div>

        {/* Notes */}
        <div className="animate-fade-up duration-fast">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notas
          </label>
          <textarea
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            disabled={isViewOnly}
            rows={3}
            placeholder="Notas adicionales..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
          />
        </div>

        {/* View Only Info */}
        {isViewOnly && expense && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Estado:</span>
              <span className="font-medium text-gray-900 dark:text-white">{expense.status}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Presentado por:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {expense.submitter?.first_name} {expense.submitter?.last_name}
              </span>
            </div>
            {expense.approved_by && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Aprobado por:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {expense.approver?.first_name} {expense.approver?.last_name}
                </span>
              </div>
            )}
            {expense.rejection_reason && (
              <div className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">Motivo de rechazo:</span>
                <p className="mt-1 text-red-600 dark:text-red-400">{expense.rejection_reason}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-fast"
          >
            {isViewOnly ? 'Cerrar' : 'Cancelar'}
          </button>
          {!isViewOnly && (
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-sm transition-colors duration-fast"
            >
              {expense ? 'Actualizar' : 'Crear'} Gasto
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};
