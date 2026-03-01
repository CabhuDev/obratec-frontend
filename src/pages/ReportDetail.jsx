import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { reportsAPI, organizationsAPI, mediaUrl } from '../services/api';
import { FiDownload, FiTrash2, FiEdit, FiArrowLeft, FiUpload, FiSend, FiX, FiCheck, FiImage, FiMic } from 'react-icons/fi';

function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [workflow, setWorkflow] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [toast, setToast] = useState(null);
  const [orgHasLogo, setOrgHasLogo] = useState(false);
  const photoInputRef = useRef(null);
  const audioInputRef = useRef(null);

  useEffect(() => { fetchReport(); }, [id]);

  useEffect(() => {
    organizationsAPI.get().then(res => {
      setOrgHasLogo(!!res.data.logo_url);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (report?.status === 'processing') {
      const interval = setInterval(pollWorkflow, 5000);
      return () => clearInterval(interval);
    }
  }, [report?.status]);

  const fetchReport = async () => {
    try {
      const res = await reportsAPI.get(id);
      setReport(res.data);
      setEditData({
        titulo: res.data.titulo || '',
        proyecto: res.data.proyecto || '',
        ubicacion: res.data.ubicacion || '',
        avance: res.data.avance || 0,
        observaciones: res.data.observaciones || '',
        incidencias: res.data.incidencias || '',
        include_logo: res.data.include_logo !== false,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
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
      // Auto-abrir PDF en nueva pestaña
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
    try {
      await reportsAPI.delete(id);
      navigate('/app/reports');
    } catch (e) { console.error(e); }
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
    try {
      await reportsAPI.update(id, editData);
      setEditing(false);
      fetchReport();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await reportsAPI.uploadPhoto(id, formData);
      fetchReport();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al subir foto');
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const deletePhoto = async (photoId) => {
    if (!confirm('¿Eliminar esta foto?')) return;
    try {
      await reportsAPI.deletePhoto(id, photoId);
      fetchReport();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al eliminar foto');
    }
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAudio(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await reportsAPI.uploadAudio(id, formData);
      fetchReport();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al subir audio');
    } finally {
      setUploadingAudio(false);
      if (audioInputRef.current) audioInputRef.current.value = '';
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

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (!report) return <div className="empty-state"><h3>Informe no encontrado</h3></div>;

  const badge = getStatusBadge(report.status);

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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!editing && report.status === 'draft' && (
            <button className="btn btn-outline" onClick={() => setEditing(true)}><FiEdit /> Editar</button>
          )}
          {report.status === 'completed' && (
            <button className="btn btn-primary" onClick={publishReport}><FiSend /> Publicar</button>
          )}
          <button className="btn btn-primary" onClick={generatePDF} disabled={generatingPdf}>
            {generatingPdf ? <><span className="spinner" style={{ width: 16, height: 16 }}></span> Generando...</> : <><FiDownload /> Generar PDF</>}
          </button>
          <button className="btn btn-danger" onClick={deleteReport}><FiTrash2 /></button>
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
            {toast.type === 'info' && <span className="spinner" style={{ width: 16, height: 16 }}></span>}
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
        <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(52, 152, 219, 0.05)', border: '1px solid rgba(52, 152, 219, 0.2)' }}>
          <h4 style={{ marginBottom: '0.75rem' }}>Procesando informe...</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <div style={{ flex: 1, height: '8px', background: 'var(--color-light-gray)', borderRadius: '4px' }}>
              <div style={{
                width: `${workflow.percentage || 0}%`,
                height: '100%',
                background: 'var(--color-info)',
                borderRadius: '4px',
                transition: 'width 0.5s ease'
              }} />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{workflow.percentage || 0}%</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Paso {workflow.current_step || 0} de {workflow.total_steps || 0}
            {workflow.current_step_name && ` — ${workflow.current_step_name}`}
          </p>
          {workflow.completed_steps && workflow.completed_steps.length > 0 && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
              {workflow.completed_steps.map((step, i) => (
                <span key={i} style={{ color: 'var(--color-tertiary)', marginRight: '0.75rem' }}>
                  <FiCheck style={{ verticalAlign: 'middle' }} /> {step}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
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
          {report.dynamic_fields && Object.keys(report.dynamic_fields).length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-header">
                <h3 className="card-title">Campos Específicos</h3>
              </div>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {Object.entries(report.dynamic_fields).map(([key, value]) => (
                  <div key={key}>
                    <strong style={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}:</strong>{' '}
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photos Section */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <h3 className="card-title"><FiImage style={{ verticalAlign: 'middle' }} /> Fotos</h3>
              <button className="btn btn-outline btn-sm" onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto}>
                <FiUpload /> {uploadingPhoto ? 'Subiendo...' : 'Subir Foto'}
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
            </div>
            {report.photos && report.photos.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                {report.photos.map((photo) => (
                  <div key={photo.id} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
                    <img
                      src={mediaUrl(photo.url)}
                      alt={photo.filename || 'Foto'}
                      style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }}
                      onClick={() => window.open(mediaUrl(photo.url), '_blank')}
                    />
                    <button
                      onClick={() => deletePhoto(photo.id)}
                      style={{
                        position: 'absolute', top: '4px', right: '4px',
                        background: 'rgba(231,76,60,0.9)', color: 'white',
                        border: 'none', borderRadius: '50%', width: '24px', height: '24px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No hay fotos adjuntas</p>
            )}
          </div>

          {/* Audio Section */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title"><FiMic style={{ verticalAlign: 'middle' }} /> Audio</h3>
              <button className="btn btn-outline btn-sm" onClick={() => audioInputRef.current?.click()} disabled={uploadingAudio}>
                <FiUpload /> {uploadingAudio ? 'Subiendo...' : 'Subir Audio'}
              </button>
              <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioUpload} style={{ display: 'none' }} />
            </div>
            {report.audios && report.audios.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {report.audios.map((audio, i) => (
                  <div key={audio.id || i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <audio controls src={mediaUrl(audio.url)} style={{ flex: 1 }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{audio.filename}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No hay archivos de audio</p>
            )}
            {report.transcription && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-bg-light)', borderRadius: '8px' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>Transcripción</h4>
                <p style={{ fontSize: '0.875rem' }}>{report.transcription}</p>
              </div>
            )}
          </div>
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
