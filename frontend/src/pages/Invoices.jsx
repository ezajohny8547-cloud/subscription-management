import React, { useState, useEffect } from 'react';
import invoiceService from '../services/invoiceService';
import paymentService from '../services/paymentService';
import discountService from '../services/discountService';
import '../styles/design-system.css';

export default function Invoices({ onNavigateToDetails }) {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [recurringResult, setRecurringResult] = useState(null);

  // Create Invoice Form State
  const [createForm, setCreateForm] = useState({
    customerId: 1,
    subscriptionId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    discountCode: '',
    notes: '',
    lines: [
      { productName: 'Standard SaaS Subscription', description: 'Monthly platform license', quantity: 1, unitPrice: '49.00' }
    ]
  });

  // Record Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    paymentReference: '',
    paymentMethod: 'CREDIT_CARD',
    amount: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const filter = activeTab === 'ALL' ? '' : activeTab;
      const [invList, sumData] = await Promise.all([
        invoiceService.getInvoices({ status: filter }),
        invoiceService.getInvoiceSummary()
      ]);
      setInvoices(invList || []);
      setSummary(sumData || null);
    } catch (err) {
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id) => {
    try {
      await invoiceService.confirmInvoice(id);
      setActionSuccess('Invoice confirmed successfully.');
      loadData();
    } catch (err) {
      alert(`Error confirming invoice: ${err.message}`);
    }
  };

  const handleCancel = async (id) => {
    const reason = prompt('Please enter cancellation reason:');
    if (reason === null) return;
    try {
      await invoiceService.cancelInvoice(id, reason);
      setActionSuccess('Invoice cancelled successfully.');
      loadData();
    } catch (err) {
      alert(`Error cancelling invoice: ${err.message}`);
    }
  };

  const handleSend = async (id) => {
    try {
      await invoiceService.sendInvoice(id);
      setActionSuccess('Invoice marked as sent and notification dispatched.');
      loadData();
    } catch (err) {
      alert(`Error sending invoice: ${err.message}`);
    }
  };

  const handleOpenPayment = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm({
      paymentReference: '',
      paymentMethod: 'CREDIT_CARD',
      amount: invoice.outstandingBalance || '0.00',
      notes: `Payment for ${invoice.invoiceNumber}`
    });
    setShowPaymentModal(true);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    try {
      await paymentService.recordPayment(selectedInvoice.id, {
        paymentReference: paymentForm.paymentReference || undefined,
        paymentMethod: paymentForm.paymentMethod,
        amount: parseFloat(paymentForm.amount),
        notes: paymentForm.notes
      });
      setShowPaymentModal(false);
      setActionSuccess(`Payment recorded against ${selectedInvoice.invoiceNumber}.`);
      loadData();
    } catch (err) {
      alert(`Payment recording failed: ${err.message}`);
    }
  };

  const handleTriggerRecurringBilling = async () => {
    try {
      setLoading(true);
      const res = await invoiceService.triggerRecurringBilling();
      setRecurringResult(res);
      loadData();
    } catch (err) {
      alert(`Recurring billing trigger failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLine = () => {
    setCreateForm({
      ...createForm,
      lines: [...createForm.lines, { productName: '', description: '', quantity: 1, unitPrice: '0.00' }]
    });
  };

  const handleRemoveLine = (idx) => {
    const updated = createForm.lines.filter((_, i) => i !== idx);
    setCreateForm({ ...createForm, lines: updated });
  };

  const handleLineChange = (idx, field, value) => {
    const updated = [...createForm.lines];
    updated[idx][field] = value;
    setCreateForm({ ...createForm, lines: updated });
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        customerId: parseInt(createForm.customerId),
        subscriptionId: createForm.subscriptionId ? parseInt(createForm.subscriptionId) : undefined,
        invoiceDate: createForm.invoiceDate,
        dueDate: createForm.dueDate,
        discountCode: createForm.discountCode || undefined,
        notes: createForm.notes,
        lines: createForm.lines.map(l => ({
          productName: l.productName,
          description: l.description,
          quantity: parseInt(l.quantity),
          unitPrice: parseFloat(l.unitPrice)
        }))
      };
      await invoiceService.createInvoice(payload);
      setShowCreateModal(false);
      setActionSuccess('Draft invoice created successfully.');
      loadData();
    } catch (err) {
      alert(`Failed to create invoice: ${err.message}`);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      inv.invoiceNumber?.toLowerCase().includes(term) ||
      inv.customerName?.toLowerCase().includes(term) ||
      inv.subscriptionNumber?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="page-container">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Invoice Management</h1>
          <p className="helper-text">Manage subscription billing, create invoices, track balances and execute recurring cycles.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setShowRecurringModal(true)}>
            Recurring Billing Run
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            + Create Draft Invoice
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="panel-card" style={{ backgroundColor: '#DDEEE6', borderColor: '#94C4B1', color: 'var(--accent-success)', padding: '12px 16px', marginBottom: 16 }}>
          ✓ {actionSuccess}
        </div>
      )}

      {/* KPI Cards */}
      {summary && (
        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="kpi-title">Outstanding Balance</span>
            <span className="kpi-value accent-primary">${parseFloat(summary.outstandingBalanceSum || 0).toFixed(2)}</span>
            <span className="helper-text" style={{ marginTop: 4 }}>Across all active invoices</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-title">Overdue Invoices</span>
            <span className="kpi-value" style={{ color: '#900C27' }}>
              {summary.overdueCount} <span style={{ fontSize: 16, fontWeight: 400 }}>(${parseFloat(summary.overdueAmountSum || 0).toFixed(2)})</span>
            </span>
            <span className="helper-text" style={{ marginTop: 4 }}>Past due date</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-title">Total Collected</span>
            <span className="kpi-value accent-success">${parseFloat(summary.totalPaidSum || 0).toFixed(2)}</span>
            <span className="helper-text" style={{ marginTop: 4 }}>{summary.paidCount} fully settled</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-title">Pending Drafts</span>
            <span className="kpi-value accent-highlight">{summary.draftCount}</span>
            <span className="helper-text" style={{ marginTop: 4 }}>Awaiting confirmation</span>
          </div>
        </div>
      )}

      {/* Main Card with Tabs & Table */}
      <div className="panel-card">
        {/* Tabs */}
        <div className="tabs-bar">
          {['ALL', 'DRAFT', 'CONFIRMED', 'PAID', 'PARTIALLY_PAID', 'UNPAID', 'OVERDUE'].map(tab => (
            <button
              key={tab}
              className={`tab-item ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="filter-row">
          <input
            type="text"
            className="form-input filter-search"
            placeholder="Search by invoice #, customer name or subscription..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Table */}
        {loading ? (
          <p className="body-text" style={{ textAlign: 'center', padding: 30 }}>Loading invoice records...</p>
        ) : error ? (
          <p className="body-text" style={{ color: 'var(--accent-primary)', textAlign: 'center', padding: 20 }}>{error}</p>
        ) : filteredInvoices.length === 0 ? (
          <p className="body-text text-secondary" style={{ textAlign: 'center', padding: 40 }}>No invoices found matching criteria.</p>
        ) : (
          <div className="table-container">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Invoice Date</th>
                  <th>Due Date</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Outstanding</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <button
                        onClick={() => onNavigateToDetails && onNavigateToDetails(inv.id)}
                        style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {inv.invoiceNumber}
                      </button>
                      {inv.subscriptionNumber && (
                        <div className="helper-text">{inv.subscriptionNumber}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{inv.customerName}</div>
                      <div className="helper-text">{inv.customerEmail}</div>
                    </td>
                    <td>{inv.invoiceDate}</td>
                    <td>
                      <span style={{ color: inv.overdue ? '#900C27' : 'inherit', fontWeight: inv.overdue ? 600 : 400 }}>
                        {inv.dueDate}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>${parseFloat(inv.totalAmount).toFixed(2)}</td>
                    <td style={{ color: 'var(--accent-success)' }}>${parseFloat(inv.amountPaid).toFixed(2)}</td>
                    <td style={{ fontWeight: 700, color: parseFloat(inv.outstandingBalance) > 0 ? 'var(--accent-primary)' : 'inherit' }}>
                      ${parseFloat(inv.outstandingBalance).toFixed(2)}
                    </td>
                    <td>
                      {inv.overdue ? (
                        <span className="badge badge-overdue">OVERDUE</span>
                      ) : (
                        <span className={`badge badge-${inv.status.toLowerCase().replace('_', '-')}`}>
                          {inv.status}
                        </span>
                      )}
                      {inv.paymentStatus === 'PARTIALLY_PAID' && (
                        <div className="badge badge-partially-paid" style={{ marginTop: 4, display: 'block', textAlign: 'center' }}>
                          PARTIAL
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onNavigateToDetails && onNavigateToDetails(inv.id)}
                        >
                          View
                        </button>

                        {inv.status === 'DRAFT' && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => handleConfirm(inv.id)}>
                              Confirm
                            </button>
                            <button className="btn btn-outline btn-sm" onClick={() => handleCancel(inv.id)}>
                              Cancel
                            </button>
                          </>
                        )}

                        {inv.status === 'CONFIRMED' && (
                          <>
                            {parseFloat(inv.outstandingBalance) > 0 && (
                              <button className="btn btn-primary btn-sm" onClick={() => handleOpenPayment(inv)}>
                                Record Payment
                              </button>
                            )}
                            <button className="btn btn-secondary btn-sm" onClick={() => handleSend(inv.id)}>
                              {inv.sentAt ? 'Resend' : 'Send'}
                            </button>
                            {parseFloat(inv.amountPaid) === 0 && (
                              <button className="btn btn-outline btn-sm" onClick={() => handleCancel(inv.id)}>
                                Cancel
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="section-heading" style={{ margin: 0 }}>Record Payment against {selectedInvoice.invoiceNumber}</h2>
              <button onClick={() => setShowPaymentModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSubmitPayment}>
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="body-text">Total Payable:</span>
                  <span style={{ fontWeight: 600 }}>${parseFloat(selectedInvoice.totalAmount).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="body-text">Total Payments Recorded:</span>
                  <span style={{ color: 'var(--accent-success)' }}>${parseFloat(selectedInvoice.amountPaid).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="body-text" style={{ fontWeight: 600 }}>Outstanding Balance:</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>${parseFloat(selectedInvoice.outstandingBalance).toFixed(2)}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedInvoice.outstandingBalance}
                  className="form-input"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                />
                <span className="helper-text">Cannot exceed current outstanding balance. Overpayments are strictly rejected.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method *</label>
                <select
                  className="form-select"
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                >
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="BANK_TRANSFER">Bank Wire / Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CHECK">Check</option>
                  <option value="ONLINE_GATEWAY">Online Gateway</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Reference (Optional)</label>
                <input
                  type="text"
                  placeholder="Auto-generated if left empty"
                  className="form-input"
                  value={paymentForm.paymentReference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentReference: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes / Transaction Log</label>
                <textarea
                  rows="2"
                  className="form-textarea"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm & Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recurring Billing Trigger Modal */}
      {showRecurringModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="section-heading" style={{ margin: 0 }}>Recurring Billing Engine</h2>
              <button onClick={() => { setShowRecurringModal(false); setRecurringResult(null); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div>
              <p className="body-text">
                The recurring billing engine identifies eligible subscriptions due for billing across Daily, Weekly, Monthly, and Yearly intervals. It tracks billing periods and prevents duplicate invoices.
              </p>
              <div style={{ margin: '20px 0' }}>
                <button className="btn btn-primary" onClick={handleTriggerRecurringBilling} disabled={loading}>
                  {loading ? 'Processing Billing Run...' : 'Execute Billing Cycle Now'}
                </button>
              </div>

              {recurringResult && (
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: 16, borderRadius: 8, marginTop: 16 }}>
                  <h3 className="card-heading">Run Results ({recurringResult.runDate})</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <div>Eligible Subscriptions: <strong>{recurringResult.eligibleSubscriptionsCount}</strong></div>
                    <div>Invoices Generated: <strong style={{ color: 'var(--accent-success)' }}>{recurringResult.generatedInvoicesCount}</strong></div>
                    <div>Skipped (Duplicates): <strong>{recurringResult.skippedDuplicatesCount}</strong></div>
                    <div>Failures: <strong style={{ color: 'var(--accent-primary)' }}>{recurringResult.failedCount}</strong></div>
                  </div>
                  {recurringResult.generatedInvoiceNumbers?.length > 0 && (
                    <div>
                      <span className="helper-text">Generated Invoices:</span>
                      <ul style={{ margin: '6px 0', paddingLeft: 20 }}>
                        {recurringResult.generatedInvoiceNumbers.map(n => <li key={n}><code>{n}</code></li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => { setShowRecurringModal(false); setRecurringResult(null); }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Draft Invoice Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 740 }}>
            <div className="modal-header">
              <h2 className="section-heading" style={{ margin: 0 }}>Create Draft Invoice</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateInvoice}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Customer ID *</label>
                  <input
                    type="number"
                    className="form-input"
                    required
                    value={createForm.customerId}
                    onChange={(e) => setCreateForm({ ...createForm, customerId: e.target.value })}
                  />
                  <span className="helper-text">Reference customer from Module 1</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Subscription ID (Optional)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={createForm.subscriptionId}
                    onChange={(e) => setCreateForm({ ...createForm, subscriptionId: e.target.value })}
                  />
                  <span className="helper-text">Reference subscription from Module 2</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Invoice Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    required
                    value={createForm.invoiceDate}
                    onChange={(e) => setCreateForm({ ...createForm, invoiceDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    required
                    value={createForm.dueDate}
                    onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Discount Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. WELCOME10, FLAT25"
                  className="form-input"
                  value={createForm.discountCode}
                  onChange={(e) => setCreateForm({ ...createForm, discountCode: e.target.value })}
                />
              </div>

              <div style={{ marginTop: 16, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ margin: 0 }}>Product Line Items *</label>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddLine}>+ Add Line Item</button>
              </div>

              {createForm.lines.map((line, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Product or Plan Name"
                    className="form-input"
                    required
                    value={line.productName}
                    onChange={(e) => handleLineChange(idx, 'productName', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    min="1"
                    className="form-input"
                    required
                    value={line.quantity}
                    onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Unit Price"
                    className="form-input"
                    required
                    value={line.unitPrice}
                    onChange={(e) => handleLineChange(idx, 'unitPrice', e.target.value)}
                  />
                  {createForm.lines.length > 1 && (
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => handleRemoveLine(idx)}>✕</button>
                  )}
                </div>
              ))}

              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Invoice Notes</label>
                <textarea
                  rows="2"
                  className="form-textarea"
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Draft Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
