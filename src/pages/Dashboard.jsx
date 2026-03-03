import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { dashboardAPI } from '../services/api';
import SkeletonLoader from '../components/SkeletonLoader';
import { FiFileText, FiMessageCircle, FiClock, FiTrendingUp, FiPlus, FiCheckCircle, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardAPI.getSummary();
      setSummary(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { class: 'badge-warning', text: 'Borrador' },
      completed: { class: 'badge-success', text: 'Completado' },
      processing: { class: 'badge-info', text: 'Procesando' },
      published: { class: 'badge-success', text: 'Publicado' },
      failed: { class: 'badge-danger', text: 'Error' },
    };
    const badge = badges[status] || badges.draft;
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return <SkeletonLoader type="dashboard" />;
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="card"
        style={{ textAlign: 'center', padding: 'var(--spacing-xxl)' }}
      >
        <FiAlertCircle style={{ fontSize: '3rem', color: 'var(--color-danger)', marginBottom: 'var(--spacing-md)' }} />
        <h3 style={{ color: 'var(--color-secondary)', marginBottom: 'var(--spacing-sm)' }}>
          Error al cargar el dashboard
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>{error}</p>
        <button className="btn btn-primary" onClick={fetchDashboardData}>
          <FiRefreshCw /> Reintentar
        </button>
      </motion.div>
    );
  }

  const reports = summary?.reports || {};
  const storage = summary?.storage || {};
  const usersInfo = summary?.users || {};
  const reportsByStatus = summary?.reports_by_status || {};
  const freeTrial = summary?.free_trial || {};
  const recentReports = summary?.recent_reports || [];
  const totalReports = reports.total || 0;
  const pendingReports = reportsByStatus.draft || 0;
  const completedReports = reportsByStatus.completed || 0;
  const completionRate = totalReports > 0 ? Math.round(completedReports / totalReports * 100) : 0;

  // Usage calculations
  const storageUsedMb = storage.used_mb || 0;
  const storageMaxMb = storage.max_mb || 100;
  const storagePercent = storageMaxMb > 0 ? Math.min(Math.round((storageUsedMb / storageMaxMb) * 100), 100) : 0;
  const reportsThisMonth = reports.this_month || 0;
  const reportsMaxMonth = reports.max_per_month || 0;
  const reportsPercent = reportsMaxMonth > 0 ? Math.min(Math.round((reportsThisMonth / reportsMaxMonth) * 100), 100) : 0;
  const usersCurrent = usersInfo.current || 0;
  const usersMax = usersInfo.max || 0;
  const usersPercent = usersMax > 0 ? Math.min(Math.round((usersCurrent / usersMax) * 100), 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="dashboard-header">
        <div>
          <h2>Bienvenido de nuevo</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Aquí está el resumen de tu actividad
          </p>
        </div>
        <Link to="/app/reports/new" className="btn btn-primary">
          <FiPlus /> Nuevo Informe
        </Link>
      </div>

      {/* Free Trial Banner */}
      {freeTrial.is_trial && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(247, 155, 114, 0.15), rgba(59, 140, 136, 0.1))',
            border: `1px solid ${freeTrial.trial_days_remaining != null && freeTrial.trial_days_remaining <= 7 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(247, 155, 114, 0.3)'}`,
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <FiAlertCircle style={{
              fontSize: '1.5rem',
              color: freeTrial.trial_days_remaining != null && freeTrial.trial_days_remaining <= 7
                ? 'var(--color-danger)'
                : 'var(--color-primary)',
            }} />
            <div style={{ flex: 1 }}>
              <strong>Prueba Gratuita</strong>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                {freeTrial.trial_days_remaining != null ? (
                  <>
                    Te quedan{' '}
                    <strong style={{ color: freeTrial.trial_days_remaining <= 7 ? 'var(--color-danger)' : 'var(--color-primary)' }}>
                      {freeTrial.trial_days_remaining} {freeTrial.trial_days_remaining === 1 ? 'día' : 'días'}
                    </strong>
                    {freeTrial.trial_days_remaining <= 7 && (
                      <span style={{ color: 'var(--color-danger)' }}> — expira pronto</span>
                    )}
                    {' · '}
                  </>
                ) : (
                  <>{freeTrial.reports_used || 0}/{freeTrial.reports_limit || 2} informes gratis usados · </>
                )}
                <Link to="/app/settings" style={{ fontWeight: 600 }}>Mejora tu plan</Link>
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div
        className="stats-grid"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-icon primary">
            <FiFileText />
          </div>
          <div className="stat-content">
            <div className="stat-value">{totalReports}</div>
            <div className="stat-label">Total Informes</div>
          </div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-icon tertiary">
            <FiClock />
          </div>
          <div className="stat-content">
            <div className="stat-value">{reports.this_month || 0}</div>
            <div className="stat-label">Este Mes</div>
          </div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-icon secondary">
            <FiMessageCircle />
          </div>
          <div className="stat-content">
            <div className="stat-value">{pendingReports}</div>
            <div className="stat-label">Pendientes</div>
          </div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-icon warning">
            <FiTrendingUp />
          </div>
          <div className="stat-content">
            <div className="stat-value">{completionRate}%</div>
            <div className="stat-label">Tasa de Completado</div>
          </div>
        </motion.div>
      </motion.div>

      {/* Resource Usage */}
      {(storageMaxMb > 0 || reportsMaxMonth > 0 || usersMax > 0) && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          style={{ marginBottom: 'var(--spacing-lg)' }}
        >
          <div className="card-header">
            <h3 className="card-title">Uso de Recursos</h3>
          </div>
          <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
            {storageMaxMb > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Almacenamiento</span>
                  <span style={{ fontWeight: 600 }}>{storageUsedMb.toFixed(1)} / {storageMaxMb} MB</span>
                </div>
                <div style={{ height: '8px', background: 'var(--color-light-gray)', borderRadius: '4px' }}>
                  <div style={{
                    width: `${storagePercent}%`, height: '100%', borderRadius: '4px',
                    background: storagePercent > 80 ? 'var(--color-danger)' : 'var(--color-tertiary)',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            )}
            {reportsMaxMonth > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Informes este mes</span>
                  <span style={{ fontWeight: 600 }}>{reportsThisMonth} / {reportsMaxMonth}</span>
                </div>
                <div style={{ height: '8px', background: 'var(--color-light-gray)', borderRadius: '4px' }}>
                  <div style={{
                    width: `${reportsPercent}%`, height: '100%', borderRadius: '4px',
                    background: reportsPercent > 80 ? 'var(--color-danger)' : 'var(--color-primary)',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            )}
            {usersMax > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Usuarios</span>
                  <span style={{ fontWeight: 600 }}>{usersCurrent} / {usersMax}</span>
                </div>
                <div style={{ height: '8px', background: 'var(--color-light-gray)', borderRadius: '4px' }}>
                  <div style={{
                    width: `${usersPercent}%`, height: '100%', borderRadius: '4px',
                    background: usersPercent > 80 ? 'var(--color-danger)' : 'var(--color-secondary)',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Recent Reports */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="card-header">
          <h3 className="card-title">Informes Recientes</h3>
          <Link to="/app/reports" className="btn btn-outline btn-sm">
            Ver Todos
          </Link>
        </div>

        {recentReports.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="table-container reports-desktop-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>Proyecto</th>
                    <th>Fecha</th>
                    <th>Avance</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentReports.map((report) => (
                    <tr key={report.id}>
                      <td>
                        <strong>{report.proyecto}</strong>
                        {report.titulo && <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{report.titulo}</div>}
                      </td>
                      <td>{formatDate(report.fecha)}</td>
                      <td>{report.avance}%</td>
                      <td>{getStatusBadge(report.status)}</td>
                      <td>
                        <Link to={`/app/reports/${report.id}`} className="btn btn-outline btn-sm">Ver</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="reports-mobile-list">
              {recentReports.map((report) => (
                <div key={report.id} className="report-mobile-card">
                  <div className="report-mobile-main">
                    <strong>{report.proyecto}</strong>
                    {getStatusBadge(report.status)}
                  </div>
                  <div className="report-mobile-meta">
                    {formatDate(report.fecha)} · {report.avance}% avance
                  </div>
                  <Link to={`/app/reports/${report.id}`} className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }}>
                    Ver
                  </Link>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No hay informes aún</h3>
            <p>Crea tu primer informe de obra</p>
            <Link to="/app/reports/new" className="btn btn-primary" style={{ marginTop: 'var(--spacing-md)' }}>
              <FiPlus /> Crear Informe
            </Link>
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.28 }}
      >
        <div className="card-header">
          <h3 className="card-title">Acciones Rápidas</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
          <Link to="/app/reports/new" style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ cursor: 'pointer' }}>
              <div className="stat-icon primary">
                <FiPlus />
              </div>
              <div className="stat-content">
                <div className="stat-value" style={{ fontSize: '1rem' }}>Nuevo Informe</div>
                <div className="stat-label">Crear informe de obra</div>
              </div>
            </div>
          </Link>

          <Link to="/app/chatbot" style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ cursor: 'pointer' }}>
              <div className="stat-icon tertiary">
                <FiMessageCircle />
              </div>
              <div className="stat-content">
                <div className="stat-value" style={{ fontSize: '1rem' }}>Chat IA</div>
                <div className="stat-label">Preguntar al asistente</div>
              </div>
            </div>
          </Link>

          <Link to="/app/knowledge" style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ cursor: 'pointer' }}>
              <div className="stat-icon secondary">
                <FiCheckCircle />
              </div>
              <div className="stat-content">
                <div className="stat-value" style={{ fontSize: '1rem' }}>Biblioteca</div>
                <div className="stat-label">Gestionar documentos</div>
              </div>
            </div>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default Dashboard;
