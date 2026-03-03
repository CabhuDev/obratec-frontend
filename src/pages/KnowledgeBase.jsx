import { useState, useEffect, useRef, useCallback } from 'react';
import { FiPlus, FiSearch, FiTrash2, FiFile, FiUploadCloud, FiCheckCircle, FiAlertCircle, FiRefreshCw, FiX, FiFileText, FiEdit, FiEye } from 'react-icons/fi';
import { knowledgeAPI } from '../services/api';
import SkeletonLoader from '../components/SkeletonLoader';

function KnowledgeBase() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('documents'); // 'documents' | 'upload' | 'text'
  const [formData, setFormData] = useState({ titulo: '', contenido: '' });

  // Upload state
  const [dragOver, setDragOver] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]); // {file, status, progress, result, error}
  const [uploading, setUploading] = useState(false);

  // Reindex state
  const [reindexing, setReindexing] = useState(false);
  const [reindexResult, setReindexResult] = useState(null);
  const [reindexingDoc, setReindexingDoc] = useState(null);

  // Preview/Edit state
  const [previewDoc, setPreviewDoc] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [editForm, setEditForm] = useState({ titulo: '', contenido: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => { fetchDocuments(); }, []);

  const fetchDocuments = async () => {
    try {
      const res = await knowledgeAPI.list({ search: search || undefined });
      setDocuments(res.data.documents || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const timeout = setTimeout(() => { fetchDocuments(); }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  // --- Text document creation ---
  const createDocument = async (e) => {
    e.preventDefault();
    try {
      await knowledgeAPI.create(formData);
      setActiveTab('documents');
      setFormData({ titulo: '', contenido: '' });
      fetchDocuments();
    } catch (e) { console.error(e); }
  };

  const deleteDocument = async (id) => {
    if (!confirm('¿Eliminar documento?')) return;
    try {
      await knowledgeAPI.delete(id);
      fetchDocuments();
      if (previewDoc?.id === id) setPreviewDoc(null);
    } catch (e) { console.error(e); }
  };

  // --- Preview ---
  const openPreview = async (doc) => {
    setLoadingPreview(true);
    setPreviewDoc(null);
    try {
      const res = await knowledgeAPI.get(doc.id);
      setPreviewDoc(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPreview(false);
    }
  };

  // --- Edit ---
  const openEdit = async (doc) => {
    setLoadingPreview(true);
    try {
      const res = await knowledgeAPI.get(doc.id);
      setEditingDoc(res.data);
      setEditForm({ titulo: res.data.titulo || '', contenido: res.data.contenido || '' });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPreview(false);
    }
  };

  const saveEdit = async () => {
    if (!editingDoc) return;
    setSavingEdit(true);
    try {
      await knowledgeAPI.update(editingDoc.id, editForm);
      setEditingDoc(null);
      fetchDocuments();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al guardar');
    } finally {
      setSavingEdit(false);
    }
  };

  // --- Per-document reindex ---
  const reindexDocument = async (docId) => {
    setReindexingDoc(docId);
    try {
      await knowledgeAPI.reindex(docId);
      fetchDocuments();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al reindexar');
    } finally {
      setReindexingDoc(null);
    }
  };

  // --- File Upload ---
  const ALLOWED_EXTENSIONS = ['.pdf', '.md', '.txt'];

  const isAllowedFile = (file) => {
    const name = file.name.toLowerCase();
    return ALLOWED_EXTENSIONS.some(ext => name.endsWith(ext));
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(isAllowedFile);
    if (files.length === 0) return;
    addFiles(files);
  }, []);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    addFiles(files);
    e.target.value = '';
  };

  const addFiles = (files) => {
    const newFiles = files.map(f => ({
      file: f,
      status: 'pending',
      progress: 0,
      result: null,
      error: null,
    }));
    setUploadFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearCompleted = () => {
    setUploadFiles(prev => prev.filter(f => f.status !== 'success'));
  };

  const uploadAllFiles = async () => {
    setUploading(true);

    for (let i = 0; i < uploadFiles.length; i++) {
      if (uploadFiles[i].status !== 'pending') continue;

      setUploadFiles(prev => prev.map((f, idx) =>
        idx === i ? { ...f, status: 'uploading', progress: 0 } : f
      ));

      try {
        const formData = new FormData();
        formData.append('file', uploadFiles[i].file);

        const res = await knowledgeAPI.upload(formData, (progressEvent) => {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadFiles(prev => prev.map((f, idx) =>
            idx === i ? { ...f, progress: pct } : f
          ));
        });

        setUploadFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, status: 'success', progress: 100, result: res.data } : f
        ));
      } catch (e) {
        const errorMsg = e.response?.data?.detail || e.message || 'Error al subir';
        setUploadFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, status: 'error', error: errorMsg } : f
        ));
      }
    }

    setUploading(false);
    fetchDocuments();
  };

  // --- Reindex All ---
  const reindexAll = async () => {
    setReindexing(true);
    setReindexResult(null);
    try {
      const res = await knowledgeAPI.reindexAll();
      setReindexResult(res.data);
      fetchDocuments();
    } catch (e) {
      setReindexResult({ message: 'Error al reindexar: ' + (e.response?.data?.detail || e.message) });
    }
    finally { setReindexing(false); }
  };

  const pendingCount = uploadFiles.filter(f => f.status === 'pending').length;
  const successCount = uploadFiles.filter(f => f.status === 'success').length;
  const totalChunks = uploadFiles.reduce((acc, f) => acc + (f.result?.chunks_created || 0), 0);
  const docsWithoutEmbedding = documents.filter(d => !d.processed_at).length;

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h2>Biblioteca de Conocimiento</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Gestiona documentos para el chatbot IA</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {docsWithoutEmbedding > 0 && (
            <button
              className="btn btn-tertiary btn-sm"
              onClick={reindexAll}
              disabled={reindexing}
            >
              <FiRefreshCw className={reindexing ? 'spin-icon' : ''} />
              {reindexing ? 'Indexando...' : `Indexar (${docsWithoutEmbedding})`}
            </button>
          )}
        </div>
      </div>

      {/* Reindex result toast */}
      {reindexResult && (
        <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(59, 140, 136, 0.08)', border: '1px solid var(--color-tertiary)' }}>
          <span><FiCheckCircle style={{ marginRight: '0.5rem', color: 'var(--color-tertiary)' }} />{reindexResult.message}</span>
          <button onClick={() => setReindexResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><FiX /></button>
        </div>
      )}

      {/* Edit Modal */}
      {editingDoc && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)',
        }} onClick={() => setEditingDoc(null)}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '80vh', overflow: 'auto', margin: '1rem' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3 className="card-title">Editar Documento</h3>
              <button onClick={() => setEditingDoc(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><FiX /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Título</label>
              <input className="form-input" value={editForm.titulo} onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Contenido</label>
              <textarea className="form-input" rows={10} value={editForm.contenido} onChange={(e) => setEditForm({ ...editForm, contenido: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setEditingDoc(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveEdit} disabled={savingEdit}>
                {savingEdit ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Panel */}
      {(previewDoc || loadingPreview) && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)',
        }} onClick={() => { setPreviewDoc(null); setLoadingPreview(false); }}>
          <div className="card" style={{ width: '100%', maxWidth: '700px', maxHeight: '80vh', overflow: 'auto', margin: '1rem' }}
            onClick={(e) => e.stopPropagation()}>
            {loadingPreview ? (
              <SkeletonLoader type="card" />
            ) : previewDoc && (
              <>
                <div className="card-header">
                  <h3 className="card-title">{previewDoc.titulo}</h3>
                  <button onClick={() => setPreviewDoc(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><FiX /></button>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span className={`badge ${previewDoc.file_type === 'pdf' ? 'badge-danger' : 'badge-info'}`}>{previewDoc.file_type || 'texto'}</span>
                  {previewDoc.processed_at && <span className="badge badge-success">Indexado</span>}
                  <span>{new Date(previewDoc.created_at).toLocaleDateString('es-ES')}</span>
                </div>
                {previewDoc.contenido && (
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: 1.6, maxHeight: '50vh', overflow: 'auto', padding: '1rem', background: 'var(--color-bg-light)', borderRadius: '8px' }}>
                    {previewDoc.contenido}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="kb-tabs">
        <button
          className={`kb-tab ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <FiFile /> Documentos
        </button>
        <button
          className={`kb-tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <FiUploadCloud /> Subir Archivos
          {pendingCount > 0 && <span className="kb-tab-badge">{pendingCount}</span>}
        </button>
        <button
          className={`kb-tab ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTab('text')}
        >
          <FiPlus /> Texto Manual
        </button>
      </div>

      {/* Tab: Documents list */}
      {activeTab === 'documents' && (
        <div className="card">
          {/* Search */}
          <div style={{ marginBottom: '1rem', position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              className="form-input"
              placeholder="Buscar documentos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>

          {loading ? (
            <SkeletonLoader type="card" count={3} />
          ) : documents.length > 0 ? (
            <>
              {/* Desktop table */}
              <div className="table-container kb-desktop-table">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Documento</th>
                      <th>Tipo</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {doc.file_type === 'pdf' ? (
                              <FiFileText style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
                            ) : (
                              <FiFile style={{ color: 'var(--color-info)', flexShrink: 0 }} />
                            )}
                            <span style={{ fontWeight: 500, cursor: 'pointer', color: 'var(--color-secondary)' }} onClick={() => openPreview(doc)}>
                              {doc.titulo}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${doc.file_type === 'pdf' ? 'badge-danger' : 'badge-info'}`}>
                            {doc.file_type || 'texto'}
                          </span>
                        </td>
                        <td>
                          {doc.processed_at ? (
                            <span className="badge badge-success"><FiCheckCircle style={{ marginRight: '0.25rem' }} /> Indexado</span>
                          ) : (
                            <span className="badge badge-warning"><FiAlertCircle style={{ marginRight: '0.25rem' }} /> Pendiente</span>
                          )}
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          {new Date(doc.created_at).toLocaleDateString('es-ES')}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button className="btn btn-outline btn-sm" onClick={() => openPreview(doc)} title="Ver">
                              <FiEye />
                            </button>
                            <button className="btn btn-outline btn-sm" onClick={() => openEdit(doc)} title="Editar">
                              <FiEdit />
                            </button>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => reindexDocument(doc.id)}
                              disabled={reindexingDoc === doc.id}
                              title="Reindexar"
                            >
                              <FiRefreshCw className={reindexingDoc === doc.id ? 'spin-icon' : ''} />
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteDocument(doc.id)} title="Eliminar">
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="kb-mobile-list">
                {documents.map((doc) => (
                  <div key={doc.id} style={{
                    display: 'flex', flexDirection: 'column', gap: '0.5rem',
                    padding: '1rem', borderBottom: '1px solid var(--color-light-gray)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {doc.file_type === 'pdf' ? (
                        <FiFileText style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
                      ) : (
                        <FiFile style={{ color: 'var(--color-info)', flexShrink: 0 }} />
                      )}
                      <span style={{ fontWeight: 500, flex: 1, cursor: 'pointer' }} onClick={() => openPreview(doc)}>
                        {doc.titulo}
                      </span>
                      {doc.processed_at ? (
                        <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Indexado</span>
                      ) : (
                        <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Pendiente</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(doc)}><FiEdit /></button>
                      <button className="btn btn-outline btn-sm" onClick={() => reindexDocument(doc.id)} disabled={reindexingDoc === doc.id}>
                        <FiRefreshCw className={reindexingDoc === doc.id ? 'spin-icon' : ''} />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteDocument(doc.id)}><FiTrash2 /></button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><FiFile /></div>
              <h3>Sin documentos</h3>
              <p>Sube un archivo o agrega texto para que el chatbot pueda responder preguntas</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('upload')}>
                <FiUploadCloud /> Subir Archivo
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: File Upload */}
      {activeTab === 'upload' && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Subir Documentos</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Los archivos se procesan automaticamente: se extrae el texto, se divide en fragmentos y se generan embeddings para la busqueda inteligente. Formatos soportados: PDF, Markdown (.md), Texto (.txt).
          </p>

          {/* Dropzone */}
          <div
            className={`kb-dropzone ${dragOver ? 'kb-dropzone-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.md,.txt"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <FiUploadCloud className="kb-dropzone-icon" />
            <p className="kb-dropzone-text">
              Arrastra archivos aqui o <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>haz clic para seleccionar</span>
            </p>
            <p className="kb-dropzone-hint">Formatos: PDF, Markdown (.md), Texto (.txt). Se pueden subir varios a la vez.</p>
          </div>

          {/* File list */}
          {uploadFiles.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ margin: 0 }}>Archivos ({uploadFiles.length})</h4>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {successCount > 0 && (
                    <button className="btn btn-outline btn-sm" onClick={clearCompleted}>Limpiar completados</button>
                  )}
                </div>
              </div>

              <div className="kb-file-list">
                {uploadFiles.map((item, index) => (
                  <div key={index} className={`kb-file-item kb-file-${item.status}`}>
                    <div className="kb-file-info">
                      {item.file.name.toLowerCase().endsWith('.pdf')
                        ? <FiFileText style={{ color: 'var(--color-danger)', flexShrink: 0, fontSize: '1.25rem' }} />
                        : <FiFile style={{ color: 'var(--color-info)', flexShrink: 0, fontSize: '1.25rem' }} />
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.file.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {formatFileSize(item.file.size)}
                          {item.result && ` — ${item.result.chunks_created} fragmentos creados`}
                          {item.error && <span style={{ color: 'var(--color-danger)' }}> — {item.error}</span>}
                        </div>
                      </div>

                      {item.status === 'success' && <FiCheckCircle style={{ color: 'var(--color-success)', fontSize: '1.25rem', flexShrink: 0 }} />}
                      {item.status === 'error' && <FiAlertCircle style={{ color: 'var(--color-danger)', fontSize: '1.25rem', flexShrink: 0 }} />}
                      {item.status === 'pending' && (
                        <button
                          onClick={() => removeFile(index)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.25rem' }}
                        >
                          <FiX />
                        </button>
                      )}
                    </div>

                    {item.status === 'uploading' && (
                      <div className="progress" style={{ marginTop: '0.5rem' }}>
                        <div className="progress-bar" style={{ width: `${item.progress}%` }}></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {pendingCount > 0 && (
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    className="btn btn-primary"
                    onClick={uploadAllFiles}
                    disabled={uploading}
                  >
                    <FiUploadCloud />
                    {uploading ? 'Subiendo...' : `Subir ${pendingCount} archivo${pendingCount > 1 ? 's' : ''}`}
                  </button>
                </div>
              )}

              {successCount > 0 && pendingCount === 0 && !uploading && (
                <div className="kb-upload-summary">
                  <FiCheckCircle style={{ color: 'var(--color-success)', fontSize: '1.25rem' }} />
                  <span>
                    {successCount} archivo{successCount > 1 ? 's' : ''} subido{successCount > 1 ? 's' : ''} correctamente.
                    {totalChunks > 0 && ` ${totalChunks} fragmentos creados en total.`}
                  </span>
                  <button className="btn btn-tertiary btn-sm" onClick={() => setActiveTab('documents')}>
                    Ver documentos
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Manual text */}
      {activeTab === 'text' && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Nuevo Documento de Texto</h3>
          <form onSubmit={createDocument}>
            <div className="form-group">
              <label className="form-label">Titulo</label>
              <input
                className="form-input"
                placeholder="Ej: Normativa de seguridad en obra"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contenido</label>
              <textarea
                className="form-input"
                rows={8}
                placeholder="Pega o escribe el contenido del documento aqui..."
                value={formData.contenido}
                onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => { setActiveTab('documents'); setFormData({ titulo: '', contenido: '' }); }}>Cancelar</button>
              <button type="submit" className="btn btn-primary"><FiPlus /> Guardar Documento</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default KnowledgeBase;
