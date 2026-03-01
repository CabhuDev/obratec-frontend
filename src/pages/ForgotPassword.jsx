import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiSend, FiCheck, FiArrowLeft } from 'react-icons/fi';
import { authAPI } from '../services/api';
import AuthLayout from '../components/AuthLayout';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Recuperar Contraseña" 
      subtitle="Te ayudaremos a recuperar el acceso a tu cuenta"
    >
      {sent ? (
        <div className="auth-success-message">
          <div className="auth-success-icon">
            <FiCheck size={32} />
          </div>
          <div className="auth-alert auth-alert--success" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <FiMail size={18} />
            <span>
              Si el email <strong>{email}</strong> existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña en breve.
            </span>
          </div>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
            Revisa tu bandeja de entrada y sigue las instrucciones para crear una nueva contraseña.
          </p>
          <Link to="/login" className="auth-link" style={{ justifyContent: 'center' }}>
            <FiArrowLeft size={16} />
            Volver a Iniciar Sesión
          </Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-alert auth-alert--error">
              <FiMail size={18} />
              <span>{error}</span>
            </div>
          )}

          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Introduce tu dirección de email y te enviaremos un enlace para restablecer tu contraseña.
          </p>

          <div className="form-group">
            <label className="form-label">
              <FiMail size={16} />
              Email
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-auth"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Enviando...
              </>
            ) : (
              <>
                <FiSend size={18} />
                Enviar Enlace de Recuperación
              </>
            )}
          </button>

          <div className="auth-footer">
            <p className="auth-footer-link" style={{ marginBottom: 0 }}>
              <Link to="/login" className="auth-link">
                <FiArrowLeft size={14} />
                Volver a Iniciar Sesión
              </Link>
            </p>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}

export default ForgotPassword;
