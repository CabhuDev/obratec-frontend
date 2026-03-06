import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { reportsAPI, organizationsAPI, mediaUrl } from '../services/api';
import { FiDownload, FiTrash2, FiEdit, FiArrowLeft, FiSend, FiX, FiCheck, FiAlertTriangle, FiPlus } from 'react-icons/fi';
import AIReportSections from '../components/AIReportSections';
import SkeletonLoader from '../components/SkeletonLoader';
import MediaUploadSection from '../components/MediaUploadSection';

function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [editDynamicFields, setEditDynamicFields] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [workflow, setWorkflow] = useState(null);
  const aiPollControllerRef = useRef(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [toast, setToast] = useState(null);
  const [orgHasLogo, setOrgHasLogo] = useState(false);
  const [fieldDefinitions, setFieldDefinitions] = useState({});

  useEffect(() => { fetchReport(); }, [id]);

  useEffect(() => {
    organizationsAPI.get().then(res => {
      setOrgHasLogo(!!res.data.logo_url);
    }).catch(() => {});
  }, []);

  // Fetch field definitions for dynamic field editing
  useEffect(() => {
    reportsAPI.getTypes().then(res => {
      setFieldDefinitions(res.data.fields || {});
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (report?.status === 'processing') {
      const interval = setInterval(pollWorkflow, 5000);
      return () => clearInterval(interval);
    }
  }, [report?.status]);

  // Poll for AI analysis completion on photos/audio
  const hasUnanalyzedPhotos = report?.photos?.some(p => p.ai_description === null || p.ai_description === undefined);
  const hasUntranscribedAudio = report?.audios?.some(a => !a.transcripcion_completada);

  useEffect(() => {
    if (hasUnanalyzedPhotos || hasUntranscribedAudio) {
      const interval = setInterval(() => {
        aiPollControllerRef.current?.abort();
        aiPollControllerRef.current = new AbortController();
        fetchReport(true, aiPollControllerRef.current.signal);
      }, 10000);
      return () => {
        clearInterval(interval);
        aiPollControllerRef.current?.abort();
      };
    }
  }, [hasUnanalyzedPhotos, hasUntranscribedAudio]);

  const fetchReport = async (silent = false, signal = null) => {
    try {
      const res = await reportsAPI.get(id, signal);
      setReport(res.data);
      if (!silent) {
        setEditData({
          titulo: res.data.titulo || '',
          proyecto: res.data.proyecto || '',
          ubicacion: res.data.ubicacion || '',
          avance: res.data.avance || 0,
          observaciones: res.data.observaciones || '',
          incidencias: res.data.incidencias || '',
          include_logo: res.data.include_logo !== false,
        });
        setEditDynamicFields(res.data.dynamic_fields || {});
      }
    } catch (e) {
      if (e.name === 'CanceledError' || e.code === 'ERR_CANCELED') return;
      console.error(e);
    } finally { if (!silent) setLoading(false); }
  };

  const pollWorkflow = async () => {
    try {
      const res = await reportsAPI.getWorkflowStatus(id);
      setWorkflow(res.data);
      if (res.data.status === 'completed' || res.data.status === 'failed') {
        fetchReport();
      }
    } catch (e) { /* ignore polling errors */ }
  };

  const generatePDF = async () => {
    setGeneratingPdf(true);
    setToast({ type: 'info', message: 'Generando PDF...' });
    try {
      const res = await reportsAPI.generatePDF(id);
      const pdfUrl = res.data?.pdf_url;
      setToast({ type: 'success', message: 'PDF generado correctamente', pdfUrl });
      fetchReport();
      if (pdfUrl) {
        window.open(mediaUrl(pdfUrl), '_blank');
      }
    } catch (e) {
      setToast({ type: 'error', message: e.response?.data?.detail || 'Error al generar el PDF' });
    } finally {
      setGeneratingPdf(false);
    }
  };

  const deleteReport = async () => {
    if (!confirm('¿Eliminar informe?')) return;
    setDeleting(true);
    try {
      await reportsAPI.delete(id);
      navigate('/app/reports');
    } catch (e) {
      console.error(e);
      setDeleting(false);
    }
  };

  const publishReport = async () => {
    try {
      await reportsAPI.publish(id);
      fetchReport();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al publicar');
    }
  };

  const saveEdit = async () => {
    setSaving(true);
    const originalReport = report;
    // Optimistic: aplica los cambios inmediatamente y cierra el editor
    setReport(prev => ({
      ...prev,
      ...editData,
      dynamic_fields: Object.keys(editDynamicFields).length > 0 ? editDynamicFields : prev.dynamic_fields,
    }));
    setEditing(false);
    try {
      const payload = { ...editData };
      if (Object.keys(editDynamicFields).length > 0) {
        payload.dynamic_fields = editDynamicFields;
      }
      await reportsAPI.update(id, payload);
      fetchReport(true); // sincroniza con el servidor silenciosamente
    } catch (e) {
      // Rollback: restaura el estado original y reabre el editor
      setReport(originalReport);
      setEditing(true);
      alert(e.response?.data?.detail || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { class: 'badge-warning', text: 'Borrador' },
      completed: { class: 'badge-success', text: 'Completado' },
      processing: { class: 'badge-info', text: 'Procesando' },
      failed: { class: 'badge-danger', text: 'Error' },
      published: { class: 'badge-success', text: 'Publicado' },
    };
    return badges[status] || badges.draft;
  };

  // Dynamic field editing helpers
  const handleEditDynamicField = (key, value) => {
    setEditDynamicFields(prev => ({ ...prev, [key]: value }));
  };

  const handleEditArrayFieldAdd = (key, value) => {
    if (!value.trim()) return;
    const current = editDynamicFields[key] || [];
    setEditDynamicFields(prev => ({ ...prev, [key]: [...current, value.trim()] }));
  };

  const handleEditArrayFieldRemove = (key, index) => {
    const current = editDynamicFields[key] || [];
    setEditDynamicFields(prev => ({ ...prev, [key]: current.filter((_, i) => i !== index) }));
  };

  const renderEditDynamicField = (key, fieldDef) => {
    const { type, label, options, min, max } = fieldDef;
    const value = editDynamicFields[key];

    switch (type) {
      case 'select':
        return (
          <select className="form-input" value={value || ''} onChange={(e) => handleEditDynamicField(key, e.target.value)}>
            <option value="">Seleccionar...</option>
            {(options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      case 'array':
        return (
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                className="form-input"
                placeholder={`Añadir...`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleEditArrayFieldAdd(key, e.target.value);
                    e.target.value = '';
                  }
                }}
                style={{ flex: 1 }}
              />
            </div>
            {(value || []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {(value || []).map((item, i) => (
                  <span key={i} className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    {item}
                    <button type="button" onClick={() => handleEditArrayFieldRemove(key, i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit' }}>
                      <FiX size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      case 'number':
        return <input type="number" className="form-input" value={value || ''} onChange={(e) => handleEditDynamicField(key, parseFloat(e.target.value) || 0)} min={min} max={max} />;
      case 'textarea':
        return <textarea className="form-input" value={value || ''} onChange={(e) => handleEditDynamicField(key, e.target.value)} rows={3} />;
      default:
        return <input type={type || 'text'} className="form-input" value={value || ''} onChange={(e) => handleEditDynamicField(key, e.target.value)} />;
    }
  };

  if (loading) return <SkeletonLoader type="card" count={3} />;
  if (!report) return <div className="empty-state"><h3>Informe no encontrado</h3></div>;

  const badge = getStatusBadge(report.status);

  // Extract workflow info from steps_log
  const workflowProgress = workflow?.progress || 0;
  const workflowStepsLog = workflow?.steps_log || [];
  const completedSteps = workflowStepsLog.filter(s => s.status === 'completed');
  const currentStepName = workflowStepsLog.length > 0 ? workflowStepsLog[workflowStepsLog.length - 1]?.step_name : null;

  // Get field definitions for current report type
  const currentFieldDefs = fieldDefinitions[report.report_type] || {};

  return (
    <div className="fade-in">
      <div className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/app/reports" className="btn btn-outline btn-sm"><FiArrowLeft /></Link>
          <div>
            <h2>{report.titulo || report.proyecto}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>{new Date(report.fecha).toLocaleDateString('es-ES')}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {!editing && report.status === 'draft' && (
            <button className="btn btn-outline" onClick={() => setEditing(true)}><FiEdit /> Editar</button>
          )}
          {report.status === 'completed' && (
            <button className="btn btn-primary" onClick={publishReport}><FiSend /> Publicar</button>
          )}
          <button className="btn btn-primary" onClick={generatePDF} disabled={generatingPdf}>
            {generatingPdf ? 'Generando...' : <><FiDownload /> Generar PDF</>}
          </button>
          <button className="btn btn-danger" onClick={deleteReport} disabled={deleting}>{deleting ? 'Eliminando...' : <FiTrash2 />}</button>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          background: toast.type === 'success' ? 'rgba(59, 140, 136, 0.1)' : toast.type === 'error' ? 'rgba(231, 76, 60, 0.1)' : 'rgba(52, 152, 219, 0.1)',
          border: `1px solid ${toast.type === 'success' ? 'rgba(59, 140, 136, 0.3)' : toast.type === 'error' ? 'rgba(231, 76, 60, 0.3)' : 'rgba(52, 152, 219, 0.3)'}`,
          color: toast.type === 'success' ? 'var(--color-tertiary)' : toast.type === 'error' ? 'var(--color-danger)' : 'var(--color-info, #3498db)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {toast.type === 'success' && <FiCheck />}
            {toast.type === 'error' && <FiX />}
            <span style={{ fontWeight: 500 }}>{toast.message}</span>
            {toast.pdfUrl && (
              <a href={mediaUrl(toast.pdfUrl)} target="_blank" rel="noreferrer"
                style={{ fontWeight: 600, textDecoration: 'underline', marginLeft: '0.5rem' }}>
                Abrir PDF
              </a>
            )}
          </div>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* Workflow Status */}
      {(report.status === 'processing' || workflow) && workflow && (
        <div className="card" style={{ marginBottom: '1.5rem', background: workflow.status === 'failed' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(52, 152, 219, 0.05)', border: `1px solid ${workflow.status === 'failed' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(52, 152, 219, 0.2)'}` }}>
          <h4 style={{ marginBottom: '0.75rem' }}>
            {workflow.status === 'failed' ? 'Error en el procesamiento' : 'Procesando informe...'}
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <div style={{ flex: 1, height: '8px', background: 'var(--color-light-gray)', borderRadius: '4px' }}>
              <div style={{
                width: `${workflowProgress}%`,
                height: '100%',
                background: workflow.status === 'failed' ? 'var(--color-danger)' : 'var(--color-info)',
                borderRadius: '4px',
                transition: 'width 0.5s ease'
              }} />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{workflowProgress}%</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Paso {workflow.current_step || 0} de {workflow.total_steps || 0}
            {currentStepName && ` — ${currentStepName}`}
          </p>
          {completedSteps.length > 0 && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
              {completedSteps.map((step, i) => (
                <span key={i} style={{ color: 'var(--color-tertiary)', marginRight: '0.75rem' }}>
                  <FiCheck style={{ verticalAlign: 'middle' }} /> {step.step_name || step.name || `Paso ${i + 1}`}
                </span>
              ))}
            </div>
          )}
          {workflow.status === 'failed' && workflow.error_message && (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--color-danger)' }}>
              <FiAlertTriangle style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
              {workflow.error_step && <strong>Error en: {workflow.error_step} — </strong>}
              {workflow.error_message}
            </div>
          )}
        </div>
      )}

      <div className="grid-main">
        <div>
          {/* Main Details */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <h3 className="card-title">Detalles del Informe</h3>
              <span className={`badge ${badge.class}`}>{badge.text}</span>
            </div>

            {editing ? (
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Título</label>
                  <input className="form-input" value={editData.titulo} onChange={(e) => setEditData({...editData, titulo: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Proyecto</label>
                  <input className="form-input" value={editData.proyecto} onChange={(e) => setEditData({...editData, proyecto: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Ubicación</label>
                  <input className="form-input" value={editData.ubicacion} onChange={(e) => setEditData({...editData, ubicacion: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Avance (%)</label>
                  <input type="number" className="form-input" value={editData.avance} onChange={(e) => setEditData({...editData, avance: parseInt(e.target.value) || 0})} min={0} max={100} />
                </div>
                <div className="form-group">
                  <label className="form-label">Observaciones</label>
                  <textarea className="form-input" value={editData.observaciones} onChange={(e) => setEditData({...editData, observaciones: e.target.value})} rows={4} />
                </div>
                <div className="form-group">
                  <label className="form-label">Incidencias</label>
                  <textarea className="form-input" value={editData.incidencias} onChange={(e) => setEditData({...editData, incidencias: e.target.value})} rows={3} />
                </div>

                {/* Dynamic Fields Edit */}
                {Object.keys(currentFieldDefs).length > 0 && (
                  <div style={{ padding: '1rem', background: 'var(--color-bg-light)', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '0.75rem' }}>Campos Específicos</h4>
                    {Object.entries(currentFieldDefs).map(([key, fieldDef]) => (
                      <div className="form-group" key={key}>
                        <label className="form-label">{fieldDef.label || key.replace(/_/g, ' ')}</label>
                        {renderEditDynamicField(key, fieldDef)}
                      </div>
                    ))}
                  </div>
                )}

                {orgHasLogo && (
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.95rem' }}>
                      <input
                        type="checkbox"
                        checked={editData.include_logo}
                        onChange={(e) => setEditData({...editData, include_logo: e.target.checked})}
                        style={{ width: '18px', height: '18px' }}
                      />
                      Incluir logo de empresa en el informe
                    </label>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button className="btn btn-outline" onClick={() => setEditing(false)}>Cancelar</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div><strong>Proyecto:</strong> {report.proyecto}</div>
                <div><strong>Ubicación:</strong> {report.ubicacion || 'No especificada'}</div>
                <div><strong>Avance:</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <div style={{ flex: 1, height: '8px', background: 'var(--color-light-gray)', borderRadius: '4px' }}>
                      <div style={{ width: `${report.avance}%`, height: '100%', background: 'var(--color-primary)', borderRadius: '4px' }} />
                    </div>
                    <span>{report.avance}%</span>
                  </div>
                </div>
                {report.observaciones && (<div><h4>Observaciones</h4><p>{report.observaciones}</p></div>)}
                {report.incidencias && (<div><h4>Incidencias</h4><p>{report.incidencias}</p></div>)}
              </div>
            )}
          </div>

          {/* Dynamic Fields */}
          {!editing && report.dynamic_fields && Object.keys(report.dynamic_fields).length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-header">
                <h3 className="card-title">Campos Específicos</h3>
              </div>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {Object.entries(report.dynamic_fields).map(([key, value]) => (
                  <div key={key}>
                    <strong style={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}:</strong>{' '}
                    <span>{Array.isArray(value) ? value.join(', ') : value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photos & Audio */}
          <MediaUploadSection
            reportId={id}
            photos={report.photos || []}
            audios={report.audios || []}
            onRefresh={fetchReport}
            showToast={setToast}
          />

          {/* AI Report Sections */}
          <AIReportSections
            reportId={id}
            reportType={report.report_type}
            onContentUpdate={fetchReport}
          />
        </div>

        {/* Sidebar Info */}
        <div>
          <div className="card"><h4>Información</h4>
            <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem', fontSize: '0.875rem' }}>
              <div><span style={{ color: 'var(--text-secondary)' }}>Tipo:</span> {report.report_type}</div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Estado:</span> <span className={`badge ${badge.class}`}>{badge.text}</span></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Creado:</span> {new Date(report.created_at).toLocaleDateString('es-ES')}</div>
              {report.updated_at && (
                <div><span style={{ color: 'var(--text-secondary)' }}>Actualizado:</span> {new Date(report.updated_at).toLocaleDateString('es-ES')}</div>
              )}
              {report.pdf_url && <div><span style={{ color: 'var(--text-secondary)' }}>PDF:</span> <a href={mediaUrl(report.pdf_url)} target="_blank" rel="noreferrer">Descargar</a></div>}
              {report.email_destino && <div><span style={{ color: 'var(--text-secondary)' }}>Email destino:</span> {report.email_destino}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportDetail;
