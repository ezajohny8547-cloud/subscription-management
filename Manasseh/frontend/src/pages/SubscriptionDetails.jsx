import React, { useState, useEffect } from 'react';
import subscriptionService from '../services/subscriptionService';
import '../styles/design-system.css';

export default function SubscriptionDetails({ subscriptionId, onNavigate }) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    targetStatus: null,
    reason: '',
  });

  useEffect(() => {
    if (subscriptionId) {
      loadDetails();
    }
  }, [subscriptionId]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await subscriptionService.getSubscriptionById(subscriptionId);
      setSubscription(data);
    } catch (err) {
      setError(err.message || 'Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteTransition = async (targetStatus, defaultReason = '') => {
    try {
      await subscriptionService.transitionStatus(subscriptionId, targetStatus, defaultReason);
      setSuccessMsg(`Status updated to ${targetStatus}.`);
      setActionModal({ isOpen: false, targetStatus: null, reason: '' });
      loadDetails();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Transition failed');
    }
  };

  const handleRenew = async () => {
    try {
      const renewed = await subscriptionService.renewSubscription(subscriptionId);
      setSuccessMsg(`Subscription renewed successfully! New expiry: ${renewed.expiryDate}. Next billing: ${renewed.nextBillingDate}.`);
      loadDetails();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setError(err.message || 'Renewal failed');
    }
  };

  if (loading) {
    return (
      <div className="module-container" style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading subscription lifecycle details...
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="module-container">
        <div className="card-panel" style={{ borderLeft: '4px solid var(--accent-primary)', color: 'var(--accent-primary)' }}>
          {error || 'Subscription not found'}
        </div>
        <button className="btn btn-secondary" onClick={() => onNavigate && onNavigate('subscriptions')}>
          ← Back to Subscriptions
        </button>
      </div>
    );
  }

  // Stepper calculations
  const steps = ['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'CLOSED'];
  const currentStatus = subscription.status;
  const currentIndex = steps.indexOf(currentStatus);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT': return <span className="badge badge-draft">Draft</span>;
      case 'QUOTATION': return <span className="badge badge-quotation">Quotation</span>;
      case 'CONFIRMED': return <span className="badge badge-confirmed">Confirmed</span>;
      case 'ACTIVE': return <span className="badge badge-active">Active</span>;
      case 'PAUSED': return <span className="badge badge-paused">Paused</span>;
      case 'CLOSED': return <span className="badge badge-closed">Closed</span>;
      default: return <span className="badge badge-draft">{status}</span>;
    }
  };

  return (
    <div className="module-container">
      {/* Navigation Breadcrumb */}
      <div style={{ marginBottom: 16 }}>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => onNavigate && onNavigate('subscriptions')}
          style={{ marginRight: 12 }}
        >
          ← Back to Subscriptions
        </button>
        <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-helper)' }}>
          Subscriptions / Details / {subscription.subscriptionNumber}
        </span>
      </div>

      {/* Title & Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <h1 className="page-title">{subscription.subscriptionNumber}</h1>
            {getStatusBadge(subscription.status)}
          </div>
          <p className="page-subtitle">
            Customer: <strong>{subscription.customerName}</strong> ({subscription.customerEmail}) • Plan: <strong>{subscription.planName}</strong>
          </p>
        </div>

        {/* Dynamic Action Buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {currentStatus === 'CONFIRMED' && (
            <button
              className="btn btn-primary"
              onClick={() => handleExecuteTransition('ACTIVE', 'Provisioned and activated on start date.')}
            >
              ✓ Activate Subscription
            </button>
          )}

          {currentStatus === 'ACTIVE' && (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setActionModal({ isOpen: true, targetStatus: 'PAUSED', reason: 'Customer requested pause' })}
              >
                ⏸ Pause
              </button>
              <button
                className="btn btn-success"
                onClick={handleRenew}
                title="Advance billing cycle and extend expiration date"
              >
                ↻ Renew Subscription
              </button>
              <button
                className="btn btn-outline"
                style={{ color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}
                onClick={() => setActionModal({ isOpen: true, targetStatus: 'CLOSED', reason: 'Early cancellation' })}
              >
                ✕ Early Close
              </button>
            </>
          )}

          {currentStatus === 'PAUSED' && (
            <>
              <button
                className="btn btn-primary"
                onClick={() => handleExecuteTransition('ACTIVE', 'Resumed by staff.')}
              >
                ▶ Resume Subscription
              </button>
              <button
                className="btn btn-outline"
                style={{ color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}
                onClick={() => setActionModal({ isOpen: true, targetStatus: 'CLOSED', reason: 'Terminated during pause' })}
              >
                ✕ Close
              </button>
            </>
          )}

          {currentStatus === 'DRAFT' && (
            <button
              className="btn btn-primary"
              onClick={() => handleExecuteTransition('CONFIRMED', 'Draft confirmed directly.')}
            >
              Confirm Agreement
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="card-panel" style={{ borderLeft: '4px solid var(--color-success)', color: 'var(--color-success)', marginBottom: 16 }}>
          ✓ {successMsg}
        </div>
      )}
      {error && (
        <div className="card-panel" style={{ borderLeft: '4px solid var(--accent-primary)', color: 'var(--accent-primary)', marginBottom: 16 }}>
          ⚠ {error}
        </div>
      )}

      {/* Status Progression Stepper */}
      <div className="timeline-stepper">
        {steps.map((st, idx) => {
          let nodeClass = '';
          if (currentStatus === st) {
            nodeClass = 'active';
          } else if (currentIndex > -1 && idx < currentIndex) {
            nodeClass = 'completed';
          } else if (currentStatus === 'PAUSED' && st === 'ACTIVE') {
            nodeClass = 'active';
          }

          return (
            <div key={st} className={`step-node ${nodeClass}`}>
              <div className="step-circle">
                {idx + 1}
              </div>
              <div className="step-label">
                {st}
                {currentStatus === 'PAUSED' && st === 'ACTIVE' && (
                  <div style={{ fontSize: 11, color: 'var(--accent-secondary)' }}>(PAUSED)</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Module 3 Billing Integration Bridge Banner */}
      <div className="card-panel" style={{ backgroundColor: 'var(--bg-secondary)', borderLeft: '5px solid var(--color-highlight)', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>
              Module 3 Invoicing Schedule Link
            </div>
            <div style={{ fontSize: 'var(--font-size-body)', color: 'var(--text-secondary)' }}>
              Accurate billing dates are stored here for Module 3 (Billing & Invoicing) to determine when invoices are due.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div className="stat-label">Next Invoice Due</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-primary)' }}>
                {subscription.nextBillingDate}
              </div>
            </div>
            <div style={{ textAlign: 'right', borderLeft: '1px solid var(--border-color)', paddingLeft: 20 }}>
              <div className="stat-label">Billing Frequency</div>
              <div style={{ fontWeight: 600 }}>{subscription.billingInterval}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Summary Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Recurring Amount</div>
          <div className="stat-value">${parseFloat(subscription.totalAmount || 0).toFixed(2)}</div>
          <div className="stat-sub">Subtotal: ${parseFloat(subscription.subtotal || 0).toFixed(2)} + Tax: ${parseFloat(subscription.taxTotal || 0).toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Term Validity Window</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>
            {subscription.startDate} → {subscription.expiryDate}
          </div>
          <div className="stat-sub">{subscription.billingCyclesCompleted} cycle(s) completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Payment Terms</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>
            {subscription.paymentTerms}
          </div>
          <div className="stat-sub">Commercial credit arrangement</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Originating Quotation</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>
            {subscription.quotationNumber || 'Direct Creation'}
          </div>
          <div className="stat-sub">Commercial contract reference</div>
        </div>
      </div>

      {/* Itemized Lines */}
      <div className="card-panel">
        <h2 className="section-heading">Subscribed Product Lines</h2>
        <div className="table-container" style={{ marginBottom: 20 }}>
          <table className="saas-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Variant / Spec</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Tax Rate</th>
                <th>Tax Amount</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {subscription.lines?.map((line) => (
                <tr key={line.lineId}>
                  <td style={{ fontWeight: 600 }}>{line.productName}</td>
                  <td>{line.variantName || 'Standard'}</td>
                  <td>{line.quantity}</td>
                  <td>${parseFloat(line.unitPrice || 0).toFixed(2)}</td>
                  <td>{parseFloat(line.taxRate || 0)}%</td>
                  <td>${parseFloat(line.taxAmount || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                    ${parseFloat(line.lineTotal || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 280, background: 'var(--bg-secondary)', padding: 16, borderRadius: 'var(--radius-button)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="form-label">Subtotal:</span>
              <span>${parseFloat(subscription.subtotal || 0).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="form-label">Taxes:</span>
              <span>${parseFloat(subscription.taxTotal || 0).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--border-color)', paddingTop: 8, fontWeight: 700, fontSize: 17 }}>
              <span>Recurring Total:</span>
              <span style={{ color: 'var(--accent-primary)' }}>${parseFloat(subscription.totalAmount || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lifecycle Audit Log */}
      <div className="card-panel">
        <h2 className="section-heading">Lifecycle Audit Trail & State Progression Log</h2>
        {(!subscription.history || subscription.history.length === 0) ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
            No status change events recorded yet.
          </div>
        ) : (
          <div className="table-container">
            <table className="saas-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Previous Status</th>
                  <th>New Status</th>
                  <th>Operator</th>
                  <th>Reason / Notes</th>
                </tr>
              </thead>
              <tbody>
                {subscription.history.map((h) => (
                  <tr key={h.historyId}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                      {h.createdAt ? new Date(h.createdAt).toLocaleString() : 'N/A'}
                    </td>
                    <td>{h.previousStatus ? getStatusBadge(h.previousStatus) : <em>Initial</em>}</td>
                    <td>{getStatusBadge(h.newStatus)}</td>
                    <td><code>{h.changedBy || 'SYSTEM'}</code></td>
                    <td>{h.changeReason || 'Standard lifecycle event'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transition Modal */}
      {actionModal.isOpen && (
        <div className="modal-backdrop" onClick={() => setActionModal({ isOpen: false, targetStatus: null, reason: '' })}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Transition to {actionModal.targetStatus}</h2>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setActionModal({ isOpen: false, targetStatus: null, reason: '' })}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label required">Reason for Status Change</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={actionModal.reason}
                  onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
                  placeholder="Record why this transition is occurring for audit trail compliance..."
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setActionModal({ isOpen: false, targetStatus: null, reason: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleExecuteTransition(actionModal.targetStatus, actionModal.reason)}
              >
                Confirm Transition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
