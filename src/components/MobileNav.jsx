import { NavLink } from 'react-router-dom';
import { useAuth } from '../App';
import { FiHome, FiFileText, FiMessageCircle, FiFolder, FiCreditCard, FiSettings } from 'react-icons/fi';
import './MobileNav.css';

function MobileNav() {
  const { user } = useAuth();

  const allNavItems = [
    { path: '/app/dashboard', icon: <FiHome />, label: 'Inicio' },
    { path: '/app/reports', icon: <FiFileText />, label: 'Informes' },
    { path: '/app/chatbot', icon: <FiMessageCircle />, label: 'Chat' },
    { path: '/app/knowledge', icon: <FiFolder />, label: 'Biblioteca', hideForViewer: true },
    { path: '/app/billing', icon: <FiCreditCard />, label: 'Facturación' },
    { path: '/app/settings', icon: <FiSettings />, label: 'Ajustes' },
  ];

  const navItems = allNavItems.filter(item => !(item.hideForViewer && user?.role === 'viewer'));

  return (
    <nav className="mobile-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="mobile-nav-icon">{item.icon}</div>
          <span className="mobile-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default MobileNav;
