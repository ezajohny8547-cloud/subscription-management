import React, { useState, useEffect } from 'react';
import invoiceService from '../services/invoiceService';
import paymentService from '../services/paymentService';
import '../styles/design-system.css';

export default function InvoiceDetails({ invoiceId, onBack }) {
  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentReference: '',
    paymentMethod: 'CREDIT_CARD',
    amount: '',
    notes: ''
  });

  useEffect(() => {
    if (invoiceId) {
      loadInvoiceData();
    }
  }, [invoiceId]);

  const loadInvoiceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [invData, payList] = await Promise.all([
        invoiceService.getInvoiceById(invoiceId),
        paymentService.getPaymentsByInvoice(invoiceId)
      ]);
      setInvoice(invData);
      setPayments(payList || []);
      setPaymentForm(prev => ({
        ...prev,
        amount: invData.outstandingBalance || '0.00',
        notes: `Payment for ${invData.invoiceNumber}`
      }));
    } catch (err) {
      setError(err.message || 'Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      const updated = await invoiceService.confirmInvoice(invoice.id);
      setInvoice(updated);
      setFeedback('Invoice confirmed successfully.');
    } catch (err) {
      alert(`Confirmation error: ${err.message}`);
    }
  };

  const handleCancel = async () => {
    const reason = prompt('Please enter cancellation reason:');
    if (reason === null) return;
    try {
      const updated = await invoiceService.cancelInvoice(invoice.id, reason);
      setInvoice(updated);
      setFeedback('Invoice cancelled successfully.');
    } catch (err) {
      alert(`Cancellation error: ${err.message}`);
    }
  };

  const handleSend = async () => {
    try {
      const updated = await invoiceService.sendInvoice(invoice.id);
      setInvoice(updated);
      setFeedback('Invoice marked as sent.');
    } catch (err) {
      alert(`Send error: ${err.message}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    try {
      await paymentService.recordPayment(invoice.id, {
        paymentReference: paymentForm.paymentReference || undefined,
        paymentMethod: paymentForm.paymentMethod,
        amount: parseFloat(paymentForm.amount),
        notes: paymentForm.notes
      });
      setShowPaymentModal(false);
      setFeedback('Payment recorded successfully.');
      loadInvoiceData();
    } catch (err) {
      alert(`Payment recording failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <p className="body-text" style={{ textAlign: 'center', padding: 50 }}>Loading invoice details...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="page-container">
        <div className="panel-card" style={{ borderColor: 'var(--accent-primary)' }}>
          <h2 className="section-heading" style={{ color: 'var(--accent-primary)' }}>Error Loading Invoice</h2>
          <p className="body-text">{error || 'Invoice not found'}</p>
          <button className="btn btn-secondary" onClick={onBack}>← Back to Invoices</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Top Action Header (Hidden during print) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back to Invoices
        </button>

        <div style={{ display: 'flex', gap: 10 }}>
          {invoice.status === 'DRAFT' && (
            <>
              <button className="btn btn-success" onClick={handleConfirm}>
                Confirm Invoice
              </button>
              <button className="btn btn-outline" onClick={handleCancel}>
                Cancel Invoice
              </button>
            </>
          )}

          {invoice.status === 'CONFIRMED' && (
            <>
              {parseFloat(invoice.outstandingBalance) > 0 && (
                <button className="btn btn-primary" onClick={() => setShowPaymentModal(true)}>
                  Record Payment
                </button>
              )}
              <button className="btn btn-secondary" onClick={handleSend}>
                {invoice.sentAt ? 'Resend Invoice' : 'Send Invoice'}
              </button>
              {parseFloat(invoice.amountPaid) === 0 && (
                <button className="btn btn-outline" onClick={handleCancel}>
                  Cancel Invoice
                </button>
              )}
            </>
          )}

          <button className="btn btn-secondary" onClick={handlePrint}>
            🖨 Print / Export
          </button>
        </div>
      </div>

      {feedback && (
        <div className="panel-card no-print" style={{ backgroundColor: '#DDEEE6', borderColor: '#94C4B1', color: 'var(--accent-success)', padding: '12px 16px', marginBottom: 16 }}>
          ✓ {feedback}
        </div>
      )}

      {/* Printable Invoice Panel */}
      <div className="panel-card" style={{ padding: '36px 40px' }}>
        {/* Document Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border-color)', paddingBottom: 24, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-primary)', letterSpacing: -0.5 }}>
              INVOICE
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
              {invoice.invoiceNumber}
            </div>
            {invoice.subscriptionNumber && (
              <div className="helper-text" style={{ marginTop: 4 }}>
                Subscription: <strong>{invoice.subscriptionNumber}</strong>
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: 8 }}>
              {invoice.overdue ? (
                <span className="badge badge-overdue" style={{ fontSize: 14, padding: '6px 14px' }}>OVERDUE</span>
              ) : (
                <span className={`badge badge-${invoice.status.toLowerCase().replace('_', '-')}`} style={{ fontSize: 14, padding: '6px 14px' }}>
                  {invoice.status}
                </span>
              )}
            </div>
            <div className="helper-text">
              Date: <strong>{invoice.invoiceDate}</strong>
            </div>
            <div className="helper-text" style={{ marginTop: 2 }}>
              Due Date: <strong style={{ color: invoice.overdue ? '#900C27' : 'inherit' }}>{invoice.dueDate}</strong>
            </div>
            {invoice.billingPeriodStart && invoice.billingPeriodEnd && (
              <div className="helper-text" style={{ marginTop: 2 }}>
                Period: {invoice.billingPeriodStart} to {invoice.billingPeriodEnd}
              </div>
            )}
            {invoice.sentAt && (
              <div className="helper-text" style={{ marginTop: 2, color: 'var(--accent-success)' }}>
                Sent: {new Date(invoice.sentAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Customer & Billing Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 28 }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px 20px', borderRadius: 'var(--radius-button)' }}>
            <div className="kpi-title" style={{ marginBottom: 6 }}>Billed To</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{invoice.customerName}</div>
            <div className="body-text text-secondary">{invoice.customerEmail}</div>
            <div className="body-text text-secondary" style={{ marginTop: 4, whiteSpace: 'pre-line' }}>{invoice.billingAddress}</div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '16px 20px', borderRadius: 'var(--radius-button)' }}>
            <div className="kpi-title" style={{ marginBottom: 6 }}>Payment Summary</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span className="body-text">Total Payable:</span>
              <span style={{ fontWeight: 600 }}>${parseFloat(invoice.totalAmount).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span className="body-text">Amount Paid:</span>
              <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>${parseFloat(invoice.amountPaid).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: 6, marginTop: 4 }}>
              <span className="body-text" style={{ fontWeight: 600 }}>Outstanding Balance:</span>
              <span style={{ fontWeight: 700, fontSize: 16, color: parseFloat(invoice.outstandingBalance) > 0 ? 'var(--accent-primary)' : 'var(--accent-success)' }}>
                ${parseFloat(invoice.outstandingBalance).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Product Lines Table */}
        <div className="table-container" style={{ marginBottom: 24 }}>
          <table className="styled-table">
            <thead>
              <tr>
                <th>Item / Description</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Unit Price</th>
                <th style={{ textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines && invoice.lines.map((line) => (
                <tr key={line.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{line.productName}</div>
                    {line.description && <div className="helper-text">{line.description}</div>}
                  </td>
                  <td style={{ textAlign: 'center' }}>{line.quantity}</td>
                  <td style={{ textAlign: 'right' }}>${parseFloat(line.unitPrice).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>${parseFloat(line.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Calculation Totals Block */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
          <div style={{ width: 340 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span className="body-text text-secondary">Subtotal:</span>
              <span className="body-text" style={{ fontWeight: 500 }}>${parseFloat(invoice.subtotal).toFixed(2)}</span>
            </div>

            {parseFloat(invoice.discountAmount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: 'var(--accent-secondary)' }}>
                <span className="body-text">Discount ({invoice.discountCode || 'Applied'}):</span>
                <span className="body-text" style={{ fontWeight: 600 }}>-${parseFloat(invoice.discountAmount).toFixed(2)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span className="body-text text-secondary">
                Tax ({invoice.taxRate}% - {invoice.taxRuleName || 'Standard'}):
              </span>
              <span className="body-text" style={{ fontWeight: 500 }}>${parseFloat(invoice.taxAmount).toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid var(--border-color)', borderBottom: '2px solid var(--border-color)', margin: '8px 0' }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Total Payable:</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-primary)' }}>${parseFloat(invoice.totalAmount).toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span className="body-text text-secondary">Amount Paid:</span>
              <span className="body-text" style={{ color: 'var(--accent-success)', fontWeight: 600 }}>${parseFloat(invoice.amountPaid).toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span className="body-text" style={{ fontWeight: 600 }}>Outstanding Balance:</span>
              <span className="body-text" style={{ fontWeight: 700, color: parseFloat(invoice.outstandingBalance) > 0 ? 'var(--accent-primary)' : 'var(--accent-success)' }}>
                ${parseFloat(invoice.outstandingBalance).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, marginBottom: 28 }}>
            <span className="kpi-title">Notes / Terms:</span>
            <p className="body-text text-secondary" style={{ marginTop: 4, whiteSpace: 'pre-line' }}>{invoice.notes}</p>
          </div>
        )}

        {/* Payment History Table */}
        <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: 20 }}>
          <h3 className="section-heading" style={{ fontSize: 18 }}>Recorded Payments & Allocations</h3>
          {payments.length === 0 ? (
            <p className="helper-text">No payments recorded against this invoice yet.</p>
          ) : (
            <div className="table-container">
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>Payment Reference</th>
                    <th>Payment Date</th>
                    <th>Method</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.paymentReference}</strong></td>
                      <td>{new Date(p.paymentDate).toLocaleString()}</td>
                      <td>{p.paymentMethod}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-success)' }}>
                        ${parseFloat(p.amount).toFixed(2)}
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
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="section-heading" style={{ margin: 0 }}>Record Payment for {invoice.invoiceNumber}</h2>
              <button onClick={() => setShowPaymentModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSubmitPayment}>
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="body-text">Total Payable:</span>
                  <span style={{ fontWeight: 600 }}>${parseFloat(invoice.totalAmount).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="body-text" style={{ fontWeight: 600 }}>Outstanding Balance:</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>${parseFloat(invoice.outstandingBalance).toFixed(2)}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={invoice.outstandingBalance}
                  className="form-input"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                />
                <span className="helper-text">Max allowable: ${parseFloat(invoice.outstandingBalance).toFixed(2)}. Overpayments are prohibited.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method *</label>
                <select
                  className="form-select"
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                >
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CHECK">Check</option>
                  <option value="ONLINE_GATEWAY">Online Gateway</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Reference</label>
                <input
                  type="text"
                  placeholder="Auto-generated if left empty"
                  className="form-input"
                  value={paymentForm.paymentReference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentReference: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  rows="2"
                  className="form-textarea"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save & Apply Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
