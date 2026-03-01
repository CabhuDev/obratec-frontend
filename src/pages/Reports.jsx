import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI } from '../services/api';
import { FiPlus, FiSearch, FiTrash2, FiEye } from 'react-icons/fi';

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchReports();
  }, [search, statusFilter]);

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
      draft: { class: 'badge-warning', text: 'Borrador' },
      completed: { class: 'badge-success', text: 'Completado' },
      processing: { class: 'badge-info', text: 'Procesando' },
      published: { class: 'badge-success', text: 'Publicado' },
      failed: { class: 'badge-danger', text: 'Error' },
    };
    return badges[status] || badges.draft;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

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

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
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
        </div>
      </div>

      {/* Reports List */}
      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : reports.length > 0 ? (
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
                    <td style={{ fontSize: '0.875rem', textTransform: 'capitalize' }}>
                      {report.report_type || '—'}
                    </td>
                    <td>{formatDate(report.fecha)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '60px',
                          height: '6px',
                          background: 'var(--color-light-gray)',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${report.avance}%`,
                            height: '100%',
                            background: report.avance >= 100 ? 'var(--color-tertiary)' : 'var(--color-primary)',
                            borderRadius: '3px'
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
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No hay informes</h3>
            <p>Crea tu primer informe de obra</p>
            <Link to="/app/reports/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              <FiPlus /> Crear Informe
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
