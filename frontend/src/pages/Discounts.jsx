import React, { useState, useEffect } from 'react';
import discountService from '../services/discountService';
import '../styles/design-system.css';

export default function Discounts() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minPurchaseAmount: '',
    minQuantity: '',
    startDate: '',
    endDate: '',
    maxUsageCount: '',
    applicableProductId: '',
    applicableSubscriptionId: ''
  });

  // Tester state
  const [testCode, setTestCode] = useState('');
  const [testSubtotal, setTestSubtotal] = useState('100.00');
  const [testQty, setTestQty] = useState('1');
  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError] = useState(null);

  useEffect(() => {
    loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await discountService.getDiscounts();
      setDiscounts(list || []);
    } catch (err) {
      setError(err.message || 'Failed to load discount rules');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await discountService.toggleDiscount(id);
      setFeedback('Discount rule status updated.');
      loadDiscounts();
    } catch (err) {
      alert(`Error toggling discount: ${err.message}`);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description,
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        minPurchaseAmount: form.minPurchaseAmount ? parseFloat(form.minPurchaseAmount) : undefined,
        minQuantity: form.minQuantity ? parseInt(form.minQuantity) : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        maxUsageCount: form.maxUsageCount ? parseInt(form.maxUsageCount) : undefined,
        applicableProductId: form.applicableProductId ? parseInt(form.applicableProductId) : undefined,
        applicableSubscriptionId: form.applicableSubscriptionId ? parseInt(form.applicableSubscriptionId) : undefined
      };

      await discountService.createDiscount(payload);
      setShowCreateModal(false);
      setFeedback(`Discount rule '${payload.code}' created successfully.`);
      setForm({
        code: '',
        description: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        minPurchaseAmount: '',
        minQuantity: '',
        startDate: '',
        endDate: '',
        maxUsageCount: '',
        applicableProductId: '',
        applicableSubscriptionId: ''
      });
      loadDiscounts();
    } catch (err) {
      alert(`Failed to create discount: ${err.message}`);
    }
  };

  const handleTestDiscount = async (e) => {
    e.preventDefault();
    try {
      setTestError(null);
      setTestResult(null);
      const res = await discountService.validateDiscount(testCode, parseFloat(testSubtotal), parseInt(testQty));
      setTestResult(res);
    } catch (err) {
      setTestError(err.message || 'Discount validation failed');
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Discount Rules Management</h1>
          <p className="helper-text">Configure fixed-amount or percentage promotional rules, usage caps, and product restrictions.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create Discount Rule
        </button>
      </div>

      {feedback && (
        <div className="panel-card" style={{ backgroundColor: '#DDEEE6', borderColor: '#94C4B1', color: 'var(--accent-success)', padding: '12px 16px', marginBottom: 16 }}>
          ✓ {feedback}
        </div>
      )}

      {/* Main Table */}
      <div className="panel-card">
        <h2 className="section-heading">Active & Configured Discount Rules</h2>

        {loading ? (
          <p className="body-text" style={{ textAlign: 'center', padding: 30 }}>Loading discount rules...</p>
        ) : error ? (
          <p className="body-text" style={{ color: 'var(--accent-primary)', textAlign: 'center', padding: 20 }}>{error}</p>
        ) : discounts.length === 0 ? (
          <p className="body-text text-secondary" style={{ textAlign: 'center', padding: 40 }}>No discount rules configured yet.</p>
        ) : (
          <div className="table-container">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type & Value</th>
                  <th>Min Order</th>
                  <th>Usage / Cap</th>
                  <th>Validity Window</th>
                  <th>Restrictions</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map(d => (
                  <tr key={d.id}>
                    <td>
                      <code style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-primary)' }}>{d.code}</code>
                      {d.description && <div className="helper-text">{d.description}</div>}
                    </td>
                    <td>
                      <strong>
                        {d.discountType === 'PERCENTAGE' ? `${parseFloat(d.discountValue)}% OFF` : `$${parseFloat(d.discountValue).toFixed(2)} OFF`}
                      </strong>
                    </td>
                    <td>
                      {d.minPurchaseAmount ? `$${parseFloat(d.minPurchaseAmount).toFixed(2)}` : 'None'}
                      {d.minQuantity ? ` (Min Qty: ${d.minQuantity})` : ''}
                    </td>
                    <td>
                      <strong>{d.currentUsageCount}</strong> / {d.maxUsageCount ? d.maxUsageCount : '∞'}
                      {d.exhausted && (
                        <div className="helper-text" style={{ color: '#900C27' }}>Cap Reached</div>
                      )}
                    </td>
                    <td>
                      {d.startDate || d.endDate ? (
                        <span>{d.startDate || 'Any'} to {d.endDate || 'Ongoing'}</span>
                      ) : (
                        <span className="text-secondary">No expiration</span>
                      )}
                      {d.expired && (
                        <div className="helper-text" style={{ color: '#900C27' }}>Expired</div>
                      )}
                    </td>
                    <td>
                      {d.applicableProductName && <div>Product: {d.applicableProductName}</div>}
                      {d.applicableSubscriptionNumber && <div>Sub: {d.applicableSubscriptionNumber}</div>}
                      {!d.applicableProductName && !d.applicableSubscriptionNumber && (
                        <span className="text-secondary">Universal</span>
                      )}
                    </td>
                    <td>
                      {!d.active ? (
                        <span className="badge badge-inactive">INACTIVE</span>
                      ) : d.expired ? (
                        <span className="badge badge-overdue">EXPIRED</span>
                      ) : d.exhausted ? (
                        <span className="badge badge-overdue">EXHAUSTED</span>
                      ) : (
                        <span className="badge badge-active">ACTIVE</span>
                      )}
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${d.active ? 'btn-outline' : 'btn-success'}`}
                        onClick={() => handleToggle(d.id)}
                      >
                        {d.active ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Discount Tester Card */}
      <div className="panel-card" style={{ maxWidth: 650 }}>
        <h2 className="card-heading">Test Discount Evaluation Engine</h2>
        <p className="helper-text" style={{ marginBottom: 14 }}>
          Simulate discount application against cart subtotal to verify rule evaluation.
        </p>

        <form onSubmit={handleTestDiscount} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <label className="form-label">Discount Code</label>
            <input
              type="text"
              placeholder="e.g. WELCOME10"
              className="form-input"
              required
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Subtotal ($)</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              required
              value={testSubtotal}
              onChange={(e) => setTestSubtotal(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Quantity</label>
            <input
              type="number"
              min="1"
              className="form-input"
              required
              value={testQty}
              onChange={(e) => setTestQty(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary">
            Test
          </button>
        </form>

        {testResult && (
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: 12, borderRadius: 8, marginTop: 14 }}>
            <div style={{ color: 'var(--accent-success)', fontWeight: 600, marginBottom: 4 }}>✓ Discount Code is Valid!</div>
            <div className="body-text">
              Deduction: <strong>${parseFloat(testResult.discountAmount).toFixed(2)}</strong> | Net Subtotal: <strong>${parseFloat(testResult.netSubtotal).toFixed(2)}</strong>
            </div>
          </div>
        )}

        {testError && (
          <div style={{ backgroundColor: '#EED8DC', color: 'var(--accent-primary)', padding: 12, borderRadius: 8, marginTop: 14 }}>
            ✕ {testError}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="section-heading" style={{ margin: 0 }}>Create Discount Rule</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Discount Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. SUMMER25"
                    className="form-input"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Discount Type *</label>
                  <select
                    className="form-select"
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount ($)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Discount Value * ({form.discountType === 'PERCENTAGE' ? '%' : '$'})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-input"
                  required
                  placeholder={form.discountType === 'PERCENTAGE' ? 'e.g. 15 for 15%' : 'e.g. 25.00 for $25 off'}
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Special promotional discount for Q4 campaigns"
                  className="form-input"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Min Purchase Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Optional minimum"
                    className="form-input"
                    value={form.minPurchaseAmount}
                    onChange={(e) => setForm({ ...form, minPurchaseAmount: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Min Quantity</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Optional minimum"
                    className="form-input"
                    value={form.minQuantity}
                    onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Max Usage Limit (Total Redemptions)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Leave empty for unlimited"
                  className="form-input"
                  value={form.maxUsageCount}
                  onChange={(e) => setForm({ ...form, maxUsageCount: e.target.value })}
                />
                <span className="helper-text">Once this limit is reached, concurrent or subsequent requests are blocked.</span>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Discount Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
