import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheck, FiFileText, FiUsers, FiBarChart2, FiSmartphone, FiShield } from 'react-icons/fi';
import logoImg from '../assets/logo.PNG';

/**
 * AuthLayout - Layout split profesional para páginas de autenticación
 * Inspirado en el diseño del login antiguo pero mejorado
 */
function AuthLayout({ children, title, subtitle }) {
  const features = [
    { icon: FiFileText, text: 'Gestión integral de obras' },
    { icon: FiBarChart2, text: 'Informes en tiempo real' },
    { icon: FiUsers, text: 'Equipo colaborativo' },
    { icon: FiSmartphone, text: 'Acceso desde cualquier dispositivo' },
    { icon: FiShield, text: 'Seguridad garantizada' },
  ];

  return (
    <div className="auth-split-body">
      <div className="auth-split-container">
        {/* Lado Izquierdo - Branding */}
        <div className="auth-brand-side">
          <motion.div 
            className="auth-brand-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="auth-brand-logo"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <img src={logoImg} alt="OBRATEC" style={{ width: '82px', height: '82px', objectFit: 'contain' }} />
            </motion.div>
            
            <motion.p 
              className="auth-brand-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Sistema de Gestión de Informes de Construcción
            </motion.p>

            <ul className="auth-brand-features">
              {features.map((feature, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + (index * 0.1), duration: 0.4 }}
                >
                  <feature.icon />
                  <span>{feature.text}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Lado Derecho - Formulario */}
        <div className="auth-form-side">
          <motion.div 
            className="auth-form-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="auth-page-header">
              <h2 className="auth-page-title">
                {title}
              </h2>
              {subtitle && (
                <p className="auth-page-subtitle">{subtitle}</p>
              )}
            </div>
            
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
