import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { billingAPI, authAPI, organizationsAPI, mediaUrl } from '../services/api';
import { FiUser, FiCreditCard, FiBell, FiLock, FiSave, FiCheck, FiMail, FiBriefcase, FiUpload, FiTrash2, FiImage, FiCheckCircle, FiXCircle } from 'react-icons/fi';

function Settings() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [billingNotice, setBillingNotice] = useState(null); // 'success' | 'cancel' | null
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ first_name: '', last_name: '', email: '' });
  const [orgName, setOrgName] = useState('');
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [subscribing, setSubscribing] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [deletingLogo, setDeletingLogo] = useState(false);
  const logoInputRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const billing = params.get('billing');
    if (billing === 'success' || billing === 'cancel') {
      setBillingNotice(billing);
      if (billing === 'success') setActiveTab('billing');
      // Limpia el query param de la URL sin recargar
      navigate('/app/settings', { replace: true });
    }
  }, []);

  useEffect(() => {
    if (user) {
      setProfile({ first_name: user.first_name || '', last_name: user.last_name || '', email: user.email || '' });
    }
    fetchOrganization();
    fetchSubscription();
    fetchPlans();
    fetchInvoices();
  }, [user]);

  const fetchOrganization = async () => {
    try {
      const res = await organizationsAPI.get();
      setOrgName(res.data.name || '');
      setLogoUrl(res.data.logo_url || null);
      setLogoPreview(null);
    } catch (e) { /* org not available */ }
  };

  const fetchSubscription = async () => {
    try {
      const res = await billingAPI.getSubscription();
      setSubscription(res.data);
    } catch (e) { /* billing endpoint not available yet */ }
  };

  const fetchPlans = async () => {
    try {
      const res = await billingAPI.getPlans();
      setPlans(res.data.plans || res.data || []);
    } catch (e) { /* billing endpoint not available yet */ }
  };

  const fetchInvoices = async () => {
    try {
      const res = await billingAPI.listInvoices();
      setInvoices(res.data.invoices || res.data || []);
    } catch (e) { /* no invoices */ }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await organizationsAPI.update({ name: orgName });
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    setSubscribing(planId);
    try {
      const res = await billingAPI.subscribe(planId, billingCycle);
      if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      } else {
        fetchSubscription();
      }
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al suscribirse');
    } finally {
      setSubscribing(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('¿Estás seguro de que quieres cancelar tu suscripción?')) return;
    setCancelling(true);
    try {
      await billingAPI.cancel();
      fetchSubscription();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al cancelar');
    } finally {
      setCancelling(false);
    }
  };

  const handlePasswordReset = async () => {
    setSendingReset(true);
    try {
      await authAPI.forgotPassword(user.email);
      setPasswordResetSent(true);
    } catch (e) {
      setPasswordResetSent(true);
    } finally {
      setSendingReset(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side validation
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      alert('Solo se permiten archivos JPEG o PNG');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 2MB.');
      return;
    }

    // Show instant preview
    setLogoPreview(URL.createObjectURL(file));

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await organizationsAPI.uploadLogo(formData);
      fetchOrganization();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al subir el logo');
      setLogoPreview(null);
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleLogoDelete = async () => {
    if (!confirm('¿Eliminar el logo de la empresa?')) return;
    setDeletingLogo(true);
    try {
      await organizationsAPI.deleteLogo();
      setLogoUrl(null);
      setLogoPreview(null);
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al eliminar el logo');
    } finally {
      setDeletingLogo(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: FiUser },
    { id: 'billing', label: 'Suscripción', icon: FiCreditCard },
    { id: 'notifications', label: 'Notificaciones', icon: FiBell },
    { id: 'security', label: 'Seguridad', icon: FiLock },
  ];

  return (
    <div className="fade-in">
      <div className="dashboard-header">
        <div><h2>Configuración</h2><p style={{ color: 'var(--text-secondary)' }}>Gestiona tu cuenta y preferencias</p></div>
      </div>

      {/* Banner pago exitoso / cancelado */}
      {billingNotice === 'success' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem',
          background: 'rgba(39, 174, 96, 0.1)', border: '1px solid rgba(39, 174, 96, 0.4)',
          borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem'
        }}>
          <FiCheckCircle style={{ fontSize: '1.5rem', color: 'var(--color-success, #27ae60)', flexShrink: 0 }} />
          <div>
            <strong style={{ color: 'var(--color-success, #27ae60)' }}>¡Suscripción activada!</strong>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Tu plan ya está activo. Puede tardar unos segundos en reflejarse — recarga la página si no lo ves aún.
            </p>
          </div>
          <button onClick={() => setBillingNotice(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
            ×
          </button>
        </div>
      )}
      {billingNotice === 'cancel' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem',
          background: 'rgba(231, 76, 60, 0.08)', border: '1px solid rgba(231, 76, 60, 0.3)',
          borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem'
        }}>
          <FiXCircle style={{ fontSize: '1.5rem', color: 'var(--color-danger)', flexShrink: 0 }} />
          <div>
            <strong style={{ color: 'var(--color-danger)' }}>Pago cancelado</strong>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              No se realizó ningún cargo. Puedes intentarlo de nuevo cuando quieras.
            </p>
          </div>
          <button onClick={() => setBillingNotice(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
            ×
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.5rem' }}>
        {/* Sidebar */}
        <div className="card" style={{ padding: '0.5rem' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="settings-tab"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                width: '100%', padding: '0.75rem 1rem', border: 'none', borderRadius: '8px',
                cursor: 'pointer', marginBottom: '0.25rem', fontSize: '0.95rem', fontWeight: 500,
                background: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--text-primary)',
                transition: 'all 0.15s ease',
              }}>
              <tab.icon /><span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="card">
          {activeTab === 'profile' && (
            <form onSubmit={updateProfile}>
              <h3 style={{ marginBottom: '1.5rem' }}>Información del Perfil</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input className="form-input" value={profile.first_name} onChange={(e) => setProfile({...profile, first_name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Apellidos</label>
                  <input className="form-input" value={profile.last_name} onChange={(e) => setProfile({...profile, last_name: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" value={profile.email} disabled style={{ opacity: 0.6 }} />
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--color-light-gray)', margin: '1.5rem 0' }} />

              <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiBriefcase size={16} /> Organización
              </h4>
              <div className="form-group">
                <label className="form-label">Nombre de la empresa</label>
                <input
                  className="form-input"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Mi Constructora S.L."
                />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Este nombre aparecerá en los informes y facturas
                </p>
              </div>

              {/* Logo Upload */}
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiImage size={14} /> Logo de la empresa
                </label>

                {(logoPreview || logoUrl) && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    marginBottom: '0.75rem', padding: '0.75rem',
                    background: 'var(--color-bg-light)', borderRadius: '8px',
                  }}>
                    <img
                      src={logoPreview || mediaUrl(`/media/${logoUrl}`)}
                      alt="Logo"
                      style={{ maxHeight: '60px', maxWidth: '180px', objectFit: 'contain', borderRadius: '4px' }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handleLogoDelete}
                      disabled={deletingLogo}
                      style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                    >
                      <FiTrash2 size={14} style={{ marginRight: '0.25rem' }} />
                      {deletingLogo ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    <FiUpload size={14} style={{ marginRight: '0.25rem' }} />
                    {uploadingLogo ? 'Subiendo...' : (logoUrl ? 'Cambiar logo' : 'Subir logo')}
                  </button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg, image/png"
                    onChange={handleLogoUpload}
                    style={{ display: 'none' }}
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                  Máx. 2MB · JPEG o PNG · Recomendado: 300×100px
                </p>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}><FiSave style={{ marginRight: '0.5rem' }} />{loading ? 'Guardando...' : 'Guardar Cambios'}</button>
            </form>
          )}

          {activeTab === 'billing' && (
            <div>
              <h3 style={{ marginBottom: '1.5rem' }}>Plan de Suscripción</h3>

              {/* Current Plan */}
              {subscription ? (
                <div style={{ background: 'var(--color-bg-light)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4>Plan Actual: {subscription.plan_name || subscription.plan_id}</h4>
                      <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                        {subscription.price_monthly ? `${subscription.price_monthly}€/mes` : ''}
                        {subscription.current_period_end && ` — Próxima factura: ${new Date(subscription.current_period_end).toLocaleDateString('es-ES')}`}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className={`badge ${subscription.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                        {subscription.status === 'active' ? 'Activo' : subscription.status}
                      </span>
                      {subscription.status === 'active' && (
                        <button className="btn btn-outline btn-sm" onClick={handleCancel} disabled={cancelling}>
                          {cancelling ? 'Cancelando...' : 'Cancelar'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>No tienes una suscripción activa</p>
              )}

              {/* Billing cycle toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <span
                  style={{ fontWeight: billingCycle === 'monthly' ? 600 : 400, cursor: 'pointer', fontSize: '0.95rem' }}
                  onClick={() => setBillingCycle('monthly')}
                >
                  Mensual
                </span>
                <div
                  onClick={() => setBillingCycle(c => c === 'monthly' ? 'yearly' : 'monthly')}
                  style={{
                    width: '48px', height: '26px', borderRadius: '13px', cursor: 'pointer',
                    background: billingCycle === 'yearly' ? 'var(--color-tertiary)' : 'var(--color-light-gray)',
                    position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                  }}
                >
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', background: 'white',
                    position: 'absolute', top: '2px',
                    left: billingCycle === 'yearly' ? '24px' : '2px',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </div>
                <span
                  style={{ fontWeight: billingCycle === 'yearly' ? 600 : 400, cursor: 'pointer', fontSize: '0.95rem' }}
                  onClick={() => setBillingCycle('yearly')}
                >
                  Anual{' '}
                  <span style={{ color: 'var(--color-tertiary)', fontSize: '0.8rem', fontWeight: 600 }}>Ahorra ~20%</span>
                </span>
              </div>

              {/* Available Plans */}
              <h4 style={{ marginBottom: '1rem' }}>Planes Disponibles</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {plans.map(plan => {
                  const isCurrentPlan = subscription?.plan_id === plan.id;
                  const isFounders = plan.slug === 'founders';
                  const displayPrice = billingCycle === 'yearly' && plan.price_yearly
                    ? Math.round(plan.price_yearly / 12)
                    : plan.price_monthly;

                  return (
                    <div key={plan.id} style={{
                      padding: '1.25rem',
                      border: `2px solid ${isFounders ? '#7C3AED' : isCurrentPlan ? 'var(--color-primary)' : 'var(--color-light-gray)'}`,
                      borderRadius: '12px',
                      background: isCurrentPlan ? 'rgba(247, 155, 114, 0.05)' : isFounders ? 'rgba(124, 58, 237, 0.03)' : 'transparent',
                      position: 'relative',
                    }}>
                      {isFounders && (
                        <span style={{
                          position: 'absolute', top: '-10px', left: '1rem',
                          background: 'linear-gradient(135deg, #7C3AED, #3B8C88)',
                          color: 'white', padding: '2px 10px', borderRadius: '100px',
                          fontSize: '0.7rem', fontWeight: 600,
                        }}>
                          Fundadores
                        </span>
                      )}

                      {/* Name + price */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <strong style={{ fontSize: '1rem' }}>{plan.name}</strong>
                          {isCurrentPlan && <span className="badge badge-info" style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>Actual</span>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{displayPrice}€</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            {billingCycle === 'yearly' ? '/mes (anual)' : '/mes'}
                          </div>
                        </div>
                      </div>

                      {/* Features */}
                      {plan.features && plan.features.length > 0 && (
                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 0.75rem', fontSize: '0.8rem' }}>
                          {plan.features.map((f, i) => (
                            <li key={i} style={{ padding: '0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                              <FiCheckCircle style={{ color: 'var(--color-tertiary)', flexShrink: 0, fontSize: '0.75rem' }} /> {f}
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Trial days note */}
                      {plan.trial_days && !isCurrentPlan && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-tertiary)', margin: '0 0 0.75rem', fontWeight: 500 }}>
                          {plan.trial_days} días de prueba gratis
                        </p>
                      )}

                      {!isCurrentPlan && (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ width: '100%' }}
                          onClick={() => handleSubscribe(plan.id)}
                          disabled={subscribing === plan.id}
                        >
                          {subscribing === plan.id ? 'Procesando...' : 'Suscribirse'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Invoices */}
              {invoices.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <h4 style={{ marginBottom: '1rem' }}>Facturas</h4>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Importe</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((inv, i) => (
                          <tr key={inv.id || i}>
                            <td>{inv.date ? new Date(inv.date).toLocaleDateString('es-ES') : '—'}</td>
                            <td>{inv.amount ? `${inv.amount}€` : '—'}</td>
                            <td>
                              <span className={`badge ${inv.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                                {inv.status === 'paid' ? 'Pagada' : inv.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h3 style={{ marginBottom: '1.5rem' }}>Preferencias de Notificaciones</h3>
              {['Email cuando se completa un informe', 'Notificaciones del chatbot', 'Recordatorios de suscripción'].map((item, i) => (
                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid var(--color-light-gray)' }}>
                  <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px' }} />
                  {item}
                </label>
              ))}
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h3 style={{ marginBottom: '1.5rem' }}>Seguridad</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Para cambiar tu contraseña, te enviaremos un enlace de recuperación a tu email registrado.
              </p>

              {passwordResetSent ? (
                <div style={{
                  background: 'rgba(59, 140, 136, 0.1)',
                  color: 'var(--color-tertiary)',
                  padding: '1rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <FiCheck />
                  Se ha enviado un enlace de recuperación a <strong>{user?.email}</strong>. Revisa tu bandeja de entrada.
                </div>
              ) : (
                <button className="btn btn-primary" onClick={handlePasswordReset} disabled={sendingReset}>
                  <FiMail style={{ marginRight: '0.5rem' }} />
                  {sendingReset ? 'Enviando...' : 'Cambiar contraseña vía email'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
