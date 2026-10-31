import React, { useState, useEffect } from 'react';
import planService from '../services/planService';
import productService from '../services/productService';
import '../styles/design-system.css';

export default function Plans({ onNavigate }) {
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [intervalFilter, setIntervalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    planName: '',
    planCode: '',
    description: '',
    price: '',
    billingInterval: 'MONTHLY',
    minimumQuantity: 1,
    availabilityStartDate: new Date().toISOString().split('T')[0],
    availabilityEndDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    autoClose: false,
    autoCloseAfterCycles: '',
    status: 'ACTIVE',
    productIds: [],
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [search, intervalFilter, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search) params.search = search;
      if (intervalFilter) params.interval = intervalFilter;
      if (statusFilter) params.status = statusFilter;

      const [plansData, prodsData] = await Promise.all([
        planService.getAllPlans(params),
        productService.getAllProducts({ available: true }),
      ]);
      setPlans(plansData || []);
      setProducts(prodsData || []);
    } catch (err) {
      setError(err.message || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingPlan(null);
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0];
    setFormData({
      planName: '',
      planCode: '',
      description: '',
      price: '',
      billingInterval: 'MONTHLY',
      minimumQuantity: 1,
      availabilityStartDate: today,
      availabilityEndDate: nextYear,
      autoClose: false,
      autoCloseAfterCycles: '',
      status: 'ACTIVE',
      productIds: [],
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan) => {
    setEditingPlan(plan);
    setFormData({
      planName: plan.planName || '',
      planCode: plan.planCode || '',
      description: plan.description || '',
      price: plan.price || '',
      billingInterval: plan.billingInterval || 'MONTHLY',
      minimumQuantity: plan.minimumQuantity || 1,
      availabilityStartDate: plan.availabilityStartDate || '',
      availabilityEndDate: plan.availabilityEndDate || '',
      autoClose: plan.autoClose || false,
      autoCloseAfterCycles: plan.autoCloseAfterCycles || '',
      status: plan.status || 'ACTIVE',
      productIds: plan.productIds ? Array.from(plan.productIds) : [],
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const toggleProductSelection = (productId) => {
    setFormData((prev) => {
      const exists = prev.productIds.includes(productId);
      return {
        ...prev,
        productIds: exists
          ? prev.productIds.filter((id) => id !== productId)
          : [...prev.productIds, productId],
      };
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.planName.trim()) errors.planName = 'Plan name is required';
    if (!formData.planCode.trim()) errors.planCode = 'Plan code is required (e.g. PLAN-PRO-M)';
    if (!formData.price || Number(formData.price) <= 0) {
      errors.price = 'Price must be greater than zero';
    }
    if (!formData.minimumQuantity || Number(formData.minimumQuantity) < 1) {
      errors.minimumQuantity = 'Minimum quantity must be at least 1';
    }
    if (!formData.availabilityStartDate) errors.availabilityStartDate = 'Start date is required';
    if (!formData.availabilityEndDate) errors.availabilityEndDate = 'End date is required';
    if (formData.availabilityStartDate && formData.availabilityEndDate && formData.availabilityEndDate < formData.availabilityStartDate) {
      errors.availabilityEndDate = 'End date cannot be earlier than start date';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      const payload = {
        planName: formData.planName.trim(),
        planCode: formData.planCode.trim().toUpperCase(),
        description: formData.description,
        price: parseFloat(formData.price),
        billingInterval: formData.billingInterval,
        minimumQuantity: parseInt(formData.minimumQuantity, 10),
        availabilityStartDate: formData.availabilityStartDate,
        availabilityEndDate: formData.availabilityEndDate,
        autoClose: formData.autoClose,
        autoCloseAfterCycles: formData.autoCloseAfterCycles ? parseInt(formData.autoCloseAfterCycles, 10) : null,
        status: formData.status,
        productIds: formData.productIds,
      };

      if (editingPlan) {
        await planService.updatePlan(editingPlan.planId, payload);
        setSuccessMsg(`Plan "${payload.planName}" updated successfully.`);
      } else {
        await planService.createPlan(payload);
        setSuccessMsg(`Plan "${payload.planName}" created successfully.`);
      }

      setIsModalOpen(false);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormErrors({ submit: err.message || 'Operation failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (planId, newStatus) => {
    try {
      await planService.updatePlanStatus(planId, newStatus);
      setSuccessMsg('Plan status updated.');
      loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update plan status');
    }
  };

  const handleDelete = async (planId, name) => {
    if (!window.confirm(`Are you sure you want to delete plan "${name}"?`)) return;
    try {
      await planService.deletePlan(planId);
      setSuccessMsg(`Plan "${name}" deleted.`);
      loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete plan');
    }
  };

  return (
    <div className="module-container">
      {/* Page Title & Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Subscription Plan Management</h1>
          <p className="page-subtitle">Configure billing intervals, bundled products, availability windows, and auto-closure rules.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          + Create New Plan
        </button>
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

      {/* Search & Filter Toolbar */}
      <div className="card-panel" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div className="toolbar-container" style={{ margin: 0 }}>
          <div className="search-input-wrapper">
            <input
              type="text"
              className="form-input"
              placeholder="Search plans by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <select
              className="form-select"
              style={{ width: 170 }}
              value={intervalFilter}
              onChange={(e) => setIntervalFilter(e.target.value)}
            >
              <option value="">All Intervals</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>

            <select
              className="form-select"
              style={{ width: 170 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            {(search || intervalFilter || statusFilter) && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSearch('');
                  setIntervalFilter('');
                  setStatusFilter('');
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Plans Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading plans...
          </div>
        ) : plans.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: 16, marginBottom: 8 }}>No subscription plans found.</p>
            <p className="form-helper">Click "+ Create New Plan" to set up your pricing models.</p>
          </div>
        ) : (
          <table className="saas-table">
            <thead>
              <tr>
                <th>Plan Name & Code</th>
                <th>Billing Interval</th>
                <th>Recurring Price</th>
                <th>Min Qty</th>
                <th>Bundled Products</th>
                <th>Availability Window</th>
                <th>Auto-Close</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => {
                const today = new Date().toISOString().split('T')[0];
                const isWithinDates = (!plan.availabilityStartDate || plan.availabilityStartDate <= today) &&
                                      (!plan.availabilityEndDate || plan.availabilityEndDate >= today);
                const isEligibleNow = plan.status === 'ACTIVE' && isWithinDates;

                return (
                  <tr key={plan.planId}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{plan.planName}</div>
                      <div><code>{plan.planCode}</code></div>
                    </td>
                    <td>
                      <span className="badge badge-draft">{plan.billingInterval}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: 15 }}>
                      ${parseFloat(plan.price || 0).toFixed(2)}
                      <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-secondary)' }}>
                        /{plan.billingInterval?.toLowerCase()}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {plan.minimumQuantity} unit{plan.minimumQuantity === 1 ? '' : 's'}
                    </td>
                    <td>
                      {plan.associatedProducts && plan.associatedProducts.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 220 }}>
                          {plan.associatedProducts.map((p) => (
                            <span key={p.productId} className="badge badge-draft" style={{ fontSize: 11 }}>
                              {p.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>None specified</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>
                        {plan.availabilityStartDate} → {plan.availabilityEndDate}
                      </div>
                      <div style={{ marginTop: 2 }}>
                        {isEligibleNow ? (
                          <span className="badge badge-active" style={{ fontSize: 10, padding: '2px 6px' }}>Open for sales</span>
                        ) : (
                          <span className="badge badge-closed" style={{ fontSize: 10, padding: '2px 6px' }}>Unavailable to customers</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {plan.autoClose ? (
                        <div>
                          <span className="badge badge-secondary-accent" style={{ fontSize: 10 }}>Auto-Close ON</span>
                          {plan.autoCloseAfterCycles && (
                            <div className="form-helper">{plan.autoCloseAfterCycles} cycles</div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Continuous</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${plan.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>
                        {plan.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEditModal(plan)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleStatusChange(plan.planId, plan.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                        >
                          {plan.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ backgroundColor: 'rgba(110,42,58,0.1)', color: 'var(--accent-primary)', border: 'none' }}
                          onClick={() => handleDelete(plan.planId, plan.planName)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Plan Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => !saving && setIsModalOpen(false)}>
          <div className="modal-dialog" style={{ maxWidth: 750 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingPlan ? 'Edit Plan' : 'Create Subscription Plan'}</h2>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setIsModalOpen(false)}
                disabled={saving}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formErrors.submit && (
                  <div className="card-panel" style={{ color: 'var(--accent-primary)', marginBottom: 16 }}>
                    {formErrors.submit}
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Plan Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Professional Monthly SaaS"
                      value={formData.planName}
                      onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                    />
                    {formErrors.planName && <span className="form-error">{formErrors.planName}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Plan Code</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. PLAN-PRO-M"
                      value={formData.planCode}
                      onChange={(e) => setFormData({ ...formData, planCode: e.target.value })}
                    />
                    {formErrors.planCode && <span className="form-error">{formErrors.planCode}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Recurring Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-input"
                      placeholder="1999.00"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                    {formErrors.price && <span className="form-error">{formErrors.price}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Billing Interval</label>
                    <select
                      className="form-select"
                      value={formData.billingInterval}
                      onChange={(e) => setFormData({ ...formData, billingInterval: e.target.value })}
                    >
                      <option value="DAILY">DAILY</option>
                      <option value="WEEKLY">WEEKLY</option>
                      <option value="MONTHLY">MONTHLY</option>
                      <option value="YEARLY">YEARLY</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Minimum Quantity</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={formData.minimumQuantity}
                      onChange={(e) => setFormData({ ...formData, minimumQuantity: e.target.value })}
                    />
                    {formErrors.minimumQuantity && <span className="form-error">{formErrors.minimumQuantity}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Availability Start Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.availabilityStartDate}
                      onChange={(e) => setFormData({ ...formData, availabilityStartDate: e.target.value })}
                    />
                    {formErrors.availabilityStartDate && <span className="form-error">{formErrors.availabilityStartDate}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Availability End Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.availabilityEndDate}
                      onChange={(e) => setFormData({ ...formData, availabilityEndDate: e.target.value })}
                    />
                    {formErrors.availabilityEndDate && <span className="form-error">{formErrors.availabilityEndDate}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Plan Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Describe included entitlements, SLAs, and target customers..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {/* Auto-Close Settings */}
                <div className="card-panel" style={{ backgroundColor: 'var(--bg-secondary)', padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <input
                      type="checkbox"
                      id="autoCloseCheck"
                      style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                      checked={formData.autoClose}
                      onChange={(e) => setFormData({ ...formData, autoClose: e.target.checked })}
                    />
                    <label htmlFor="autoCloseCheck" style={{ fontWeight: 600, cursor: 'pointer' }}>
                      Enable Automatic Closure Policy
                    </label>
                  </div>
                  <div className="form-helper" style={{ marginBottom: 10 }}>
                    Automatically close subscriptions on expiration or after completing a set number of billing cycles.
                  </div>
                  {formData.autoClose && (
                    <div style={{ maxWidth: 300 }}>
                      <label className="form-label">Auto-close after completed cycles (optional)</label>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        placeholder="e.g. 12 for annual completion"
                        value={formData.autoCloseAfterCycles}
                        onChange={(e) => setFormData({ ...formData, autoCloseAfterCycles: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                {/* Associated Products Multi-Selector */}
                <div className="form-group">
                  <label className="form-label">Associated Product(s)</label>
                  <div className="form-helper" style={{ marginBottom: 8 }}>
                    Select which catalog items are associated with this plan.
                  </div>
                  <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-button)', padding: 10, background: '#FFF' }}>
                    {products.map((p) => (
                      <div
                        key={p.productId}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', cursor: 'pointer' }}
                        onClick={() => toggleProductSelection(p.productId)}
                      >
                        <input
                          type="checkbox"
                          checked={formData.productIds.includes(p.productId)}
                          onChange={() => {}} // Controlled by row click
                          style={{ width: 16, height: 16, accentColor: 'var(--accent-primary)' }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                        <span className="badge badge-draft" style={{ fontSize: 10 }}>{p.type}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: 12, marginLeft: 'auto' }}>
                          ${parseFloat(p.salesPrice || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingPlan ? 'Save Plan Changes' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
