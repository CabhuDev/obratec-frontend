import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { reportsAPI, organizationsAPI } from '../services/api';
import { FiPlus, FiAlertCircle, FiX, FiInfo, FiCheck, FiArrowRight, FiCamera, FiMic } from 'react-icons/fi';
import SkeletonLoader from '../components/SkeletonLoader';
import MediaUploadSection from '../components/MediaUploadSection';

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

  // Dynamic types from API
  const [reportTypes, setReportTypes] = useState([]);
  const [fieldDefinitions, setFieldDefinitions] = useState({});
  const [typesLoading, setTypesLoading] = useState(true);

  // Phase 2: report created, now add media
  const [createdReport, setCreatedReport] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    organizationsAPI.get().then(res => {
      setOrgHasLogo(!!res.data.logo_url);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await reportsAPI.getTypes();
        const data = res.data;
        setReportTypes(data.types || []);
        setFieldDefinitions(data.fields || {});
        if (data.types?.length > 0) {
          setReportType(data.types[0].value);
        }
      } catch (e) {
        setReportTypes([
          { value: 'obra', label: 'Obra' },
          { value: 'visita', label: 'Visita' },
          { value: 'reunion', label: 'Reunion' },
          { value: 'seguridad', label: 'Seguridad' },
          { value: 'calidad', label: 'Calidad' },
          { value: 'personalizado', label: 'Personalizado' },
        ]);
      } finally {
        setTypesLoading(false);
      }
    };
    fetchTypes();
  }, []);

  const handleTypeChange = (newType) => {
    setReportType(newType);
    setDynamicFields({});
  };

  const handleDynamicFieldChange = (key, value) => {
    setDynamicFields(prev => ({ ...prev, [key]: value }));
  };

  const handleArrayFieldAdd = (key, value) => {
    if (!value.trim()) return;
    const current = dynamicFields[key] || [];
    setDynamicFields(prev => ({ ...prev, [key]: [...current, value.trim()] }));
  };

  const handleArrayFieldRemove = (key, index) => {
    const current = dynamicFields[key] || [];
    setDynamicFields(prev => ({ ...prev, [key]: current.filter((_, i) => i !== index) }));
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
      // Stay on page: enter phase 2 (media upload)
      setCreatedReport({ ...res.data, photos: res.data.photos || [], audios: res.data.audios || [] });
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

  const refreshCreatedReport = async () => {
    if (!createdReport?.id) return;
    try {
      const res = await reportsAPI.get(createdReport.id);
      setCreatedReport(res.data);
    } catch {}
  };

  const currentFieldDefs = fieldDefinitions[reportType] || {};
  const currentDynamicFields = Object.entries(currentFieldDefs);

  const renderDynamicField = (key, fieldDef) => {
    const { type, label, required, options, min, max } = fieldDef;
    const value = dynamicFields[key];

    switch (type) {
      case 'select':
        return (
          <select
            id={key}
            className="form-input"
            value={value || ''}
            onChange={(e) => handleDynamicFieldChange(key, e.target.value)}
            required={required}
          >
            <option value="">Seleccionar...</option>
            {(options || []).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'array':
        return (
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                id={key}
                className="form-input"
                placeholder={`Añadir ${label.toLowerCase()}...`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleArrayFieldAdd(key, e.target.value);
                    e.target.value = '';
                  }
                }}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  const input = document.getElementById(key);
                  if (input) {
                    handleArrayFieldAdd(key, input.value);
                    input.value = '';
                  }
                }}
              >
                <FiPlus />
              </button>
            </div>
            {(value || []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {(value || []).map((item, i) => (
                  <span key={i} className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem' }}>
                    {item}
                    <button
                      type="button"
                      onClick={() => handleArrayFieldRemove(key, i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', lineHeight: 1 }}
                    >
                      <FiX size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        );

      case 'number':
        return (
          <input
            id={key}
            type="number"
            className="form-input"
            value={value || ''}
            onChange={(e) => handleDynamicFieldChange(key, parseFloat(e.target.value) || 0)}
            min={min}
            max={max}
            required={required}
          />
        );

      case 'email':
        return (
          <input
            id={key}
            type="email"
            className="form-input"
            value={value || ''}
            onChange={(e) => handleDynamicFieldChange(key, e.target.value)}
            required={required}
            placeholder="email@ejemplo.com"
          />
        );

      case 'textarea':
        return (
          <textarea
            id={key}
            className="form-input"
            value={value || ''}
            onChange={(e) => handleDynamicFieldChange(key, e.target.value)}
            rows={3}
            required={required}
          />
        );

      case 'date':
        return (
          <input
            id={key}
            type="date"
            className="form-input"
            value={value || ''}
            onChange={(e) => handleDynamicFieldChange(key, e.target.value)}
            required={required}
          />
        );

      case 'time':
        return (
          <input
            id={key}
            type="time"
            className="form-input"
            value={value || ''}
            onChange={(e) => handleDynamicFieldChange(key, e.target.value)}
            required={required}
          />
        );

      default:
        return (
          <input
            id={key}
            type="text"
            className="form-input"
            value={value || ''}
            onChange={(e) => handleDynamicFieldChange(key, e.target.value)}
            required={required}
          />
        );
    }
  };

  if (typesLoading) {
    return (
      <div className="fade-in">
        <div className="dashboard-header">
          <div><h2>Nuevo Informe</h2><p style={{ color: 'var(--text-secondary)' }}>Crea un nuevo informe de obra</p></div>
        </div>
        <SkeletonLoader type="card" count={2} />
      </div>
    );
  }

  // ─── Phase 2: Borrador creado, añadir multimedia ──────────────────────────
  if (createdReport) {
    return (
      <div className="fade-in">
        <div className="dashboard-header">
          <div>
            <h2>Nuevo Informe</h2>
            <p style={{ color: 'var(--text-secondary)' }}>{createdReport.titulo || createdReport.proyecto}</p>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{
            padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
            background: toast.type === 'success' ? 'rgba(59, 140, 136, 0.1)' : toast.type === 'error' ? 'rgba(231, 76, 60, 0.1)' : 'rgba(52, 152, 219, 0.1)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(59, 140, 136, 0.3)' : toast.type === 'error' ? 'rgba(231, 76, 60, 0.3)' : 'rgba(52, 152, 219, 0.3)'}`,
            color: toast.type === 'success' ? 'var(--color-tertiary)' : toast.type === 'error' ? 'var(--color-danger)' : 'var(--color-info, #3498db)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {toast.type === 'success' && <FiCheck />}
              {toast.type === 'error' && <FiX />}
              <span style={{ fontWeight: 500 }}>{toast.message}</span>
            </div>
            <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
              <FiX size={16} />
            </button>
          </div>
        )}

        {/* Confirmación borrador */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '1rem 1.25rem', marginBottom: '1.5rem',
          background: 'rgba(59, 140, 136, 0.08)',
          border: '1px solid rgba(59, 140, 136, 0.25)',
          borderRadius: '10px',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--color-tertiary)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <FiCheck size={18} />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-tertiary)' }}>Borrador creado correctamente</p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Ahora puedes adjuntar <strong>fotos</strong> y <strong>grabaciones de voz</strong> antes de finalizar el informe.
            </p>
          </div>
        </div>

        {/* Secciones de multimedia */}
        <MediaUploadSection
          reportId={createdReport.id}
          photos={createdReport.photos || []}
          audios={createdReport.audios || []}
          onRefresh={refreshCreatedReport}
          showToast={setToast}
        />

        {/* CTA final */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/app/reports/${createdReport.id}`)}
          >
            Ver informe completo <FiArrowRight />
          </button>
          <Link to="/app/reports" className="btn btn-outline">
            Ir a mis informes
          </Link>
        </div>
      </div>
    );
  }

  // ─── Phase 1: Formulario de creación ─────────────────────────────────────
  return (
    <div className="fade-in">
      <div className="dashboard-header">
        <div><h2>Nuevo Informe</h2><p style={{ color: 'var(--text-secondary)' }}>Crea un nuevo informe de obra</p></div>
      </div>

      <div className="card">
        {/* Hint banner */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
          padding: '0.875rem 1rem',
          background: 'rgba(247, 155, 114, 0.08)',
          border: '1px solid rgba(247, 155, 114, 0.3)',
          borderRadius: '8px',
          marginBottom: '1.5rem',
        }}>
          <FiInfo style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} size={16} />
          <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--primary)' }}>Tip:</strong> Rellena los datos del informe y haz clic en <em>Crear borrador</em>.
            Después podrás añadir{' '}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
              <FiCamera size={13} /> fotos
            </span>{' '}y{' '}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
              <FiMic size={13} /> grabaciones de voz
            </span>{' '}
            directamente en esta misma página, sin salir del flujo de creación.
          </div>
        </div>

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

          <div className="grid-2col">
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
              {currentDynamicFields.map(([key, fieldDef]) => (
                <div className="form-group" key={key}>
                  <label htmlFor={key} className="form-label">
                    {fieldDef.label || key.replace(/_/g, ' ')}
                    {fieldDef.required && ' *'}
                  </label>
                  {renderDynamicField(key, fieldDef)}
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
              {loading ? 'Creando...' : 'Crear borrador'}
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
