import React, { useState, useEffect } from 'react';
import paymentService from '../services/paymentService';
import invoiceService from '../services/invoiceService';
import '../styles/design-system.css';

export default function Payments({ onNavigateToInvoice }) {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [feedback, setFeedback] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [form, setForm] = useState({
    invoiceId: '',
    paymentReference: '',
    paymentMethod: 'CREDIT_CARD',
    amount: '',
    notes: ''
  });

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const [list, sumData] = await Promise.all([
        paymentService.getAllPayments(),
        paymentService.getPaymentSummary()
      ]);
      setPayments(list || []);
      setSummary(sumData || null);
    } catch (err) {
      setError(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRecordModal = async () => {
    try {
      const invList = await invoiceService.getInvoices({ status: 'CONFIRMED' });
      const eligible = (invList || []).filter(inv => parseFloat(inv.outstandingBalance) > 0);
      setUnpaidInvoices(eligible);
      if (eligible.length > 0) {
        setSelectedInvoice(eligible[0]);
        setForm({
          invoiceId: eligible[0].id.toString(),
          paymentReference: '',
          paymentMethod: 'CREDIT_CARD',
          amount: eligible[0].outstandingBalance,
          notes: ''
        });
      }
      setShowModal(true);
    } catch (err) {
      alert(`Could not load eligible invoices: ${err.message}`);
    }
  };

  const handleInvoiceChange = (invId) => {
    const found = unpaidInvoices.find(inv => inv.id.toString() === invId);
    setSelectedInvoice(found || null);
    setForm(prev => ({
      ...prev,
      invoiceId: invId,
      amount: found ? found.outstandingBalance : ''
    }));
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) {
      alert('Please select an eligible invoice');
      return;
    }

    const payAmount = parseFloat(form.amount);
    const outstanding = parseFloat(selectedInvoice.outstandingBalance);

    if (payAmount <= 0) {
      alert('Payment amount must be greater than zero.');
      return;
    }

    if (payAmount > outstanding) {
      alert(`Overpayment rejected: $${payAmount.toFixed(2)} exceeds current outstanding balance of $${outstanding.toFixed(2)}.`);
      return;
    }

    try {
      await paymentService.recordPayment(parseInt(form.invoiceId), {
        paymentReference: form.paymentReference || undefined,
        paymentMethod: form.paymentMethod,
        amount: payAmount,
        notes: form.notes
      });
      setShowModal(false);
      setFeedback(`Payment of $${payAmount.toFixed(2)} recorded successfully.`);
      loadPayments();
    } catch (err) {
      alert(`Payment recording failed: ${err.message}`);
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = !searchTerm ||
      p.paymentReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = methodFilter === 'ALL' || p.paymentMethod === methodFilter;
    return matchesSearch && matchesMethod;
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Payment Management</h1>
          <p className="helper-text">Record payments, manage partial settlements, and monitor outstanding ledger allocations.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenRecordModal}>
          + Record Payment
        </button>
      </div>

      {feedback && (
        <div className="panel-card" style={{ backgroundColor: '#DDEEE6', borderColor: '#94C4B1', color: 'var(--accent-success)', padding: '12px 16px', marginBottom: 16 }}>
          ✓ {feedback}
        </div>
      )}

      {/* KPI Cards */}
      {summary && (
        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="kpi-title">Total Payments Collected</span>
            <span className="kpi-value accent-success">${parseFloat(summary.totalAmountCollected || 0).toFixed(2)}</span>
            <span className="helper-text" style={{ marginTop: 4 }}>Cumulative revenue settled</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-title">Transactions Recorded</span>
            <span className="kpi-value">{summary.totalPaymentsCount}</span>
            <span className="helper-text" style={{ marginTop: 4 }}>Completed payment records</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-title">Ledger Integrity</span>
            <span className="kpi-value accent-highlight">100%</span>
            <span className="helper-text" style={{ marginTop: 4 }}>Overpayment protection active</span>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="panel-card">
        {/* Filters */}
        <div className="filter-row">
          <input
            type="text"
            className="form-input filter-search"
            placeholder="Search by payment reference or invoice #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="form-select"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="ALL">All Payment Methods</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CASH">Cash</option>
            <option value="CHECK">Check</option>
            <option value="ONLINE_GATEWAY">Online Gateway</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <p className="body-text" style={{ textAlign: 'center', padding: 30 }}>Loading payments...</p>
        ) : error ? (
          <p className="body-text" style={{ color: 'var(--accent-primary)', textAlign: 'center', padding: 20 }}>{error}</p>
        ) : filteredPayments.length === 0 ? (
          <p className="body-text text-secondary" style={{ textAlign: 'center', padding: 40 }}>No payment transactions recorded yet.</p>
        ) : (
          <div className="table-container">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Payment Reference</th>
                  <th>Invoice #</th>
                  <th>Method</th>
                  <th>Date & Time</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Balance Left</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map(p => (
                  <tr key={p.id}>
                    <td>
                      <code style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.paymentReference}</code>
                    </td>
                    <td>
                      <button
                        onClick={() => onNavigateToInvoice && onNavigateToInvoice(p.invoiceId)}
                        style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {p.invoiceNumber}
                      </button>
                    </td>
                    <td>{p.paymentMethod.replace('_', ' ')}</td>
                    <td>{new Date(p.paymentDate).toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-success)' }}>
                      ${parseFloat(p.amount).toFixed(2)}
                    </td>
                    <td>
                      {p.outstandingBalanceAfterPayment !== undefined ? (
                        <span style={{ fontWeight: 600, color: parseFloat(p.outstandingBalanceAfterPayment) === 0 ? 'var(--accent-success)' : 'inherit' }}>
                          ${parseFloat(p.outstandingBalanceAfterPayment).toFixed(2)}
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      <span className="badge badge-paid">{p.status}</span>
                    </td>
                    <td className="helper-text">{p.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="section-heading" style={{ margin: 0 }}>Record New Payment</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleRecordPayment}>
              {unpaidInvoices.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center' }}>
                  <p className="body-text text-secondary">There are currently no confirmed invoices with outstanding balances.</p>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Select Invoice *</label>
                    <select
                      className="form-select"
                      required
                      value={form.invoiceId}
                      onChange={(e) => handleInvoiceChange(e.target.value)}
                    >
                      {unpaidInvoices.map(inv => (
                        <option key={inv.id} value={inv.id}>
                          {inv.invoiceNumber} - {inv.customerName} (Bal: ${parseFloat(inv.outstandingBalance).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedInvoice && (
                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span className="body-text">Customer:</span>
                        <span style={{ fontWeight: 600 }}>{selectedInvoice.customerName}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span className="body-text">Total Payable:</span>
                        <span style={{ fontWeight: 600 }}>${parseFloat(selectedInvoice.totalAmount).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="body-text" style={{ fontWeight: 600 }}>Outstanding Balance:</span>
                        <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>${parseFloat(selectedInvoice.outstandingBalance).toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Payment Amount ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={selectedInvoice ? selectedInvoice.outstandingBalance : undefined}
                      className="form-input"
                      required
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    />
                    <span className="helper-text">
                      Supports partial payments. Maximum allowed is current outstanding balance of ${selectedInvoice ? parseFloat(selectedInvoice.outstandingBalance).toFixed(2) : '0.00'}.
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Method *</label>
                    <select
                      className="form-select"
                      value={form.paymentMethod}
                      onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    >
                      <option value="CREDIT_CARD">Credit Card</option>
                      <option value="BANK_TRANSFER">Bank Transfer / Wire</option>
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
                      placeholder="e.g. PAY-2026-0001 (auto-generated if empty)"
                      className="form-input"
                      value={form.paymentReference}
                      onChange={(e) => setForm({ ...form, paymentReference: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea
                      rows="2"
                      placeholder="Audit or reconciliation notes"
                      className="form-textarea"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                  </div>

                  <div style={{ backgroundColor: '#FAF4EB', border: '1px dashed var(--border-color)', padding: 10, borderRadius: 6, marginBottom: 16 }}>
                    <span className="helper-text">
                      ℹ Recording a payment allocates funds against this invoice. It does not initiate actual bank transfers or online payment gateway collections.
                    </span>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Record Payment</button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
