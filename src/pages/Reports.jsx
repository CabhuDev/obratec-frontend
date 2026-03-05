import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI, mediaUrl } from '../services/api';
import {
  FiPlus, FiSearch, FiTrash2, FiEye,
  FiGrid, FiList, FiCalendar, FiFileText,
} from 'react-icons/fi';
import SkeletonLoader from '../components/SkeletonLoader';

// Etiquetas en español para cada tipo de informe
const TYPE_LABELS = {
  obra: 'Obra', visita: 'Visita', reunion: 'Reunión',
  seguridad: 'Seguridad', calidad: 'Calidad', personalizado: 'Personalizado',
};

// Paleta de colores para identificar proyectos visualmente
// Usa los valores hex reales del sistema de diseño + complementarios
const PROJECT_PALETTE = [
  '#F79B72', // --primary
  '#2A4759', // --secondary
  '#3B8C88', // --tertiary
  '#6366f1', '#0891b2', '#059669', '#d97706', '#be185d',
];

const projectColor = (name = '') => {
  const hash = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PROJECT_PALETTE[hash % PROJECT_PALETTE.length];
};

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [view, setView] = useState(
    () => localStorage.getItem('reports_view') || 'list'
  );

  useEffect(() => { fetchReports(); }, [search, statusFilter]);

  const fetchReports = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status_filter = statusFilter;
      const response = await reportsAPI.list(params);
      setReports(response.data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchView = (v) => {
    setView(v);
    localStorage.setItem('reports_view', v);
  };

  const deleteReport = async (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este informe?')) return;
    try {
      await reportsAPI.delete(id);
      fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
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

  // Agrupa y ordena por nombre de proyecto (solo se recalcula cuando cambian los reports)
  const groupedReports = useMemo(() => {
    const groups = {};
    reports.forEach(r => {
      const key = r.proyecto || 'Sin proyecto';
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b, 'es'));
  }, [reports]);

  return (
    <div className="fade-in">
      <div className="dashboard-header">
        <div>
          <h2>Mis Informes</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Gestiona todos tus informes de obra
          </p>
        </div>
        <Link to="/app/reports/new" className="btn btn-primary">
          <FiPlus /> Nuevo Informe
        </Link>
      </div>

      {/* Filters + View Toggle */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <FiSearch style={{
              position: 'absolute', left: '1rem', top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-secondary)',
            }} />
            <input
              type="text"
              className="form-input"
              placeholder="Buscar informes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          <select
            className="form-input"
            style={{ width: '200px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="completed">Completado</option>
            <option value="processing">Procesando</option>
            <option value="failed">Error</option>
          </select>

          {/* Toggle lista / galería */}
          <div style={{
            display: 'flex',
            border: '1px solid var(--color-light-gray)',
            borderRadius: '8px',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            {[
              { id: 'list',    Icon: FiList,  title: 'Vista lista' },
              { id: 'gallery', Icon: FiGrid,  title: 'Vista galería por proyecto' },
            ].map(({ id, Icon, title }, i) => (
              <button
                key={id}
                onClick={() => switchView(id)}
                title={title}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: view === id ? 'var(--secondary)' : 'transparent',
                  color: view === id ? 'white' : 'var(--text-secondary)',
                  border: 'none',
                  borderLeft: i > 0 ? '1px solid var(--color-light-gray)' : 'none',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonLoader type="card" count={3} />
      ) : reports.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No hay informes</h3>
            <p>Crea tu primer informe de obra</p>
            <Link to="/app/reports/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              <FiPlus /> Crear Informe
            </Link>
          </div>
        </div>

      ) : view === 'list' ? (
        /* ── VISTA LISTA ─────────────────────────────────────────────── */
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th>Avance</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <strong>{report.proyecto}</strong>
                      {report.titulo && (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {report.titulo}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {TYPE_LABELS[report.report_type] || report.report_type || '—'}
                    </td>
                    <td>{formatDate(report.fecha)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '60px', height: '6px',
                          background: 'var(--color-light-gray)', borderRadius: '3px', overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${report.avance}%`, height: '100%', borderRadius: '3px',
                            background: report.avance >= 100 ? 'var(--color-tertiary)' : 'var(--color-primary)',
                          }} />
                        </div>
                        <span style={{ fontSize: '0.875rem' }}>{report.avance}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(report.status).class}`}>
                        {getStatusBadge(report.status).text}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link to={`/app/reports/${report.id}`} className="btn btn-outline btn-sm">
                          <FiEye />
                        </Link>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteReport(report.id)}>
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      ) : (
        /* ── VISTA GALERÍA agrupada por proyecto — estantería A4 ─────── */
        <div>
          {groupedReports.map(([projectName, projectReports]) => {
            const color = projectColor(projectName);
            return (
              <div key={projectName} style={{ marginBottom: '2.5rem' }}>

                {/* Cabecera de proyecto */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '8px',
                    background: color, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: '0.9rem',
                    boxShadow: `0 2px 6px ${color}55`,
                  }}>
                    {projectName.charAt(0).toUpperCase()}
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {projectName}
                  </h3>
                  <span style={{
                    fontSize: '0.75rem', color: 'var(--text-secondary)',
                    background: 'var(--color-bg-light)',
                    padding: '2px 10px', borderRadius: '100px',
                    border: '1px solid var(--color-light-gray)',
                  }}>
                    {projectReports.length} {projectReports.length === 1 ? 'informe' : 'informes'}
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--color-light-gray)' }} />
                </div>

                {/* Estantería de cards A4 */}
                <div className="report-shelf">
                  {projectReports.map((report) => {
                    const badge = getStatusBadge(report.status);
                    const thumb = report.photos?.[0]?.url;

                    return (
                      <div key={report.id} className="report-shelf-item">
                        <Link to={`/app/reports/${report.id}`} className="report-card-a4">

                          {/* Zona thumbnail */}
                          <div className="report-card-a4-thumb">
                            <div className="report-card-a4-strip" style={{ background: color }} />
                            {thumb ? (
                              <img
                                src={mediaUrl(thumb)}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                              />
                            ) : (
                              <div style={{
                                width: '100%', height: '100%',
                                background: `${color}12`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <FiFileText size={30} style={{ color, opacity: 0.3 }} />
                              </div>
                            )}
                          </div>

                          {/* Zona metadatos */}
                          <div className="report-card-a4-meta">
                            {/* Tipo + Estado */}
                            <div style={{
                              display: 'flex', justifyContent: 'space-between',
                              alignItems: 'center', gap: '0.3rem', marginBottom: '0.35rem',
                            }}>
                              <span style={{
                                fontSize: '0.6rem', fontWeight: 600,
                                color: 'var(--secondary)',
                                background: 'rgba(42,71,89,0.07)',
                                padding: '1px 5px', borderRadius: '3px',
                                textTransform: 'capitalize',
                              }}>
                                {TYPE_LABELS[report.report_type] || report.report_type}
                              </span>
                              <span className={`badge ${badge.class}`} style={{ fontSize: '0.55rem', padding: '1px 5px' }}>
                                {badge.text}
                              </span>
                            </div>

                            {/* Título */}
                            <p style={{
                              margin: '0 0 0.3rem',
                              fontWeight: 600, fontSize: '0.78rem', lineHeight: 1.25,
                              color: 'var(--text-primary)',
                              overflow: 'hidden', display: '-webkit-box',
                              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                            }}>
                              {report.titulo || report.proyecto}
                            </p>

                            {/* Fecha */}
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: '0.25rem',
                              fontSize: '0.62rem', color: 'var(--text-secondary)',
                              marginBottom: '0.4rem',
                            }}>
                              <FiCalendar size={9} />
                              {formatDate(report.fecha)}
                            </div>

                            {/* Barra de avance */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <div style={{
                                flex: 1, height: '3px',
                                background: 'var(--color-light-gray)', borderRadius: '2px',
                              }}>
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Reports;
