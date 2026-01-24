import React from 'react';
import { useNavigate } from 'react-router-dom';
import BarChartIcon from '@mui/icons-material/BarChart';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WarningIcon from '@mui/icons-material/Warning';

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Ventas del Día',
      description: 'Ver ventas por sucursal',
      icon: BarChartIcon,
      path: '/reports/sales',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'Historial de Transacciones',
      description: 'Ver todas las transacciones',
      icon: ReceiptLongIcon,
      path: '/reports',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'Aprobar Alertas',
      description: 'Revisar alertas pendientes',
      icon: TaskAltIcon,
      path: '/alerts',
      color: 'bg-amber-500 hover:bg-amber-600',
    },
    {
      title: 'Stock por Sucursal',
      description: 'Ver niveles de stock',
      icon: InventoryIcon,
      path: '/reports/inventory',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      title: 'Reportes de Cierre',
      description: 'Reportes consolidados',
      icon: AssignmentIcon,
      path: '/reports/consolidated-daily',
      color: 'bg-indigo-500 hover:bg-indigo-600',
    },
    {
      title: 'Discrepancias',
      description: 'Ver diferencias de caja',
      icon: WarningIcon,
      path: '/reports/discrepancies',
      color: 'bg-red-500 hover:bg-red-600',
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Acciones Rápidas
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action, index) => {
          const animationClass = index % 3 === 0 ? 'animate-fade-up' : index % 3 === 1 ? 'animate-zoom-in' : 'animate-fade-down';
          const durationClass = 'duration-fast';

          const IconComponent = action.icon;

          return (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className={`${action.color} text-white rounded-sm p-4 transition-all transform hover:scale-105 shadow-md ${animationClass} ${durationClass}`}
            >
              <div className="mb-2">
                <IconComponent sx={{ fontSize: 40 }} />
              </div>
              <div className="text-sm font-semibold mb-1">{action.title}</div>
              <div className="text-xs opacity-90">{action.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
