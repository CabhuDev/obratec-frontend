import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import MobileNav from './MobileNav';
import { healthAPI } from '../services/api';
import logoImg from '../assets/logo.PNG';
import {
  FiHome,
  FiFileText,
  FiMessageCircle,
  FiFolder,
  FiSettings,
  FiCreditCard,
  FiLogOut,
  FiUsers,
  FiBarChart2
} from 'react-icons/fi';

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [apiStatus, setApiStatus] = useState(null); // null=comprobando, {ok, version}

  // Marca el body para que MobileNav.css scope sus reglas solo dentro de la app
  useEffect(() => {
    document.body.classList.add('app-shell');
    return () => document.body.classList.remove('app-shell');
  }, []);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await healthAPI.check();
        setApiStatus({ ok: true, version: res.data.version });
      } catch {
        setApiStatus({ ok: false, version: null });
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      <MobileNav />
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div style={{
            background: 'white',
            borderRadius: '50%',
            padding: '10px',
            display: 'inline-flex',
            alignItems: 'center',
          }}>
            <img src={logoImg} alt="OBRATEC" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink
            to="/app/dashboard"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <FiHome />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/app/reports"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <FiFileText />
            <span>Informes</span>
          </NavLink>

          <NavLink
            to="/app/chatbot"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <FiMessageCircle />
            <span>Chat IA</span>
          </NavLink>

          {user?.role !== 'viewer' && (
            <NavLink
              to="/app/knowledge"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <FiFolder />
              <span>Biblioteca</span>
            </NavLink>
          )}

          <NavLink
            to="/app/billing"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <FiCreditCard />
            <span>Facturación</span>
          </NavLink>

          <NavLink
            to="/app/settings"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <FiSettings />
            <span>Configuración</span>
          </NavLink>

          {user?.role === 'admin' && (
            <NavLink
              to="/app/admin"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <FiBarChart2 />
              <span>Admin</span>
            </NavLink>
          )}
        </nav>
        
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">
                {user?.first_name} {user?.last_name}
              </div>
              <div className="sidebar-user-role">
                {user?.role === 'admin' ? 'Administrador' : user?.role === 'editor' ? 'Editor' : user?.role === 'viewer' ? 'Visor' : 'Usuario'}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.5rem',
            fontSize: '0.7rem',
            color: 'var(--text-secondary)',
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              flexShrink: 0,
              background: apiStatus === null
                ? '#888'
                : apiStatus.ok ? '#2ecc71' : '#e74c3c',
            }} />
            {apiStatus === null && 'Conectando...'}
            {apiStatus?.ok && `API v${apiStatus.version}`}
            {apiStatus && !apiStatus.ok && 'Sin conexión'}
          </div>

          <button onClick={handleLogout} className="sidebar-logout">
            <FiLogOut />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Sidebar;
