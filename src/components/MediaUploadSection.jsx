import { useState, useRef, useEffect } from 'react';
import { reportsAPI, mediaUrl } from '../services/api';
import {
  FiUpload, FiX, FiCheck, FiImage, FiMic,
  FiAlertTriangle, FiChevronDown, FiChevronUp,
  FiSquare, FiTrash2
} from 'react-icons/fi';

// FastAPI 422 returns detail as array of Pydantic errors — convert to string
const apiError = (e, fallback) => {
  const detail = e?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map(d => d.msg).join(', ');
  return fallback;
};

function MediaUploadSection({ reportId, photos = [], audios = [], onRefresh, showToast }) {
  const [uploadingPhoto, setUploadingPhoto] = useState(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState(null);
  const [expandedAudio, setExpandedAudio] = useState(null);

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

  useEffect(() => {
    return () => {
      clearInterval(recordingTimerRef.current);
      recordingStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const notify = (type, message, extra = {}) => {
    if (showToast) showToast({ type, message, ...extra });
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
      notify('info', `Se seleccionaron ${files.length} fotos, se subirán las primeras ${MAX_FILES}.`);
    }

    const errors = [];
    setUploadingPhoto({ current: 0, total: selected.length });

    for (let i = 0; i < selected.length; i++) {
      setUploadingPhoto({ current: i + 1, total: selected.length });
      try {
        const compressed = await compressImage(selected[i]);
        const formData = new FormData();
        formData.append('file', compressed);
        await reportsAPI.uploadPhoto(reportId, formData);
      } catch {
        errors.push(selected[i].name);
      }
    }

    setUploadingPhoto(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
    onRefresh();

    if (errors.length) {
      notify('error', `Error al subir: ${errors.join(', ')}`);
    } else {
      notify('success', selected.length === 1 ? 'Foto subida correctamente' : `${selected.length} fotos subidas correctamente`);
    }
  };

  const deletePhoto = async (photoId) => {
    if (!confirm('¿Eliminar esta foto?')) return;
    try {
      await reportsAPI.deletePhoto(reportId, photoId);
      onRefresh();
    } catch (e) {
      notify('error', apiError(e, 'Error al eliminar foto'));
    }
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

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      notify('error', 'Tu navegador no soporta grabación de audio.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;

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

      mr.start(250);
      setRecording(true);
      setRecordingTime(0);

      let elapsed = 0;
      recordingTimerRef.current = setInterval(() => {
        elapsed += 1;
        setRecordingTime(elapsed);
        if (elapsed >= 300) stopRecording();
      }, 1000);
    } catch {
      notify('error', 'No se pudo acceder al micrófono. Verifica los permisos.');
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
      await reportsAPI.uploadAudio(reportId, formData);
      discardRecording();
      onRefresh();
      notify('success', 'Grabación subida correctamente');
    } catch (err) {
      notify('error', apiError(err, 'Error al subir la grabación'));
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
      await reportsAPI.uploadAudio(reportId, formData);
      onRefresh();
      notify('success', 'Audio subido correctamente');
    } catch (e) {
      notify('error', apiError(e, 'Error al subir audio'));
    } finally {
      setUploadingAudio(false);
      if (audioInputRef.current) audioInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Photos Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title"><FiImage style={{ verticalAlign: 'middle' }} /> Fotos</h3>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => photoInputRef.current?.click()}
            disabled={!!uploadingPhoto}
          >
            <FiUpload />{' '}
            {uploadingPhoto
              ? uploadingPhoto.total > 1
                ? `Subiendo ${uploadingPhoto.current}/${uploadingPhoto.total}...`
                : 'Subiendo...'
              : 'Subir Fotos'}
          </button>
          <input ref={photoInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
        </div>

        {photos.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {photos.map((photo) => (
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

                  {photo.tags_ai && photo.tags_ai.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.25rem' }}>
                      {photo.tags_ai.slice(0, 5).map((tag, i) => (
                        <span key={i} className="badge badge-info" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>{tag}</span>
                      ))}
                    </div>
                  )}

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
            <span style={{ fontWeight: 600, color: 'var(--color-danger)', fontSize: '0.9rem' }}>Grabando...</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
              {formatDuration(recordingTime)}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>máx. 5 min</span>
          </div>
        )}

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

        {audios.length > 0 ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {audios.map((audio, i) => (
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

                {audio.transcripcion_completada && audio.transcripcion && (
                  <div style={{ marginTop: '0.5rem' }}>
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

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                      {audio.palabras_clave?.map((kw, j) => (
                        <span key={j} className="badge badge-info" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>{kw}</span>
                      ))}
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
    </>
  );
}

export default MediaUploadSection;
