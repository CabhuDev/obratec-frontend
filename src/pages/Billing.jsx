import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { billingAPI } from '../services/api';
import { useAuth } from '../App';
import SkeletonLoader from '../components/SkeletonLoader';
import {
  FiCreditCard, FiFileText, FiCheckCircle, FiAlertCircle,
  FiExternalLink, FiTrash2, FiRefreshCw, FiCalendar,
  FiPackage, FiAlertTriangle,
} from 'react-icons/fi';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const STATUS_LABELS = {
  active: { text: 'Activa', cls: 'badge-success' },
  trialing: { text: 'En prueba', cls: 'badge-info' },
  past_due: { text: 'Pago pendiente', cls: 'badge-danger' },
  canceled: { text: 'Cancelada', cls: 'badge-warning' },
  paid: { text: 'Pagada', cls: 'badge-success' },
  open: { text: 'Pendiente', cls: 'badge-warning' },
  void: { text: 'Anulada', cls: 'badge-danger' },
  draft: { text: 'Borrador', cls: 'badge-warning' },
};

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] || { text: status, cls: 'badge-info' };
  return <span className={`badge ${s.cls}`}>{s.text}</span>;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatAmount(amount, currency = 'EUR') {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency', currency: currency.toUpperCase(),
  }).format(amount);
}

