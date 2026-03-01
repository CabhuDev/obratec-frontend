import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiUser, FiMail, FiLock, FiUserPlus, FiCheck, FiX, FiBriefcase } from 'react-icons/fi';
import { authAPI } from '../services/api';
import { validatePassword } from '../utils/validation';
import AuthLayout from '../components/AuthLayout';

function Register() {
  const [formData, setFormData] = useState({
    email: '', password: '', first_name: '', last_name: '', organization_name: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const pwdError = validatePassword(formData.password);
    if (pwdError) { setError(pwdError); return; }
    if (formData.password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await authAPI.register(formData);
      navigate('/login');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail === 'Email already registered') {
        setError('Este email ya está registrado. ¿Quieres iniciar sesión?');
      } else {
        setError(detail || 'Error al registrar. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = confirmPassword && formData.password === confirmPassword;
  const passwordsMismatch = confirmPassword && formData.password !== confirmPassword;

  // Password strength indicator
  const getPasswordStrength = () => {
    const pwd = formData.password;
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

  return (
    <AuthLayout 
      title="Crear Cuenta" 
      subtitle="Únete a OBRATEC hoy mismo"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && (
          <div className="auth-alert auth-alert--error">
            <FiX size={18} />
            <span>
              {error}
              {error.includes('iniciar sesión') && (
                <> - <Link to="/login" className="auth-link">Inicia sesión</Link></>
              )}
            </span>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">
            <FiUser size={16} />
            Nombre
          </label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Juan" 
            value={formData.first_name} 
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} 
            required 
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <FiUser size={16} />
            Apellidos
          </label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Pérez" 
            value={formData.last_name} 
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} 
            required 
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <FiBriefcase size={16} />
            Empresa / Organización
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Mi Constructora S.L."
            value={formData.organization_name}
            onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <FiMail size={16} />
            Email
          </label>
          <input 
            type="email" 
            className="form-input" 
            placeholder="tu@email.com" 
            value={formData.email} 
            onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
            required 
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <FiLock size={16} />
            Contraseña
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              style={{ paddingRight: '2.5rem' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{ 
                position: 'absolute', 
                right: '0.75rem', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                color: 'var(--text-secondary)', 
                display: 'flex', 
                alignItems: 'center',
                padding: '4px'
              }}
              tabIndex={-1}
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
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
            Mínimo 8 caracteres, una mayúscula, una minúscula y un número
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">
            <FiLock size={16} />
            Confirmar contraseña
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirm ? 'text' : 'password'}
              className="form-input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                paddingRight: '2.5rem',
                borderColor: passwordsMismatch ? 'var(--color-danger)' : passwordsMatch ? 'var(--color-tertiary)' : undefined,
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              style={{ 
                position: 'absolute', 
                right: '0.75rem', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                color: 'var(--text-secondary)', 
                display: 'flex', 
                alignItems: 'center',
                padding: '4px'
              }}
              tabIndex={-1}
            >
              {showConfirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
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

        <button type="submit" className="btn-auth" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner"></span>
              Creando cuenta...
            </>
          ) : (
            <>
              <FiUserPlus size={18} />
              Crear Cuenta
            </>
          )}
        </button>
        
        <div className="auth-footer">
          <p className="auth-footer-link" style={{ marginBottom: 0 }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="auth-link">
              Inicia sesión
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}

export default Register;
