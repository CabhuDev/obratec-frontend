import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { reportsAPI, organizationsAPI } from '../services/api';
import { FiPlus, FiAlertCircle } from 'react-icons/fi';

const DYNAMIC_FIELDS_CONFIG = {
  visita: [
    { key: 'fecha_visita', label: 'Fecha de Visita', type: 'date' },
    { key: 'hora_llegada', label: 'Hora de Llegada', type: 'time' },
    { key: 'hora_salida', label: 'Hora de Salida', type: 'time' },
    { key: 'responsable', label: 'Responsable', type: 'text' },
    { key: 'hallazgos', label: 'Hallazgos', type: 'textarea' },
    { key: 'recomendaciones', label: 'Recomendaciones', type: 'textarea' },
  ],
  reunion: [
    { key: 'hora_inicio', label: 'Hora de Inicio', type: 'time' },
    { key: 'hora_fin', label: 'Hora de Fin', type: 'time' },
    { key: 'lugar', label: 'Lugar', type: 'text' },
    { key: 'asistentes', label: 'Asistentes', type: 'textarea' },
    { key: 'orden_dia', label: 'Orden del Día', type: 'textarea' },
    { key: 'acuerdos', label: 'Acuerdos', type: 'textarea' },
    { key: 'prox_reunion', label: 'Próxima Reunión', type: 'date' },
  ],
  seguridad: [
    { key: 'zona', label: 'Zona', type: 'text' },
    { key: 'medidas_seguridad', label: 'Medidas de Seguridad', type: 'textarea' },
    { key: 'incidentes', label: 'Incidentes', type: 'textarea' },
    { key: 'epis_utilizados', label: 'EPIs Utilizados', type: 'textarea' },
    { key: 'cumplimiento_normativa', label: 'Cumplimiento Normativa', type: 'textarea' },
  ],
  calidad: [
    { key: 'elemento_controlado', label: 'Elemento Controlado', type: 'text' },
    { key: 'criterios_aceptacion', label: 'Criterios de Aceptación', type: 'textarea' },
    { key: 'resultados', label: 'Resultados', type: 'textarea' },
    { key: 'conformidad', label: 'Conformidad', type: 'text' },
  ],
};