function Billing() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [subscription, setSubscription] = useState(undefined); // undefined = not loaded
  const [invoices, setInvoices] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canceling, setCanceling] = useState(false);
  const [deletingPm, setDeletingPm] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subRes, invRes, pmRes] = await Promise.all([
        billingAPI.getSubscription(),
        billingAPI.listInvoices(),
        billingAPI.getPaymentMethods(),
      ]);
      setSubscription(subRes.data);
      setInvoices(invRes.data?.invoices || []);
      setPaymentMethods(pmRes.data?.payment_methods || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar la información de facturación');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('¿Cancelar la suscripción al final del período actual?')) return;
    setCanceling(true);
    try {
      await billingAPI.cancel();
      setActionMsg({ type: 'success', text: 'Suscripción cancelada. Seguirá activa hasta el final del período.' });
      fetchAll();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.detail || 'Error al cancelar' });
    } finally {
      setCanceling(false);
    }
  };

  const handleDeletePm = async (id) => {
    if (!window.confirm('¿Eliminar este método de pago?')) return;
    setDeletingPm(id);
    try {
      await billingAPI.deletePaymentMethod(id);
      setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
      setActionMsg({ type: 'success', text: 'Método de pago eliminado' });
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.detail || 'Error al eliminar' });
    } finally {
      setDeletingPm(null);
    }
  };

  if (loading) return <SkeletonLoader type="dashboard" />;

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="card"
        style={{ textAlign: 'center', padding: 'var(--spacing-xxl)' }}
      >
        <FiAlertCircle style={{ fontSize: '3rem', color: 'var(--color-danger)', marginBottom: 'var(--spacing-md)' }} />
        <h3 style={{ color: 'var(--color-secondary)', marginBottom: 'var(--spacing-sm)' }}>
          Error al cargar facturación
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>{error}</p>
        <button className="btn btn-primary" onClick={fetchAll}>
          <FiRefreshCw /> Reintentar
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={itemVariants} className="dashboard-header">
        <div>
          <h2>Facturación</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Gestiona tu suscripción, facturas y métodos de pago
          </p>
        </div>
        {!subscription && (
          <Link to="/app/settings" className="btn btn-primary">
            <FiPackage /> Ver planes
          </Link>
        )}
      </motion.div>

      {/* Action message */}
      {actionMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`card`}
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)',
            background: actionMsg.type === 'success'
              ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: `1px solid ${actionMsg.type === 'success'
              ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          {actionMsg.type === 'success'
            ? <FiCheckCircle style={{ color: 'var(--color-success)', fontSize: '1.25rem', flexShrink: 0 }} />
            : <FiAlertCircle style={{ color: 'var(--color-danger)', fontSize: '1.25rem', flexShrink: 0 }} />}
          <span style={{ color: actionMsg.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {actionMsg.text}
          </span>
          <button
            onClick={() => setActionMsg(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1.1rem' }}
          >×</button>
        </motion.div>
      )}

      {/* Suscripción activa */}
      <motion.div variants={itemVariants} className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiPackage style={{ color: 'var(--color-primary)' }} />
            Suscripción
          </h3>
        </div>

        {subscription ? (
          <div>
            {/* Cancel warning */}
            {subscription.cancel_at_period_end && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)',
                padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)',
                marginBottom: 'var(--spacing-lg)',
              }}>
                <FiAlertTriangle style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
                <span style={{ color: 'var(--color-warning)', fontSize: '0.9rem' }}>
                  La suscripción se cancelará el <strong>{formatDate(subscription.current_period_end)}</strong>.
                  Contacta con soporte si quieres reactivarla.
                </span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-lg)' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Plan</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-secondary)' }}>
                  {subscription.plan_name || '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Estado</div>
                <StatusBadge status={subscription.status} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <FiCalendar size={12} /> Período actual
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-secondary)' }}>
                  {formatDate(subscription.current_period_start)} — {formatDate(subscription.current_period_end)}
                </div>
              </div>
              {subscription.trial_end && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Fin del período de prueba</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-secondary)' }}>{formatDate(subscription.trial_end)}</div>
                </div>
              )}
            </div>

            {isAdmin && !subscription.cancel_at_period_end && (
              <div style={{ marginTop: 'var(--spacing-lg)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--color-light-gray)', display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                <Link to="/app/settings" className="btn btn-outline btn-sm">
                  <FiPackage /> Cambiar plan
                </Link>
                <button
                  className="btn btn-sm"
                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                  onClick={handleCancel}
                  disabled={canceling}
                >
                  {canceling ? 'Cancelando...' : 'Cancelar suscripción'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: 'var(--spacing-xl)' }}>
            <FiPackage style={{ fontSize: '2.5rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }} />
            <h3>Sin suscripción activa</h3>
            <p>Estás en el período de prueba gratuita.</p>
            <Link to="/app/settings" className="btn btn-primary" style={{ marginTop: 'var(--spacing-md)' }}>
              Ver planes disponibles
            </Link>
          </div>
        )}
      </motion.div>

      {/* Métodos de pago */}
      <motion.div variants={itemVariants} className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiCreditCard style={{ color: 'var(--color-primary)' }} />
            Métodos de Pago
          </h3>
        </div>

        {paymentMethods.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {paymentMethods.map(pm => (
              <div key={pm.id} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)',
                padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)',
                border: `1px solid ${pm.is_default ? 'var(--color-primary)' : 'var(--color-light-gray)'}`,
                background: pm.is_default ? 'rgba(247, 155, 114, 0.04)' : 'transparent',
              }}>
                <FiCreditCard style={{ fontSize: '1.5rem', color: pm.is_default ? 'var(--color-primary)' : 'var(--text-secondary)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, textTransform: 'capitalize', fontSize: '0.95rem' }}>
                    {pm.brand} •••• {pm.last4}
                    {pm.is_default && <span className="badge badge-success" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>Principal</span>}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Vence {pm.exp_month}/{pm.exp_year}
                  </div>
                </div>
                {isAdmin && (
                  <button
                    className="btn btn-sm"
                    style={{ background: 'none', color: 'var(--color-danger)', border: 'none', padding: '0.4rem' }}
                    onClick={() => handleDeletePm(pm.id)}
                    disabled={deletingPm === pm.id}
                    aria-label="Eliminar método de pago"
                  >
                    {deletingPm === pm.id ? '...' : <FiTrash2 />}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-secondary)' }}>
            <FiCreditCard style={{ fontSize: '2rem', marginBottom: 'var(--spacing-sm)', opacity: 0.4 }} />
            <p style={{ margin: 0 }}>No hay métodos de pago registrados</p>
          </div>
        )}
      </motion.div>

      {/* Historial de facturas */}
      <motion.div variants={itemVariants} className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiFileText style={{ color: 'var(--color-primary)' }} />
            Historial de Facturas
          </h3>
          {invoices.length > 0 && (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {invoices.length} {invoices.length === 1 ? 'factura' : 'facturas'}
            </span>
          )}
        </div>

        {invoices.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="table-container invoices-desktop-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Período</th>
                    <th>Importe</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id}>
                      <td style={{ fontSize: '0.9rem' }}>{formatDate(inv.created_at)}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {inv.period_start && inv.period_end
                          ? `${formatDate(inv.period_start)} — ${formatDate(inv.period_end)}`
                          : '—'}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>
                        {formatAmount(inv.amount, inv.currency)}
                      </td>
                      <td><StatusBadge status={inv.status} /></td>
                      <td>
                        {inv.stripe_invoice_url ? (
                          <a href={inv.stripe_invoice_url} target="_blank" rel="noopener noreferrer"
                            className="btn btn-outline btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <FiExternalLink size={13} /> Ver
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="invoices-mobile-list">
              {invoices.map(inv => (
                <div key={inv.id} className="invoice-mobile-card">
                  <div className="invoice-mobile-main">
                    <StatusBadge status={inv.status} />
                    <span className="invoice-mobile-amount">{formatAmount(inv.amount, inv.currency)}</span>
                  </div>
                  <div className="invoice-mobile-meta">
                    {formatDate(inv.created_at)}
                    {inv.period_start && inv.period_end && (
                      <> · {formatDate(inv.period_start)} — {formatDate(inv.period_end)}</>
                    )}
                  </div>
                  {inv.stripe_invoice_url && (
                    <a href={inv.stripe_invoice_url} target="_blank" rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginLeft: 'auto' }}>
                      <FiExternalLink size={13} /> Ver
                    </a>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-secondary)' }}>
            <FiFileText style={{ fontSize: '2rem', marginBottom: 'var(--spacing-sm)', opacity: 0.4 }} />
            <p style={{ margin: 0 }}>No hay facturas todavía</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default Billing;
