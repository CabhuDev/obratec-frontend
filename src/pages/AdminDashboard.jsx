import { useState, useEffect } from 'react';
import { dashboardAPI, organizationsAPI, billingAPI } from '../services/api';
import { FiUsers, FiFileText, FiDollarSign, FiActivity, FiTrash2, FiUserPlus, FiEdit } from 'react-icons/fi';

function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [inviting, setInviting] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [summaryRes, usersRes, subRes, invoicesRes] = await Promise.allSettled([
        dashboardAPI.getSummary(),
        organizationsAPI.listUsers(),
        billingAPI.getSubscription(),
        billingAPI.listInvoices(),
      ]);

      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data.users || usersRes.value.data || []);
      if (subRes.status === 'fulfilled') setSubscription(subRes.value.data);
      if (invoicesRes.status === 'fulfilled') setInvoices(invoicesRes.value.data.invoices || invoicesRes.value.data || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const inviteUser = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      await organizationsAPI.inviteUser({ email: inviteEmail, role: inviteRole });
      setInviteEmail('');
      const res = await organizationsAPI.listUsers();
      setUsers(res.data.users || res.data || []);
    } catch (error) {
      alert(error.response?.data?.detail || 'Error al invitar usuario');
    } finally {
      setInviting(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await organizationsAPI.updateUser(userId, { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setEditingUser(null);
    } catch (error) {
      alert(error.response?.data?.detail || 'Error al actualizar rol');
    }
  };

  const removeUser = async (userId) => {
    if (!confirm('¿Eliminar este usuario de la organización?')) return;
    try {
      await organizationsAPI.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      alert(error.response?.data?.detail || 'Error al eliminar usuario');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const reports = summary?.reports || {};
  const storage = summary?.storage || {};
  const usersInfo = summary?.users || {};
  const plan = summary?.plan || {};
  const freeTrial = summary?.free_trial || {};

  return (
    <div className="fade-in">
      <div className="dashboard-header">
        <div>
          <h2>Panel de Administración</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Gestión de la organización
          </p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon secondary">
            <FiUsers />
          </div>
          <div className="stat-content">
            <div className="stat-value">{usersInfo.current || users.length} / {usersInfo.max || '—'}</div>
            <div className="stat-label">Usuarios</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon primary">
            <FiFileText />
          </div>
          <div className="stat-content">
            <div className="stat-value">{reports.total || 0}</div>
            <div className="stat-label">Total Informes</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon tertiary">
            <FiActivity />
          </div>
          <div className="stat-content">
            <div className="stat-value">{reports.this_month || 0}</div>
            <div className="stat-label">Informes Este Mes</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <FiDollarSign />
          </div>
          <div className="stat-content">
            <div className="stat-value">{plan.name || 'Free Trial'}</div>
            <div className="stat-label">Plan Actual</div>
          </div>
        </div>
      </div>

      {/* Storage */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ marginBottom: '0.75rem' }}>Almacenamiento</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1, height: '10px', background: 'var(--color-light-gray)', borderRadius: '5px' }}>
            <div style={{
              width: `${Math.min(storage.percent_used || 0, 100)}%`,
              height: '100%',
              background: (storage.percent_used || 0) > 80 ? 'var(--color-danger)' : 'var(--color-tertiary)',
              borderRadius: '5px',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            {storage.percent_used || 0}% usado
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Users Management */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Usuarios de la Organización</h3>
          </div>

          {/* Invite Form */}
          <form onSubmit={inviteUser} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="email"
              className="form-input"
              placeholder="Email del usuario"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              style={{ flex: 1 }}
            />
            <select
              className="form-input"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              style={{ width: '120px' }}
            >
              <option value="editor">Editor</option>
              <option value="viewer">Visor</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" className="btn btn-primary" disabled={inviting}>
              <FiUserPlus />
            </button>
          </form>

          {/* Users List */}
          <div>
            {users.map((u) => (
              <div key={u.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 0',
                borderBottom: '1px solid var(--color-light-gray)'
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'var(--color-bg-light)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontWeight: 600, fontSize: '0.8rem'
                }}>
                  {(u.first_name?.[0] || '')}{(u.last_name?.[0] || '')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{u.first_name} {u.last_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                </div>
                {editingUser === u.id ? (
                  <select
                    className="form-input"
                    value={u.role}
                    onChange={(e) => updateUserRole(u.id, e.target.value)}
                    onBlur={() => setEditingUser(null)}
                    style={{ width: '100px', padding: '0.25rem' }}
                    autoFocus
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Visor</option>
                  </select>
                ) : (
                  <span className="badge badge-info" style={{ cursor: 'pointer' }} onClick={() => setEditingUser(u.id)}>
                    {u.role === 'admin' ? 'Admin' : u.role === 'editor' ? 'Editor' : 'Visor'}
                  </span>
                )}
                <button className="btn btn-outline btn-sm" onClick={() => setEditingUser(u.id)} title="Cambiar rol">
                  <FiEdit />
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => removeUser(u.id)} title="Eliminar">
                  <FiTrash2 />
                </button>
              </div>
            ))}
            {users.length === 0 && (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>
                No hay usuarios en la organización
              </p>
            )}
          </div>
        </div>

        {/* Subscription Info */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Suscripción</h3>
          </div>

          {subscription ? (
            <div>
              <div style={{ background: 'var(--color-bg-light)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4>{subscription.plan_name || subscription.plan_id}</h4>
                    <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                      {subscription.price_monthly ? `${subscription.price_monthly}€/mes` : ''}
                    </p>
                  </div>
                  <span className={`badge ${subscription.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                    {subscription.status === 'active' ? 'Activo' : subscription.status}
                  </span>
                </div>
                {subscription.current_period_end && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    Próxima factura: {new Date(subscription.current_period_end).toLocaleDateString('es-ES')}
                  </p>
                )}
              </div>

              {/* Invoices */}
              <h4 style={{ marginBottom: '0.75rem' }}>Facturas Recientes</h4>
              {invoices.length > 0 ? (
                <div>
                  {invoices.slice(0, 5).map((invoice, i) => (
                    <div key={invoice.id || i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.5rem 0', borderBottom: '1px solid var(--color-light-gray)',
                      fontSize: '0.875rem'
                    }}>
                      <span>{invoice.date ? new Date(invoice.date).toLocaleDateString('es-ES') : '—'}</span>
                      <span>{invoice.amount ? formatCurrency(invoice.amount) : '—'}</span>
                      <span className={`badge ${invoice.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                        {invoice.status === 'paid' ? 'Pagada' : invoice.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No hay facturas</p>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              {freeTrial.is_trial ? (
                <>
                  <p style={{ color: 'var(--color-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Periodo de Prueba
                  </p>
                  {freeTrial.trial_days_remaining != null && (
                    <p style={{
                      fontSize: '2rem', fontWeight: 700, margin: '0 0 0.5rem',
                      color: freeTrial.trial_days_remaining <= 7 ? 'var(--color-danger)' : 'var(--color-secondary)',
                    }}>
                      {freeTrial.trial_days_remaining} {freeTrial.trial_days_remaining === 1 ? 'día' : 'días'} restantes
                    </p>
                  )}
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Configura un plan en Ajustes para acceso completo
                  </p>
                </>
              ) : (
                <>
                  <p style={{ color: 'var(--text-secondary)' }}>No hay suscripción activa</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Configura un plan en Ajustes
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
