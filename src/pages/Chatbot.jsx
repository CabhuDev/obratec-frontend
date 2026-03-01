import { useState, useEffect, useRef } from 'react';
import { chatbotAPI } from '../services/api';
import { FiSend, FiMessageCircle, FiPlus, FiTrash2, FiClock, FiList, FiX } from 'react-icons/fi';

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [showMobileConvs, setShowMobileConvs] = useState(false);
  const messagesEnd = useRef(null);

  useEffect(() => {
    fetchProvider();
    fetchConversations();
  }, []);

  const fetchProvider = async () => {
    try {
      const res = await chatbotAPI.getProviders();
      setProvider(res.data.default_provider);
    } catch (e) { console.error(e); }
  };

  const fetchConversations = async () => {
    try {
      const res = await chatbotAPI.listConversations();
      setConversations(res.data.conversations || res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoadingConversations(false); }
  };

  const loadConversation = async (convId) => {
    setConversationId(convId);
    setShowMobileConvs(false);
    try {
      const res = await chatbotAPI.getMessages(convId);
      const msgs = (res.data.messages || res.data || []).map(m => ({
        role: m.role,
        content: m.content,
        sources: m.sources,
      }));
      setMessages(msgs);
    } catch (e) { console.error(e); }
  };

  const startNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setShowMobileConvs(false);
  };

  const deleteConversation = async (convId, e) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar esta conversación?')) return;
    try {
      await chatbotAPI.deleteConversation(convId);
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (conversationId === convId) startNewConversation();
    } catch (e) { console.error(e); }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const res = await chatbotAPI.chat(currentInput, conversationId, true);
      const data = res.data;
      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
        fetchConversations();
      }
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        sources: data.sources,
      }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error al procesar tu mensaje.' }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const ConversationsPanel = () => (
    <div className="card chat-conversations-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-light-gray)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={startNewConversation}>
          <FiPlus /> Nueva
        </button>
        <button
          className="chat-close-mobile"
          onClick={() => setShowMobileConvs(false)}
          aria-label="Cerrar panel"
        >
          <FiX />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loadingConversations ? (
          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando...</div>
        ) : conversations.length === 0 ? (
          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            No hay conversaciones
          </div>
        ) : (
          conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => loadConversation(conv.id)}
              style={{
                padding: '0.75rem',
                cursor: 'pointer',
                borderBottom: '1px solid var(--color-light-gray)',
                background: conversationId === conv.id ? 'var(--color-bg-light)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background 0.15s ease',
              }}
            >
              <FiMessageCircle style={{ flexShrink: 0, color: 'var(--text-secondary)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.85rem', fontWeight: 500,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                  {conv.title || 'Conversación'}
                </div>
                {conv.updated_at && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <FiClock size={10} />
                    {new Date(conv.updated_at).toLocaleDateString('es-ES')}
                  </div>
                )}
              </div>
              <button
                onClick={(e) => deleteConversation(conv.id, e)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-secondary)', padding: '4px', borderRadius: '4px',
                  flexShrink: 0,
                }}
                aria-label="Eliminar conversación"
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <div className="dashboard-header">
        <div>
          <h2>Chat IA</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Asistente virtual para construcción</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Mobile toggle button */}
          <button
            className="btn btn-outline chat-toggle-convs"
            onClick={() => setShowMobileConvs(v => !v)}
            aria-label="Conversaciones"
          >
            <FiList /> <span>Conversaciones</span>
          </button>
          {provider && <span className="badge badge-success chat-provider-badge">Conectado: {provider}</span>}
        </div>
      </div>

      {/* Mobile overlay for conversations */}
      {showMobileConvs && (
        <div className="chat-mobile-overlay" onClick={() => setShowMobileConvs(false)} />
      )}

      <div className="chat-layout">
        {/* Desktop sidebar / Mobile overlay panel */}
        <div className={`chat-conv-wrapper${showMobileConvs ? ' mobile-open' : ''}`}>
          <ConversationsPanel />
        </div>

        {/* Chat Area */}
        <div className="card chat-area-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.length === 0 ? (
              <div className="empty-state" style={{ margin: 'auto' }}>
                <FiMessageCircle style={{ fontSize: '3rem', opacity: 0.5 }} />
                <h3>Hola, soy Patricia</h3>
                <p>Tu asistente especializado en construcción. Pregúntame cualquier cosa sobre tus proyectos.</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i}>
                  <div style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    marginLeft: msg.role === 'user' ? 'auto' : undefined,
                    background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-bg-light)',
                    color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: '0.92rem',
                    lineHeight: 1.5,
                  }}>
                    {msg.content}
                  </div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{
                      fontSize: '0.75rem', color: 'var(--text-secondary)',
                      marginTop: '0.25rem', paddingLeft: '0.5rem'
                    }}>
                      Fuentes: {msg.sources.map((s, j) => (
                        <span key={j} style={{ marginRight: '0.5rem' }}>{s.title || s.filename || `Fuente ${j + 1}`}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: 'var(--color-bg-light)', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Escribiendo...
              </div>
            )}
            <div ref={messagesEnd} />
          </div>

          <div style={{ padding: '0.75rem', borderTop: '1px solid var(--color-light-gray)', display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Escribe tu mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={loading}
              style={{ flex: 1 }}
            />
            <button
              className="btn btn-primary"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              aria-label="Enviar mensaje"
              style={{ flexShrink: 0 }}
            >
              <FiSend />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;
