import React from 'react';
import { useNavigate } from 'react-router-dom';

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Ventas del Día',
      description: 'Ver ventas por sucursal',
      icon: '📊',
      path: '/reports/sales',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'Historial de Transacciones',
      description: 'Ver todas las transacciones',
      icon: '📝',
      path: '/reports',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'Aprobar Alertas',
      description: 'Revisar alertas pendientes',
      icon: '✅',
      path: '/alerts',
      color: 'bg-amber-500 hover:bg-amber-600',
    },
    {
      title: 'Stock por Sucursal',
      description: 'Ver niveles de stock',
      icon: '📦',
      path: '/reports/inventory',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      title: 'Reportes de Cierre',
      description: 'Reportes consolidados',
      icon: '📄',
      path: '/reports/consolidated-daily',
      color: 'bg-indigo-500 hover:bg-indigo-600',
    },
    {
      title: 'Discrepancias',
      description: 'Ver diferencias de caja',
      icon: '⚠️',
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

          return (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className={`${action.color} text-white rounded-sm p-4 transition-all transform hover:scale-105 shadow-md ${animationClass} ${durationClass}`}
            >
              <div className="text-3xl mb-2">{action.icon}</div>
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
