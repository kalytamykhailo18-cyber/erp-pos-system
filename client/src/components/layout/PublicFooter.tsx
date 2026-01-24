import React from 'react';
import StorefrontIcon from '@mui/icons-material/Storefront';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const PublicFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary-600 rounded-sm flex items-center justify-center">
                <StorefrontIcon sx={{ fontSize: 24 }} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Juan POS</h2>
                <p className="text-xs text-gray-400">Sistema Multi-Sucursal</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Sistema integral de punto de venta y gestión empresarial diseñado especialmente para tiendas de mascotas con múltiples sucursales.
            </p>
            <p className="text-xs text-gray-500">
              Optimiza tus ventas, inventario y gestión empresarial con nuestra solución profesional.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#features" className="hover:text-primary-400 transition-colors">
                  Características
                </a>
              </li>
              <li>
                <a href="#benefits" className="hover:text-primary-400 transition-colors">
                  Beneficios
                </a>
              </li>
              <li>
                <a href="/login" className="hover:text-primary-400 transition-colors">
                  Iniciar Sesión
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-primary-400 transition-colors">
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <EmailIcon sx={{ fontSize: 18 }} className="text-primary-400 mt-0.5" />
                <div>
                  <p className="text-gray-400">Email</p>
                  <a href="mailto:info@juanpos.com" className="hover:text-primary-400 transition-colors">
                    info@juanpos.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <PhoneIcon sx={{ fontSize: 18 }} className="text-primary-400 mt-0.5" />
                <div>
                  <p className="text-gray-400">Teléfono</p>
                  <a href="tel:+543794123456" className="hover:text-primary-400 transition-colors">
                    +54 379 4123456
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <LocationOnIcon sx={{ fontSize: 18 }} className="text-primary-400 mt-0.5" />
                <div>
                  <p className="text-gray-400">Ubicación</p>
                  <p>Corrientes, Argentina</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>
              &copy; {currentYear} Juan POS. Todos los derechos reservados.
            </p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-primary-400 transition-colors">
                Términos de Servicio
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                Política de Privacidad
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