function CreateReport() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportType, setReportType] = useState('obra');
  const [formData, setFormData] = useState({
    titulo: '', proyecto: '', fecha: new Date().toISOString().slice(0, 16), ubicacion: '', avance: 0, observaciones: '', incidencias: '', email_destino: ''
  });
  const [dynamicFields, setDynamicFields] = useState({});
  const [orgHasLogo, setOrgHasLogo] = useState(false);
  const [includeLogo, setIncludeLogo] = useState(true);

  useEffect(() => {
    organizationsAPI.get().then(res => {
      setOrgHasLogo(!!res.data.logo_url);
    }).catch(() => {});
  }, []);

  const reportTypes = [
    { value: 'obra', label: 'Informe de Obra' },
    { value: 'visita', label: 'Informe de Visita' },
    { value: 'reunion', label: 'Acta de Reunión' },
    { value: 'seguridad', label: 'Informe de Seguridad' },
    { value: 'calidad', label: 'Control de Calidad' },
    { value: 'personalizado', label: 'Informe Personalizado' },
  ];

  const handleTypeChange = (newType) => {
    setReportType(newType);
    setDynamicFields({});
  };

  const handleDynamicFieldChange = (key, value) => {
    setDynamicFields(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const body = {
        ...formData,
        report_type: reportType,
        fecha: new Date(formData.fecha).toISOString(),
        include_logo: includeLogo,
      };
      if (Object.keys(dynamicFields).length > 0) {
        body.dynamic_fields = dynamicFields;
      }
      const res = await reportsAPI.create(body);
      navigate(`/app/reports/${res.data.id}`);
    } catch (e) {
      if (e.response?.status === 403) {
        setError('Límite de informes alcanzado. Mejora tu plan para crear más informes.');
      } else {
        setError(e.response?.data?.detail || 'Error al crear el informe');
      }
    } finally {
      setLoading(false);
    }
  };

  const currentDynamicFields = DYNAMIC_FIELDS_CONFIG[reportType] || [];

  return (
    <div className="fade-in">
      <div className="dashboard-header">
        <div><h2>Nuevo Informe</h2><p style={{ color: 'var(--text-secondary)' }}>Crea un nuevo informe de obra</p></div>
      </div>

      <div className="card">
        {error && (
          <div style={{
            background: 'rgba(231, 76, 60, 0.1)',
            color: 'var(--color-danger)',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <FiAlertCircle />
            {error}
            {error.includes('Mejora tu plan') && (
              <Link to="/app/settings" style={{ marginLeft: 'auto', fontWeight: 600 }}>Ver planes</Link>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="report-type" className="form-label">Tipo de Informe</label>
            <select id="report-type" className="form-input" value={reportType} onChange={(e) => handleTypeChange(e.target.value)}>
              {reportTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Título (opcional)</label>
            <input className="form-input" value={formData.titulo} onChange={(e) => setFormData({...formData, titulo: e.target.value})} placeholder="Título del informe" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="proyecto" className="form-label">Proyecto *</label>
              <input id="proyecto" className="form-input" value={formData.proyecto} onChange={(e) => setFormData({...formData, proyecto: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha *</label>
              <input type="datetime-local" className="form-input" value={formData.fecha} onChange={(e) => setFormData({...formData, fecha: e.target.value})} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Ubicación</label>
            <input className="form-input" value={formData.ubicacion} onChange={(e) => setFormData({...formData, ubicacion: e.target.value})} placeholder="Dirección o ubicación" />
          </div>

          <div className="form-group">
            <label className="form-label">Avance (%)</label>
            <input type="number" className="form-input" value={formData.avance} onChange={(e) => setFormData({...formData, avance: parseInt(e.target.value) || 0})} min={0} max={100} />
          </div>

          <div className="form-group">
            <label className="form-label">Observaciones</label>
            <textarea className="form-input" value={formData.observaciones} onChange={(e) => setFormData({...formData, observaciones: e.target.value})} rows={4} placeholder="Observaciones del informe..." />
          </div>

          <div className="form-group">
            <label className="form-label">Incidencias</label>
            <textarea className="form-input" value={formData.incidencias} onChange={(e) => setFormData({...formData, incidencias: e.target.value})} rows={3} placeholder="Incidencias reportadas..." />
          </div>

          <div className="form-group">
            <label className="form-label">Email Destino</label>
            <input type="email" className="form-input" value={formData.email_destino} onChange={(e) => setFormData({...formData, email_destino: e.target.value})} placeholder="email@ejemplo.com" />
          </div>

          {/* Dynamic Fields */}
          {currentDynamicFields.length > 0 && (
            <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'var(--color-bg-light)', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '1rem' }}>Campos específicos: {reportTypes.find(t => t.value === reportType)?.label}</h4>
              {currentDynamicFields.map(field => (
                <div className="form-group" key={field.key}>
                  <label htmlFor={field.key} className="form-label">{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      id={field.key}
                      className="form-input"
                      value={dynamicFields[field.key] || ''}
                      onChange={(e) => handleDynamicFieldChange(field.key, e.target.value)}
                      rows={3}
                    />
                  ) : (
                    <input
                      id={field.key}
                      type={field.type}
                      className="form-input"
                      value={dynamicFields[field.key] || ''}
                      onChange={(e) => handleDynamicFieldChange(field.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Include Logo Checkbox */}
          {orgHasLogo && (
            <div style={{ marginTop: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.95rem' }}>
                <input
                  type="checkbox"
                  checked={includeLogo}
                  onChange={(e) => setIncludeLogo(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                Incluir logo de empresa en el informe
              </label>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Informe'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/app/reports')}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateReport;
