import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { reportsAPI, organizationsAPI, mediaUrl } from '../services/api';
import { FiDownload, FiTrash2, FiEdit, FiArrowLeft, FiUpload, FiSend, FiX, FiCheck, FiImage, FiMic, FiAlertTriangle, FiChevronDown, FiChevronUp, FiPlus, FiSquare } from 'react-icons/fi';
import AIReportSections from '../components/AIReportSections';
import SkeletonLoader from '../components/SkeletonLoader';

function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [editDynamicFields, setEditDynamicFields] = useState({});
  const [saving, setSaving] = useState(false);
  const [workflow, setWorkflow] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(null); // null | { current, total }
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [toast, setToast] = useState(null);
  const [orgHasLogo, setOrgHasLogo] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState(null);
  const [expandedAudio, setExpandedAudio] = useState(null);
  const [fieldDefinitions, setFieldDefinitions] = useState({});
  // Recording state
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const photoInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingStreamRef = useRef(null);

  useEffect(() => { fetchReport(); }, [id]);

  // Cleanup recording resources on unmount
  useEffect(() => {
    return () => {
      clearInterval(recordingTimerRef.current);
      recordingStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

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
      const interval = setInterval(() => { fetchReport(true); }, 10000);
      return () => clearInterval(interval);
    }
  }, [hasUnanalyzedPhotos, hasUntranscribedAudio]);

  const fetchReport = async (silent = false) => {
    try {
      const res = await reportsAPI.get(id);
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
    } catch (e) { console.error(e); }
    finally { if (!silent) setLoading(false); }
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
      const payload = { ...editData };
      if (Object.keys(editDynamicFields).length > 0) {
        payload.dynamic_fields = editDynamicFields;
      }
      await reportsAPI.update(id, payload);
      setEditing(false);
      fetchReport();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const compressImage = (file, maxWidth = 1920, quality = 0.85) =>
    new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })),
          'image/jpeg',
          quality
        );
      };
      img.src = url;
    });

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const MAX_FILES = 5;
    const selected = files.slice(0, MAX_FILES);
    if (files.length > MAX_FILES) {
      setToast({ type: 'info', message: `Se seleccionaron ${files.length} fotos, se subirán las primeras ${MAX_FILES}.` });
    }

    const errors = [];
    setUploadingPhoto({ current: 0, total: selected.length });

    for (let i = 0; i < selected.length; i++) {
      setUploadingPhoto({ current: i + 1, total: selected.length });
      try {
        const compressed = await compressImage(selected[i]);
        const formData = new FormData();
        formData.append('file', compressed);
        await reportsAPI.uploadPhoto(id, formData);
      } catch (err) {
        errors.push(selected[i].name);
      }
    }

    setUploadingPhoto(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
    fetchReport();

    if (errors.length) {
      setToast({ type: 'error', message: `Error al subir: ${errors.join(', ')}` });
    } else {
      setToast({ type: 'success', message: selected.length === 1 ? 'Foto subida correctamente' : `${selected.length} fotos subidas correctamente` });
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

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setToast({ type: 'error', message: 'Tu navegador no soporta grabación de audio.' });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;

      // Pick the best MIME type: mp4 for Safari iOS, webm/opus for Chrome/Android, ogg as fallback
      const mimeType = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
        .find(t => MediaRecorder.isTypeSupported(t)) || '';

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const finalType = mimeType || mr.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: finalType });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);
        stream.getTracks().forEach(t => t.stop());
      };

      mr.start(250); // collect chunks every 250ms
      setRecording(true);
      setRecordingTime(0);

      let elapsed = 0;
      recordingTimerRef.current = setInterval(() => {
        elapsed += 1;
        setRecordingTime(elapsed);
        if (elapsed >= 300) stopRecording(); // 5 min max
      }, 1000);
    } catch {
      setToast({ type: 'error', message: 'No se pudo acceder al micrófono. Verifica los permisos.' });
    }
  };

  const stopRecording = () => {
    clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    setRecording(false);
  };

  const discardRecording = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingTime(0);
  };

  const uploadRecording = async () => {
    if (!recordedBlob) return;
    setUploadingRecording(true);
    const mimeToExt = { 'audio/mp4': 'm4a', 'audio/webm': 'webm', 'audio/ogg': 'ogg' };
    const baseMime = recordedBlob.type.split(';')[0];
    const ext = mimeToExt[baseMime] || 'webm';
    const file = new File([recordedBlob], `grabacion-${Date.now()}.${ext}`, { type: recordedBlob.type });
    const formData = new FormData();
    formData.append('file', file);
    try {
      await reportsAPI.uploadAudio(id, formData);
      discardRecording();
      fetchReport();
      setToast({ type: 'success', message: 'Grabación subida correctamente' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.detail || 'Error al subir la grabación' });
    } finally {
      setUploadingRecording(false);
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

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${String(sec).padStart(2, '0')}`;
  };

  const getSentimentBadge = (sentimiento) => {
    if (!sentimiento) return null;
    const lower = sentimiento.toLowerCase();
    if (lower.includes('positiv')) return { class: 'badge-success', text: sentimiento };
    if (lower.includes('negativ')) return { class: 'badge-danger', text: sentimiento };
    return { class: 'badge-info', text: sentimiento };
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

          {/* Photos Section */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <h3 className="card-title"><FiImage style={{ verticalAlign: 'middle' }} /> Fotos</h3>
              <button className="btn btn-outline btn-sm" onClick={() => photoInputRef.current?.click()} disabled={!!uploadingPhoto}>
                <FiUpload />{' '}
                {uploadingPhoto
                  ? uploadingPhoto.total > 1
                    ? `Subiendo ${uploadingPhoto.current}/${uploadingPhoto.total}...`
                    : 'Subiendo...'
                  : 'Subir Fotos'}
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
            </div>
            {report.photos && report.photos.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {report.photos.map((photo) => (
                  <div key={photo.id} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-light-gray)' }}>
                    <div style={{ position: 'relative' }}>
                      <img
                        src={mediaUrl(photo.url)}
                        alt={photo.filename || 'Foto'}
                        style={{ width: '100%', height: '140px', objectFit: 'cover', cursor: 'pointer' }}
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
                      {/* Analyzing indicator */}
                      {photo.ai_description === null && photo.ai_description !== '' && (
                        <div style={{
                          position: 'absolute', bottom: '4px', left: '4px',
                          background: 'rgba(124, 58, 237, 0.9)', color: 'white',
                          padding: '2px 8px', borderRadius: '100px', fontSize: '0.7rem',
                          animation: 'pulse 2s infinite',
                        }}>
                          Analizando...
                        </div>
                      )}
                    </div>

                    {/* AI Analysis Info */}
                    <div style={{ padding: '0.5rem' }}>
                      {photo.ai_description && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                          <p style={{
                            margin: 0,
                            display: '-webkit-box',
                            WebkitLineClamp: expandedPhoto === photo.id ? 'unset' : 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: expandedPhoto === photo.id ? 'visible' : 'hidden',
                          }}>
                            {photo.ai_description}
                          </p>
                          {photo.ai_description.length > 100 && (
                            <button
                              onClick={() => setExpandedPhoto(expandedPhoto === photo.id ? null : photo.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '0.75rem', padding: 0, marginTop: '0.25rem' }}
                            >
                              {expandedPhoto === photo.id ? 'Ver menos' : 'Ver más'}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Tags */}
                      {photo.tags_ai && photo.tags_ai.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.25rem' }}>
                          {photo.tags_ai.slice(0, 5).map((tag, i) => (
                            <span key={i} className="badge badge-info" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>{tag}</span>
                          ))}
                        </div>
                      )}

                      {/* Safety risks */}
                      {photo.vision_analysis?.safety_risks && photo.vision_analysis.safety_risks.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {photo.vision_analysis.safety_risks.map((risk, i) => (
                            <span key={i} className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                              <FiAlertTriangle size={10} style={{ marginRight: '2px' }} />{risk}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No hay fotos adjuntas</p>
            )}
          </div>

          {/* Audio Section */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 className="card-title"><FiMic style={{ verticalAlign: 'middle' }} /> Audio</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                {!recording && !recordedBlob && (
                  <>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => audioInputRef.current?.click()}
                      disabled={uploadingAudio}
                    >
                      <FiUpload /> {uploadingAudio ? 'Subiendo...' : 'Subir'}
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={startRecording}
                      style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                    >
                      <FiMic /> Grabar
                    </button>
                  </>
                )}
                {recording && (
                  <button className="btn btn-danger btn-sm" onClick={stopRecording}>
                    <FiSquare /> Detener
                  </button>
                )}
              </div>
              <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioUpload} style={{ display: 'none' }} />
            </div>

            {/* Recording in progress */}
            {recording && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem', margin: '0.75rem 0',
                background: 'rgba(231, 76, 60, 0.06)',
                borderRadius: '8px', border: '1px solid rgba(231, 76, 60, 0.2)',
              }}>
                <span style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: 'var(--color-danger)',
                  animation: 'pulse 1.2s infinite',
                  flexShrink: 0,
                }} />
                <span style={{ fontWeight: 600, color: 'var(--color-danger)', fontSize: '0.9rem' }}>
                  Grabando...
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatDuration(recordingTime)}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                  máx. 5 min
                </span>
              </div>
            )}

            {/* Recording preview */}
            {recordedBlob && !recording && (
              <div style={{
                padding: '0.75rem', margin: '0.75rem 0',
                background: 'var(--color-bg-light)', borderRadius: '8px',
                border: '1px solid var(--color-light-gray)',
              }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem' }}>
                  Grabación lista · {formatDuration(recordingTime)}
                </p>
                <audio controls src={recordedUrl} style={{ width: '100%', marginBottom: '0.75rem' }} />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={uploadRecording}
                    disabled={uploadingRecording}
                    style={{ flex: 1 }}
                  >
                    <FiCheck /> {uploadingRecording ? 'Subiendo...' : 'Subir grabación'}
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={discardRecording}
                    disabled={uploadingRecording}
                  >
                    <FiTrash2 /> Descartar
                  </button>
                </div>
              </div>
            )}

            {report.audios && report.audios.length > 0 ? (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {report.audios.map((audio, i) => (
                  <div key={audio.id || i} style={{ padding: '1rem', background: 'var(--color-bg-light)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <audio controls src={mediaUrl(audio.url)} style={{ flex: 1, maxWidth: '100%' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        {audio.duracion && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatDuration(audio.duracion)}</span>
                        )}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{audio.filename}</span>
                      </div>
                    </div>

                    {/* Transcription in progress */}
                    {!audio.transcripcion_completada && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        fontSize: '0.8rem', color: 'var(--color-accent, #7C3AED)',
                        animation: 'pulse 2s infinite',
                      }}>
                        <span className="spinner" style={{ width: 14, height: 14 }}></span>
                        Transcribiendo...
                      </div>
                    )}

                    {/* Transcription result */}
                    {audio.transcripcion_completada && audio.transcripcion && (
                      <div style={{ marginTop: '0.5rem' }}>
                        {/* Summary */}
                        {audio.resumen_ai && (
                          <div style={{
                            padding: '0.5rem 0.75rem', marginBottom: '0.5rem',
                            background: 'rgba(59, 140, 136, 0.08)', borderRadius: '6px',
                            borderLeft: '3px solid var(--color-tertiary)',
                            fontSize: '0.85rem', color: 'var(--text-primary)',
                          }}>
                            <strong style={{ fontSize: '0.75rem', color: 'var(--color-tertiary)' }}>Resumen IA</strong>
                            <p style={{ margin: '0.25rem 0 0' }}>{audio.resumen_ai}</p>
                          </div>
                        )}

                        {/* Full transcription (expandable) */}
                        <div style={{ fontSize: '0.85rem' }}>
                          <button
                            onClick={() => setExpandedAudio(expandedAudio === audio.id ? null : audio.id)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: 'var(--text-secondary)', fontSize: '0.8rem', padding: 0,
                              display: 'flex', alignItems: 'center', gap: '0.25rem',
                            }}
                          >
                            {expandedAudio === audio.id ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                            {expandedAudio === audio.id ? 'Ocultar transcripción' : 'Ver transcripción completa'}
                          </button>
                          {expandedAudio === audio.id && (
                            <p style={{ margin: '0.5rem 0 0', padding: '0.75rem', background: 'white', borderRadius: '6px', lineHeight: 1.6 }}>
                              {audio.transcripcion}
                            </p>
                          )}
                        </div>

                        {/* Keywords + Sentiment */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                          {audio.palabras_clave && audio.palabras_clave.length > 0 && (
                            audio.palabras_clave.map((kw, j) => (
                              <span key={j} className="badge badge-info" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>{kw}</span>
                            ))
                          )}
                          {audio.sentimiento && (() => {
                            const sb = getSentimentBadge(audio.sentimiento);
                            return sb ? <span className={`badge ${sb.class}`} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>{sb.text}</span> : null;
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No hay archivos de audio</p>
            )}
          </div>

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
