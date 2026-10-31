import React, { useState, useEffect } from 'react';
import subscriptionService from '../services/subscriptionService';
import planService from '../services/planService';
import '../styles/design-system.css';

export default function Subscriptions({ onNavigate }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  // Lifecycle Action Modal (for Pause or Close reasons)
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: null, // 'PAUSE' | 'CLOSE'
    subscriptionId: null,
    subscriptionNumber: '',
    reason: '',
  });

  useEffect(() => {
    loadData();
  }, [search, planFilter, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search) params.search = search;
      if (planFilter) params.planId = planFilter;
      if (activeTab !== 'ALL') params.status = activeTab;

      const [subsData, plansData] = await Promise.all([
        subscriptionService.getAllSubscriptions(params),
        planService.getAllPlans(),
      ]);
      setSubscriptions(subsData || []);
      setPlans(plansData || []);
    } catch (err) {
      setError(err.message || 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id, subNumber) => {
    try {
      await subscriptionService.activateSubscription(id);
      setSuccessMsg(`Subscription ${subNumber} activated successfully.`);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Activation failed');
    }
  };

  const handleResume = async (id, subNumber) => {
    try {
      await subscriptionService.resumeSubscription(id);
      setSuccessMsg(`Subscription ${subNumber} resumed back to ACTIVE.`);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Resume failed');
    }
  };

  const handleRenew = async (id, subNumber) => {
    try {
      const renewed = await subscriptionService.renewSubscription(id);
      setSuccessMsg(`Subscription ${subNumber} renewed! Next billing date advanced to ${renewed.nextBillingDate}.`);
      loadData();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setError(err.message || 'Renewal failed');
    }
  };

  const handleOpenActionModal = (type, subscription) => {
    setActionModal({
      isOpen: true,
      type,
      subscriptionId: subscription.subscriptionId,
      subscriptionNumber: subscription.subscriptionNumber,
      reason: type === 'PAUSE' ? 'Customer requested temporary hold' : 'Client requested cancellation',
    });
  };

  const handleConfirmActionModal = async () => {
    const { type, subscriptionId, reason } = actionModal;
    try {
      if (type === 'PAUSE') {
        await subscriptionService.pauseSubscription(subscriptionId, reason);
        setSuccessMsg(`Subscription paused.`);
      } else if (type === 'CLOSE') {
        await subscriptionService.closeSubscription(subscriptionId, reason);
        setSuccessMsg(`Subscription closed.`);
      }
      setActionModal({ isOpen: false, type: null, subscriptionId: null, subscriptionNumber: '', reason: '' });
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Action failed');
    }
  };

  const handleTriggerAutoClose = async () => {
    try {
      const res = await subscriptionService.triggerAutoCloseCheck();
      setSuccessMsg(`Auto-closure processed: ${res.processedCount || 0} expired subscriptions closed according to plan settings.`);
      loadData();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setError(err.message || 'Auto-closure check failed');
    }
  };

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

  // Metrics
  const activeCount = subscriptions.filter((s) => s.status === 'ACTIVE').length;
  const confirmedCount = subscriptions.filter((s) => s.status === 'CONFIRMED').length;
  const pausedCount = subscriptions.filter((s) => s.status === 'PAUSED').length;
  const closedCount = subscriptions.filter((s) => s.status === 'CLOSED').length;

  return (
    <div className="module-container">
      {/* Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Subscription Lifecycle Management</h1>
          <p className="page-subtitle">
            Manage subscription progression: <code>DRAFT → QUOTATION → CONFIRMED → ACTIVE → CLOSED</code>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-outline"
            onClick={handleTriggerAutoClose}
            title="Evaluate plan auto-close rules against current dates"
          >
            ⚡ Run Auto-Close Check
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onNavigate && onNavigate('quotationForm')}
          >
            + New Subscription / Quote
          </button>
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

      {/* Stat Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Active Subscriptions</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>{activeCount}</div>
          <div className="stat-sub">Provisioned & billing normally</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Confirmed (Ready to Activate)</div>
          <div className="stat-value" style={{ color: 'var(--accent-secondary)' }}>{confirmedCount}</div>
          <div className="stat-sub">Awaiting activation on start date</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Paused Subscriptions</div>
          <div className="stat-value" style={{ color: '#926E17' }}>{pausedCount}</div>
          <div className="stat-sub">Temporarily halted services</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Closed / Terminated</div>
          <div className="stat-value" style={{ color: 'var(--text-secondary)' }}>{closedCount}</div>
          <div className="stat-sub">Completed or cancelled</div>
        </div>
      </div>

      {/* Status Progression Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {['ALL', 'CONFIRMED', 'ACTIVE', 'PAUSED', 'DRAFT', 'QUOTATION', 'CLOSED'].map((tab) => (
          <button
            key={tab}
            className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="card-panel" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div className="toolbar-container" style={{ margin: 0 }}>
          <div className="search-input-wrapper">
            <input
              type="text"
              className="form-input"
              placeholder="Search by subscription #, customer name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <select
              className="form-select"
              style={{ width: 200 }}
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
            >
              <option value="">All Plans</option>
              {plans.map((p) => (
                <option key={p.planId} value={p.planId}>
                  {p.planName}
                </option>
              ))}
            </select>

            {(search || planFilter || activeTab !== 'ALL') && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSearch('');
                  setPlanFilter('');
                  setActiveTab('ALL');
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading subscriptions...
          </div>
        ) : subscriptions.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: 16, marginBottom: 8 }}>No subscriptions found.</p>
            <p className="form-helper">Create a new proposal or convert an accepted quotation to get started.</p>
          </div>
        ) : (
          <table className="saas-table">
            <thead>
              <tr>
                <th>Subscription #</th>
                <th>Customer</th>
                <th>Plan & Interval</th>
                <th>Validity Window</th>
                <th>Next Billing Date (Module 3)</th>
                <th>Total Recurring</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => {
                const total = parseFloat(sub.totalAmount || 0);

                return (
                  <tr key={sub.subscriptionId}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{sub.subscriptionNumber}</div>
                      <div className="form-helper">{sub.lines?.length || 0} product line(s)</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{sub.customerName}</div>
                      <div className="form-helper">{sub.customerEmail}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{sub.planName}</div>
                      <span className="badge badge-draft" style={{ fontSize: 10 }}>{sub.billingInterval}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{sub.startDate} → {sub.expiryDate}</div>
                      <div className="form-helper">{sub.billingCyclesCompleted} cycle(s) completed</div>
                    </td>
                    <td>
                      <span className="badge badge-highlight" title="Accurate billing date determined for Module 3 invoices">
                        📅 {sub.nextBillingDate}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: 15 }}>
                      ${total.toFixed(2)}
                    </td>
                    <td>{getStatusBadge(sub.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {/* Dedicated Console View */}
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => onNavigate && onNavigate('subscriptionDetails', { subscriptionId: sub.subscriptionId })}
                        >
                          Details
                        </button>

                        {/* Lifecycle Action Buttons */}
                        {sub.status === 'CONFIRMED' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleActivate(sub.subscriptionId, sub.subscriptionNumber)}
                            title="Activate subscription and start billing cycle"
                          >
                            Activate
                          </button>
                        )}

                        {sub.status === 'ACTIVE' && (
                          <>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenActionModal('PAUSE', sub)}
                            >
                              Pause
                            </button>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleRenew(sub.subscriptionId, sub.subscriptionNumber)}
                              title="Renew subscription and advance billing period"
                            >
                              Renew
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ backgroundColor: 'rgba(110,42,58,0.1)', color: 'var(--accent-primary)', border: 'none' }}
                              onClick={() => handleOpenActionModal('CLOSE', sub)}
                            >
                              Close
                            </button>
                          </>
                        )}

                        {sub.status === 'PAUSED' && (
                          <>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleResume(sub.subscriptionId, sub.subscriptionNumber)}
                            >
                              Resume
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ backgroundColor: 'rgba(110,42,58,0.1)', color: 'var(--accent-primary)', border: 'none' }}
                              onClick={() => handleOpenActionModal('CLOSE', sub)}
                            >
                              Close
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Action Modal (Pause / Close Reason) */}
      {actionModal.isOpen && (
        <div className="modal-backdrop" onClick={() => setActionModal({ ...actionModal, isOpen: false })}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {actionModal.type === 'PAUSE' ? 'Pause Subscription' : 'Early Closure / Cancellation'}
              </h2>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setActionModal({ ...actionModal, isOpen: false })}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 12 }}>
                Confirming transition for <strong>{actionModal.subscriptionNumber}</strong>:
              </p>
              <div className="form-group">
                <label className="form-label required">Reason for Action</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={actionModal.reason}
                  onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
                  placeholder="Explain why this status transition is being applied..."
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setActionModal({ ...actionModal, isOpen: false })}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn ${actionModal.type === 'PAUSE' ? 'btn-secondary' : 'btn-primary'}`}
                onClick={handleConfirmActionModal}
              >
                {actionModal.type === 'PAUSE' ? 'Pause Subscription' : 'Confirm Early Closure'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
