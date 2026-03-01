import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { reportsAPI } from '../services/api';
import { FiCpu, FiEdit3, FiCheck, FiRefreshCw, FiSave, FiX } from 'react-icons/fi';
import SkeletonLoader from './SkeletonLoader';

const SECTION_ICONS = {
  resumen_ejecutivo: '📋',
  descripcion_trabajos: '🔨',
  estado_avance: '📊',
  hallazgos: '🔍',
  analisis_seguridad: '🛡️',
  recomendaciones: '💡',
  elementos_inspeccionados: '🔎',
  estado_general: '📝',
  analisis_riesgos: '⚠️',
  cumplimiento_normativo: '📜',
  incidentes: '🚨',
  medidas_correctivas: '🔧',
  elementos_controlados: '✅',
  resultados_ensayos: '🧪',
  conformidad: '✔️',
  no_conformidades: '❌',
  acciones_correctivas: '🛠️',
  puntos_tratados: '📌',
  decisiones_tomadas: '🤝',
  responsables_acciones: '👤',
  proximos_pasos: '➡️',
  analisis_general: '📄',
};

function AIReportSections({ reportId, reportType, onContentUpdate }) {
  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [editedSections, setEditedSections] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAIContent();
  }, [reportId]);

  const fetchAIContent = async () => {
    try {
      setLoading(true);
      const res = await reportsAPI.getAIContent(reportId);
      setAiData(res.data);
      // Initialize edited sections from current content
      const final = res.data.final_content;
      if (final && final.sections) {
        setEditedSections({ ...final.sections });
      }
    } catch (e) {
      console.error('Error fetching AI content:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await reportsAPI.generateAI(reportId);
      const content = res.data.ai_content;
      if (content && content.sections) {
        setEditedSections({ ...content.sections });
      }
      setHasUnsavedChanges(false);
      await fetchAIContent();
      onContentUpdate?.();
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al generar contenido IA');
    } finally {
      setGenerating(false);
    }
  };

  const handleSectionEdit = (key, value) => {
    setEditedSections(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await reportsAPI.updateAIContent(reportId, editedSections);
      setHasUnsavedChanges(false);
      setEditingSection(null);
      await fetchAIContent();
      onContentUpdate?.();
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = (key) => {
    // Restore original value
    const original = aiData?.final_content?.sections?.[key];
    if (original !== undefined) {
      setEditedSections(prev => ({ ...prev, [key]: original }));
    }
    setEditingSection(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title"><FiCpu style={{ verticalAlign: 'middle' }} /> Redaccion IA</h3>
        </div>
        <SkeletonLoader type="card" count={2} />
      </div>
    );
  }

  const status = aiData?.status || 'none';
  const sectionsDef = aiData?.sections_definition || [];

  // No AI content yet — show generate CTA
  if (status === 'none' && !generating) {
    return (
      <motion.div
        className="card"
        style={{ marginBottom: '1.5rem' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div style={{
          textAlign: 'center',
          padding: '2rem 1rem',
        }}>
          <FiCpu size={40} style={{ color: 'var(--color-primary)', marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-secondary)' }}>
            Redaccion con IA
          </h3>
          <p style={{
            color: 'var(--text-secondary)',
            marginBottom: '1.5rem',
            maxWidth: '400px',
            margin: '0 auto 1.5rem',
            fontSize: '0.875rem',
          }}>
            La IA analizara las fotos, audio y datos del informe para generar
            secciones redactadas profesionalmente. Podras editarlas antes de generar el PDF.
          </p>
          {error && (
            <p style={{ color: 'var(--color-danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {error}
            </p>
          )}
          <button className="btn btn-primary" onClick={handleGenerate}>
            <FiCpu /> Generar con IA
          </button>
        </div>
      </motion.div>
    );
  }

  // Generating state — skeleton
  if (generating) {
    return (
      <motion.div
        className="card"
        style={{ marginBottom: '1.5rem' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="card-header">
          <h3 className="card-title"><FiCpu style={{ verticalAlign: 'middle' }} /> Generando contenido IA...</h3>
        </div>
        <div style={{ padding: '1rem 0' }}>
          {sectionsDef.map((sec, i) => (
            <div key={sec.key} style={{ marginBottom: '1rem' }}>
              <div className="skeleton skeleton-text" style={{ width: '40%', height: '16px', marginBottom: '0.5rem' }} />
              <div className="skeleton skeleton-text" style={{ width: '100%', height: '60px' }} />
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Content generated — show editable sections
  return (
    <motion.div
      className="card"
      style={{ marginBottom: '1.5rem' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 className="card-title">
          <FiCpu style={{ verticalAlign: 'middle' }} /> Redaccion IA
          {status === 'edited' && (
            <span style={{
              fontSize: '0.7rem',
              background: 'rgba(59, 140, 136, 0.15)',
              color: 'var(--color-tertiary)',
              padding: '2px 8px',
              borderRadius: '10px',
              marginLeft: '0.5rem',
              fontWeight: 600,
            }}>
              Editado
            </span>
          )}
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {hasUnsavedChanges && (
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              <FiSave /> {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          )}
          <button className="btn btn-outline btn-sm" onClick={handleGenerate} disabled={generating}>
            <FiRefreshCw /> Regenerar
          </button>
        </div>
      </div>

      {error && (
        <p style={{ color: 'var(--color-danger)', marginBottom: '1rem', fontSize: '0.875rem', padding: '0 1rem' }}>
          {error}
        </p>
      )}

      <div style={{ display: 'grid', gap: '1rem' }}>
        {sectionsDef.map((sec, i) => {
          const sectionText = editedSections[sec.key] || '';
          const isEditing = editingSection === sec.key;
          const icon = SECTION_ICONS[sec.key] || '📝';

          return (
            <motion.div
              key={sec.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              style={{
                border: '1px solid var(--color-light-gray, #e5e7eb)',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              {/* Section header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                background: 'var(--color-bg-light, #f9fafb)',
                borderBottom: '1px solid var(--color-light-gray, #e5e7eb)',
              }}>
                <span style={{ fontWeight: 600, color: 'var(--color-secondary)', fontSize: '0.9rem' }}>
                  {icon} {sec.title}
                </span>
                {isEditing ? (
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleCancelEdit(sec.key)}
                      style={{ padding: '4px 8px' }}
                    >
                      <FiX size={14} />
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setEditingSection(null)}
                      style={{ padding: '4px 8px' }}
                    >
                      <FiCheck size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setEditingSection(sec.key)}
                    style={{ padding: '4px 8px' }}
                  >
                    <FiEdit3 size={14} />
                  </button>
                )}
              </div>

              {/* Section content */}
              <div style={{ padding: '0.75rem 1rem' }}>
                {isEditing ? (
                  <textarea
                    value={sectionText}
                    onChange={(e) => handleSectionEdit(sec.key, e.target.value)}
                    className="form-input"
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      fontSize: '0.875rem',
                      lineHeight: '1.6',
                    }}
                  />
                ) : (
                  <p style={{
                    fontSize: '0.875rem',
                    lineHeight: '1.6',
                    color: 'var(--text-primary, #374151)',
                    whiteSpace: 'pre-wrap',
                    margin: 0,
                    cursor: 'pointer',
                  }}
                    onClick={() => setEditingSection(sec.key)}
                  >
                    {sectionText || <em style={{ color: 'var(--text-secondary)' }}>Sin contenido para esta seccion</em>}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default AIReportSections;
