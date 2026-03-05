import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { dashboardAPI, mediaUrl } from '../services/api';
import { useAuth } from '../App';
import SkeletonLoader from '../components/SkeletonLoader';
import {
  FiFileText, FiMessageCircle, FiClock, FiTrendingUp, FiPlus,
  FiCheckCircle, FiAlertCircle, FiRefreshCw, FiCalendar, FiArrowRight,
} from 'react-icons/fi';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ── Helpers de color (mismo sistema que Reports) ─────────────────────────────
const PROJECT_PALETTE = [
  '#F79B72', '#2A4759', '#3B8C88',
  '#6366f1', '#0891b2', '#059669', '#d97706', '#be185d',
];

const projectColor = (name = '') => {
  const hash = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PROJECT_PALETTE[hash % PROJECT_PALETTE.length];
};

const TYPE_LABELS = {
  obra: 'Obra', visita: 'Visita', reunion: 'Reunión',
  seguridad: 'Seguridad', calidad: 'Calidad', personalizado: 'Personalizado',
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
};

const formatDay = () =>
  new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

// ─────────────────────────────────────────────────────────────────────────────

function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchDashboardData(); }, []);

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
      draft:      { class: 'badge-warning', text: 'Borrador' },
      completed:  { class: 'badge-success', text: 'Completado' },
      processing: { class: 'badge-info',    text: 'Procesando' },
      published:  { class: 'badge-success', text: 'Publicado' },
      failed:     { class: 'badge-danger',  text: 'Error' },
    };
    return badges[status] || badges.draft;
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', year: 'numeric',
    });

  if (loading) return <SkeletonLoader type="dashboard" />;

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
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

  const reports        = summary?.reports || {};
  const storage        = summary?.storage || {};
  const usersInfo      = summary?.users || {};
  const reportsByStatus = summary?.reports_by_status || {};
  const freeTrial      = summary?.free_trial || {};
  const recentReports  = summary?.recent_reports || [];

  const totalReports    = reports.total || 0;
  const pendingReports  = reportsByStatus.draft || 0;
  const completedReports = reportsByStatus.completed || 0;
  const completionRate  = totalReports > 0 ? Math.round(completedReports / totalReports * 100) : 0;

  const storageUsedMb  = storage.used_mb || 0;
  const storageMaxMb   = storage.max_mb || 100;
  const storagePercent = storageMaxMb > 0 ? Math.min(Math.round((storageUsedMb / storageMaxMb) * 100), 100) : 0;
  const reportsThisMonth = reports.this_month || 0;
  const reportsMaxMonth  = reports.max_per_month || 0;
  const reportsPercent   = reportsMaxMonth > 0 ? Math.min(Math.round((reportsThisMonth / reportsMaxMonth) * 100), 100) : 0;
  const usersCurrent  = usersInfo.current || 0;
  const usersMax      = usersInfo.max || 0;
  const usersPercent  = usersMax > 0 ? Math.min(Math.round((usersCurrent / usersMax) * 100), 100) : 0;

  // Hero card data
  const heroReport  = recentReports[0] || null;
  const restReports = recentReports.slice(1);
  const heroColor   = heroReport ? projectColor(heroReport.proyecto || '') : '#F79B72';
  const heroBadge   = heroReport ? getStatusBadge(heroReport.status) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Greeting ─────────────────────────────────────────────────────── */}
      <div className="dash-greeting">
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem',
        }}>
          <div>
            <p style={{
              fontSize: '0.78rem', color: 'var(--text-secondary)',
              marginBottom: '0.25rem', textTransform: 'capitalize',
            }}>
              {formatDay()}
            </p>
            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {getGreeting()}{user?.first_name ? `, ${user.first_name}` : ''}
            </h2>
          </div>
          <Link to="/app/reports/new" className="btn btn-primary">
            <FiPlus /> Nuevo Informe
          </Link>
        </div>
      </div>

      {/* ── Free Trial Banner ────────────────────────────────────────────── */}
      {freeTrial.is_trial && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(247,155,114,0.15), rgba(59,140,136,0.1))',
            border: `1px solid ${freeTrial.trial_days_remaining != null && freeTrial.trial_days_remaining <= 7
              ? 'rgba(239,68,68,0.4)' : 'rgba(247,155,114,0.3)'}`,
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <FiAlertCircle style={{
              fontSize: '1.5rem',
              color: freeTrial.trial_days_remaining != null && freeTrial.trial_days_remaining <= 7
                ? 'var(--color-danger)' : 'var(--color-primary)',
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
                    {freeTrial.trial_days_remaining <= 7 && <span style={{ color: 'var(--color-danger)' }}> — expira pronto</span>}
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

      {/* ── Stats Grid ───────────────────────────────────────────────────── */}
      <motion.div className="stats-grid" variants={containerVariants} initial="hidden" animate="show">
        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-icon primary"><FiFileText /></div>
          <div className="stat-content">
            <div className="stat-value">{totalReports}</div>
            <div className="stat-label">Total Informes</div>
          </div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-icon tertiary"><FiClock /></div>
          <div className="stat-content">
            <div className="stat-value">{reports.this_month || 0}</div>
            <div className="stat-label">Este Mes</div>
          </div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-icon secondary"><FiMessageCircle /></div>
          <div className="stat-content">
            <div className="stat-value">{pendingReports}</div>
            <div className="stat-label">Pendientes</div>
          </div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-icon warning"><FiTrendingUp /></div>
          <div className="stat-content">
            <div className="stat-value">{completionRate}%</div>
            <div className="stat-label">Tasa de Completado</div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Resource Usage ───────────────────────────────────────────────── */}
      {(storageMaxMb > 0 || reportsMaxMonth > 0 || usersMax > 0) && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
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
                  <div style={{ width: `${storagePercent}%`, height: '100%', borderRadius: '4px', background: storagePercent > 80 ? 'var(--color-danger)' : 'var(--color-tertiary)', transition: 'width 0.3s ease' }} />
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
                  <div style={{ width: `${reportsPercent}%`, height: '100%', borderRadius: '4px', background: reportsPercent > 80 ? 'var(--color-danger)' : 'var(--color-primary)', transition: 'width 0.3s ease' }} />
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
                  <div style={{ width: `${usersPercent}%`, height: '100%', borderRadius: '4px', background: usersPercent > 80 ? 'var(--color-danger)' : 'var(--color-secondary)', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Informes Recientes — Hero + Strip ────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        style={{ marginBottom: 'var(--spacing-lg)' }}
      >
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '1.25rem',
        }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Informe reciente
          </h3>
          <Link to="/app/reports" className="btn btn-outline btn-sm">Ver todos</Link>
        </div>

        {heroReport ? (
          <>
            {/* ── Hero card ─────────────────────────────────────────────── */}
            <Link
              to={`/app/reports/${heroReport.id}`}
              style={{ textDecoration: 'none', display: 'block', marginBottom: restReports.length > 0 ? '1.25rem' : 0 }}
            >
              <div
                className="dash-hero-report"
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.13)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '';
                  e.currentTarget.style.transform = '';
                }}
              >
                {/* Panel izquierdo: color + foto */}
                <div className="dash-hero-thumb" style={{ background: heroColor }}>
                  {heroReport.thumbnail ? (
                    <img src={mediaUrl(heroReport.thumbnail)} alt="" />
                  ) : (
                    <FiFileText size={44} style={{ color: 'white', opacity: 0.45 }} />
                  )}
                </div>

                {/* Panel derecho: contenido */}
                <div className="dash-hero-body">
                  {/* Tipo + Estado */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.65rem' }}>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 600,
                      color: 'var(--secondary)', background: 'rgba(42,71,89,0.08)',
                      padding: '2px 8px', borderRadius: '4px',
                    }}>
                      {TYPE_LABELS[heroReport.report_type] || heroReport.report_type || 'Obra'}
                    </span>
                    <span className={`badge ${heroBadge.class}`}>{heroBadge.text}</span>
                  </div>

                  {/* Proyecto */}
                  <p style={{
                    margin: '0 0 0.2rem', fontSize: '1.2rem', fontWeight: 700,
                    color: 'var(--text-primary)',
                    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                  }}>
                    {heroReport.proyecto}
                  </p>

                  {/* Título */}
                  {heroReport.titulo && (
                    <p style={{
                      margin: '0 0 0.8rem', fontSize: '0.875rem', color: 'var(--text-secondary)',
                      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                    }}>
                      {heroReport.titulo}
                    </p>
                  )}

                  {/* Barra de avance */}
                  <div style={{ marginBottom: '0.85rem', marginTop: heroReport.titulo ? 0 : '0.5rem' }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem',
                    }}>
                      <span>Avance</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{heroReport.avance}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--color-light-gray)', borderRadius: '3px' }}>
                      <div style={{
                        width: `${heroReport.avance}%`, height: '100%', borderRadius: '3px',
                        background: heroReport.avance >= 100 ? 'var(--color-tertiary)' : heroColor,
                        transition: 'width 0.3s',
                      }} />
                    </div>
                  </div>

                  {/* Fecha + CTA */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginTop: 'auto',
                  }}>
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: '0.35rem',
                      fontSize: '0.8rem', color: 'var(--text-secondary)',
                    }}>
                      <FiCalendar size={12} />
                      {formatDate(heroReport.fecha)}
                    </span>
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                      fontSize: '0.85rem', fontWeight: 600, color: heroColor,
                    }}>
                      Ver informe <FiArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* ── Strip A4 de informes restantes ────────────────────────── */}
            {restReports.length > 0 && (
              <div className="dash-report-strip">
                {restReports.map((report) => {
                  const color = projectColor(report.proyecto || '');
                  const badge = getStatusBadge(report.status);
                  return (
                    <div key={report.id} className="report-shelf-item">
                      <Link to={`/app/reports/${report.id}`} className="report-card-a4">
                        <div className="report-card-a4-thumb">
                          <div className="report-card-a4-strip" style={{ background: color }} />
                          {report.thumbnail ? (
                            <img
                              src={mediaUrl(report.thumbnail)} alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                          ) : (
                            <div style={{
                              width: '100%', height: '100%', background: `${color}12`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <FiFileText size={28} style={{ color, opacity: 0.3 }} />
                            </div>
                          )}
                        </div>
                        <div className="report-card-a4-meta">
                          <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', gap: '0.3rem', marginBottom: '0.35rem',
                          }}>
                            <span style={{
                              fontSize: '0.6rem', fontWeight: 600, color: 'var(--secondary)',
                              background: 'rgba(42,71,89,0.07)', padding: '1px 5px', borderRadius: '3px',
                              textTransform: 'capitalize',
                            }}>
                              {TYPE_LABELS[report.report_type] || 'Obra'}
                            </span>
                            <span className={`badge ${badge.class}`} style={{ fontSize: '0.55rem', padding: '1px 5px' }}>
                              {badge.text}
                            </span>
                          </div>
                          <p style={{
                            margin: '0 0 0.3rem', fontWeight: 600, fontSize: '0.78rem', lineHeight: 1.25,
                            color: 'var(--text-primary)', overflow: 'hidden', display: '-webkit-box',
                            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          }}>
                            {report.titulo || report.proyecto}
                          </p>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.25rem',
                            fontSize: '0.62rem', color: 'var(--text-secondary)', marginBottom: '0.4rem',
                          }}>
                            <FiCalendar size={9} />
                            {formatDate(report.fecha)}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <div style={{ flex: 1, height: '3px', background: 'var(--color-light-gray)', borderRadius: '2px' }}>
                              <div style={{
                                width: `${report.avance}%`, height: '100%', borderRadius: '2px',
                                background: report.avance >= 100 ? 'var(--color-tertiary)' : color,
                              }} />
                            </div>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                              {report.avance}%
                            </span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No hay informes aún</h3>
              <p>Crea tu primer informe de obra</p>
              <Link to="/app/reports/new" className="btn btn-primary" style={{ marginTop: 'var(--spacing-md)' }}>
                <FiPlus /> Crear Informe
              </Link>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Quick Actions ────────────────────────────────────────────────── */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.28 }}
      >
        <div className="card-header">
          <h3 className="card-title">Acciones Rápidas</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
          <Link to="/app/reports/new" style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ cursor: 'pointer' }}>
              <div className="stat-icon primary"><FiPlus /></div>
              <div className="stat-content">
                <div className="stat-value" style={{ fontSize: '1rem' }}>Nuevo Informe</div>
                <div className="stat-label">Crear informe de obra</div>
              </div>
            </div>
          </Link>
          <Link to="/app/chatbot" style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ cursor: 'pointer' }}>
              <div className="stat-icon tertiary"><FiMessageCircle /></div>
              <div className="stat-content">
                <div className="stat-value" style={{ fontSize: '1rem' }}>Chat IA</div>
                <div className="stat-label">Preguntar al asistente</div>
              </div>
            </div>
          </Link>
          <Link to="/app/knowledge" style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ cursor: 'pointer' }}>
              <div className="stat-icon secondary"><FiCheckCircle /></div>
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
