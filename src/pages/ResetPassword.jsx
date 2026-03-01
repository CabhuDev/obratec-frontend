import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiLock, FiCheck, FiX, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import { authAPI } from '../services/api';
import { validatePassword } from '../utils/validation';
import AuthLayout from '../components/AuthLayout';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Token inválido o expirado. Solicita un nuevo enlace de recuperación.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    const pwd = password;
    if (!pwd) return null;
    if (pwd.length < 8) return 'weak';
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const score = [hasUpper, hasLower, hasNumber].filter(Boolean).length;
    if (score < 2) return 'weak';
    if (score === 2) return 'medium';
    return 'strong';
  };

  const strength = getPasswordStrength();
  const passwordsMatch = confirmPassword && password === confirmPassword;
  const passwordsMismatch = confirmPassword && password !== confirmPassword;

  // Invalid token view
  if (!token) {
    return (
      <AuthLayout 
        title="Enlace Inválido" 
        subtitle="Error al procesar la solicitud"
      >
        <div className="auth-success-message">
          <div className="auth-success-icon" style={{ background: 'rgba(231, 76, 60, 0.15)', color: 'var(--color-danger)' }}>
            <FiAlertCircle size={32} />
          </div>
          <div className="auth-alert auth-alert--error" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <FiX size={18} />
            <span>
              El enlace de recuperación es inválido o ha expirado. Por favor, solicita un nuevo enlace.
            </span>
          </div>
          <Link to="/forgot-password" className="btn-auth" style={{ textDecoration: 'none', justifyContent: 'center' }}>
            Solicitar Nuevo Enlace
          </Link>
          <p style={{ marginTop: '1.5rem', marginBottom: 0 }}>
            <Link to="/login" className="auth-link">
              <FiArrowLeft size={14} />
              Volver a Iniciar Sesión
            </Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  // Success view
  if (success) {
    return (
      <AuthLayout 
        title="Contraseña Restablecida" 
        subtitle="¡Todo listo!"
      >
        <div className="auth-success-message">
          <div className="auth-success-icon">
            <FiCheck size={32} />
          </div>
          <div className="auth-alert auth-alert--success" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <FiCheck size={18} />
            <span>
              Tu contraseña ha sido restablecida correctamente. Ahora puedes iniciar sesión con tu nueva contraseña.
            </span>
          </div>
          <Link to="/login" className="btn-auth" style={{ textDecoration: 'none', justifyContent: 'center' }}>
            Iniciar Sesión
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // Reset password form
  return (
    <AuthLayout 
      title="Nueva Contraseña" 
      subtitle="Crea una contraseña segura"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && (
          <div className="auth-alert auth-alert--error">
            <FiAlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">
            <FiLock size={16} />
            Nueva Contraseña
          </label>
          <input
            type="password"
            className="form-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {strength && (
            <div className="password-strength">
              <div className="password-strength-bar">
                <div className={`password-strength-bar-fill ${strength}`}></div>
              </div>
              <span className="password-strength-text">
                Contraseña {strength === 'weak' ? 'débil' : strength === 'medium' ? 'media' : 'fuerte'}
              </span>
            </div>
          )}
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">
            <FiLock size={16} />
            Confirmar Contraseña
          </label>
          <input
            type="password"
            className="form-input"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{
              borderColor: passwordsMismatch ? 'var(--color-danger)' : passwordsMatch ? 'var(--color-tertiary)' : undefined,
            }}
          />
          {passwordsMismatch && (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <FiX size={14} /> Las contraseñas no coinciden
            </p>
          )}
          {passwordsMatch && confirmPassword && (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-tertiary)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <FiCheck size={14} /> Las contraseñas coinciden
            </p>
          )}
        </div>

        <button
          type="submit"
          className="btn-auth"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Restableciendo...
            </>
          ) : (
            <>
              <FiCheck size={18} />
              Restablecer Contraseña
            </>
          )}
        </button>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)' }}>
          <Link to="/login" className="auth-link">
            <FiArrowLeft size={14} />
            Volver a Iniciar Sesión
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default ResetPassword;
