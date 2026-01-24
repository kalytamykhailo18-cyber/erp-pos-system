import React from 'react';
import { useNavigate } from 'react-router-dom';
import PublicHeader from '../components/layout/PublicHeader';
import PublicFooter from '../components/layout/PublicFooter';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import InventoryIcon from '@mui/icons-material/Inventory';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DevicesIcon from '@mui/icons-material/Devices';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: PointOfSaleIcon,
      title: 'Punto de Venta',
      description: 'Sistema POS completo con ventas rápidas, múltiples métodos de pago y modo offline.',
    },
    {
      icon: InventoryIcon,
      title: 'Gestión de Inventario',
      description: 'Control total de stock, traslados entre sucursales, alertas de stock bajo.',
    },
    {
      icon: BarChartIcon,
      title: 'Reportes Avanzados',
      description: 'Reportes detallados de ventas, productos, cajeros y rendimiento por sucursal.',
    },
    {
      icon: PeopleIcon,
      title: 'Clientes y Lealtad',
      description: 'Programa de fidelización, créditos, puntos y seguimiento de clientes.',
    },
    {
      icon: LocalShippingIcon,
      title: 'Envíos y Delivery',
      description: 'Gestión de zonas de envío, cálculo automático de costos y seguimiento.',
    },
    {
      icon: ReceiptLongIcon,
      title: 'Facturación',
      description: 'Generación y gestión de facturas con reintentos automáticos.',
    },
  ];

  const benefits = [
    {
      icon: CloudSyncIcon,
      title: 'Modo Offline',
      description: 'Trabaja sin conexión, los datos se sincronizan automáticamente cuando hay internet.',
    },
    {
      icon: SecurityIcon,
      title: 'Seguro y Confiable',
      description: 'Control de acceso por roles, auditoría completa y backup automático.',
    },
    {
      icon: SpeedIcon,
      title: 'Rápido y Eficiente',
      description: 'Interfaz optimizada para ventas rápidas y operaciones ágiles.',
    },
    {
      icon: SupportAgentIcon,
      title: 'Soporte Dedicado',
      description: 'Equipo de soporte técnico disponible para asistir a tu negocio.',
    },
    {
      icon: TrendingUpIcon,
      title: 'Escalable',
      description: 'Crece con tu negocio, soporta múltiples sucursales sin límite.',
    },
    {
      icon: DevicesIcon,
      title: 'Multi-dispositivo',
      description: 'Accede desde cualquier dispositivo: PC, tablet o smartphone.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PublicHeader />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-up">
              Sistema ERP/POS para Tiendas de Mascotas
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto animate-fade-up">
              Gestiona tus ventas, inventario y múltiples sucursales desde una única plataforma profesional
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-zoom-in">
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-white text-primary-700 rounded-sm font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
              >
                Comenzar Ahora
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-primary-700 text-white rounded-sm font-semibold hover:bg-primary-800 transition-all border-2 border-white"
              >
                Ver Características
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Características Principales
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Todo lo que necesitas para gestionar tu tienda de mascotas de manera profesional
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="p-6 bg-gray-50 dark:bg-gray-700 rounded-sm hover:shadow-lg transition-all transform hover:-translate-y-1"
                >
                  <div className="w-12 h-12 bg-primary-600 rounded-sm flex items-center justify-center mb-4">
                    <Icon sx={{ fontSize: 28 }} className="text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              ¿Por Qué Elegir Juan POS?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Beneficios que marcan la diferencia en tu negocio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="flex gap-4 p-6 bg-white dark:bg-gray-800 rounded-sm hover:shadow-lg transition-all"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-sm flex items-center justify-center">
                      <Icon sx={{ fontSize: 28 }} className="text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">50+</div>
              <div className="text-primary-100">Módulos</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">Multi</div>
              <div className="text-primary-100">Sucursales</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">100%</div>
              <div className="text-primary-100">Offline Capable</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">24/7</div>
              <div className="text-primary-100">Disponibilidad</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            ¿Listo para Transformar tu Negocio?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Comienza a usar Juan POS hoy y lleva tu tienda de mascotas al siguiente nivel
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-10 py-4 bg-primary-600 text-white rounded-sm font-semibold hover:bg-primary-700 transition-all transform hover:scale-105 shadow-lg text-lg"
          >
            Iniciar Sesión Ahora
          </button>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default LandingPage;
