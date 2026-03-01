import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import logoImg from '../assets/logo.PNG';
import heroBgImg from '../assets/hero-bg.webp';

function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="auth-split-body">
      <div className="auth-split-container">
        {/* Lado Izquierdo - Branding con imagen */}
        <div
          className="auth-brand-side"
          style={{ backgroundImage: `url(${heroBgImg})` }}
        >
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

            <motion.div
              className="auth-brand-quote"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <p className="auth-brand-quote-text">
                "OBRATEC ha transformado cómo gestionamos nuestros informes. Ahorramos 5 horas semanales por proyecto."
              </p>
              <div className="auth-brand-quote-author">
                <div className="auth-brand-quote-avatar">CM</div>
                <div>
                  <strong>Carlos Martínez</strong>
                  <span>Jefe de Obra · Constructora ABC</span>
                </div>
              </div>
            </motion.div>
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
