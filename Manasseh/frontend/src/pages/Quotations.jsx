import React, { useState, useEffect } from 'react';
import subscriptionService from '../services/subscriptionService';
import '../styles/design-system.css';

export default function Quotations({ onNavigate }) {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected Quotation for Detailed View Modal
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [convertingId, setConvertingId] = useState(null);

  useEffect(() => {
    loadQuotations();
  }, [search, statusFilter]);

  const loadQuotations = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const data = await subscriptionService.getAllQuotations(params);
      setQuotations(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  const handleViewQuotation = async (id) => {
    try {
      const quote = await subscriptionService.getQuotationById(id);
      setSelectedQuotation(quote);
      setViewModalOpen(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch quotation details');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await subscriptionService.updateQuotationStatus(id, newStatus);
      setSuccessMsg(`Quotation status updated to ${newStatus}.`);
      if (selectedQuotation && selectedQuotation.quotationId === id) {
        setSelectedQuotation({ ...selectedQuotation, status: newStatus });
      }
      loadQuotations();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleConvertToSubscription = async (id) => {
    try {
      setConvertingId(id);
      const newSub = await subscriptionService.convertQuotationToSubscription(id);
      setSuccessMsg(`Quotation converted successfully! Subscription #${newSub.subscriptionNumber} is now CONFIRMED.`);
      setViewModalOpen(false);
      loadQuotations();
      setTimeout(() => setSuccessMsg(''), 5000);
      if (onNavigate) {
        onNavigate('subscriptionDetails', { subscriptionId: newSub.subscriptionId });
      }
    } catch (err) {
      setError(err.message || 'Failed to convert quotation');
    } finally {
      setConvertingId(null);
    }
  };

  const handleDelete = async (id, quoteNumber) => {
    if (!window.confirm(`Delete draft quotation ${quoteNumber}?`)) return;
    try {
      await subscriptionService.deleteQuotation(id);
      setSuccessMsg(`Quotation ${quoteNumber} deleted.`);
      loadQuotations();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete quotation');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT': return <span className="badge badge-draft">Draft</span>;
      case 'SENT': return <span className="badge badge-sent">Sent</span>;
      case 'ACCEPTED': return <span className="badge badge-accepted">Accepted</span>;
      case 'REJECTED': return <span className="badge badge-closed">Rejected</span>;
      case 'EXPIRED': return <span className="badge badge-closed">Expired</span>;
      case 'CONVERTED': return <span className="badge badge-active">Converted to Sub</span>;
      default: return <span className="badge badge-draft">{status}</span>;
    }
  };

  return (
    <div className="module-container">
      {/* Page Title & Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Quotation Management</h1>
          <p className="page-subtitle">Prepare, send, and convert commercial subscription proposals using standardized templates.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => onNavigate && onNavigate('quotationForm')}
        >
          + Create New Quotation
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

      {/* Filter Toolbar */}
      <div className="card-panel" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div className="toolbar-container" style={{ margin: 0 }}>
          <div className="search-input-wrapper">
            <input
              type="text"
              className="form-input"
              placeholder="Search by quote #, customer name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <select
              className="form-select"
              style={{ width: 180 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
              <option value="CONVERTED">Converted</option>
            </select>

            {(search || statusFilter) && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading quotations...
          </div>
        ) : quotations.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: 16, marginBottom: 8 }}>No quotations found.</p>
            <p className="form-helper">Click "+ Create New Quotation" to create a proposal from templates.</p>
          </div>
        ) : (
          <table className="saas-table">
            <thead>
              <tr>
                <th>Quote Number</th>
                <th>Customer Reference</th>
                <th>Plan</th>
                <th>Date & Validity</th>
                <th>Payment Terms</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((quote) => {
                const total = parseFloat(quote.totalAmount || 0);

                return (
                  <tr key={quote.quotationId}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{quote.quotationNumber}</div>
                      <div className="form-helper">{quote.lines?.length || 0} line item(s)</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{quote.customerName}</div>
                      <div className="form-helper">{quote.customerEmail}</div>
                    </td>
                    <td>
                      <span className="badge badge-draft">{quote.planName || 'Plan'}</span>
                    </td>
                    <td>
                      <div>Issued: {quote.quotationDate}</div>
                      <div className="form-helper">Valid until: {quote.validUntil}</div>
                    </td>
                    <td>
                      <code>{quote.paymentTerms}</code>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: 15 }}>
                      ${total.toFixed(2)}
                    </td>
                    <td>{getStatusBadge(quote.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleViewQuotation(quote.quotationId)}
                        >
                          View
                        </button>

                        {quote.status === 'ACCEPTED' && (
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={convertingId === quote.quotationId}
                            onClick={() => handleConvertToSubscription(quote.quotationId)}
                            title="Convert accepted quote directly into confirmed subscription"
                          >
                            {convertingId === quote.quotationId ? 'Converting...' : 'Convert to Sub'}
                          </button>
                        )}

                        {quote.status === 'DRAFT' && (
                          <>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => onNavigate && onNavigate('quotationForm', { quotationId: quote.quotationId })}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => handleUpdateStatus(quote.quotationId, 'SENT')}
                            >
                              Mark Sent
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ backgroundColor: 'rgba(110,42,58,0.1)', color: 'var(--accent-primary)', border: 'none' }}
                              onClick={() => handleDelete(quote.quotationId, quote.quotationNumber)}
                            >
                              Delete
                            </button>
                          </>
                        )}

                        {quote.status === 'SENT' && (
                          <>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleUpdateStatus(quote.quotationId, 'ACCEPTED')}
                            >
                              Accept
                            </button>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => handleUpdateStatus(quote.quotationId, 'REJECTED')}
                            >
                              Reject
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

      {/* Detailed Quotation Modal */}
      {viewModalOpen && selectedQuotation && (
        <div className="modal-backdrop" onClick={() => setViewModalOpen(false)}>
          <div className="modal-dialog" style={{ maxWidth: 750 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Quotation {selectedQuotation.quotationNumber}</h2>
                <div style={{ marginTop: 4 }}>{getStatusBadge(selectedQuotation.status)}</div>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setViewModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Customer & Plan Banner */}
              <div className="form-row" style={{ marginBottom: 20 }}>
                <div className="card-panel" style={{ margin: 0, padding: 14 }}>
                  <div className="stat-label">Customer Details</div>
                  <div style={{ fontWeight: 600 }}>{selectedQuotation.customerName}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{selectedQuotation.customerEmail}</div>
                  <div className="form-helper">Reference ID: #{selectedQuotation.customerId}</div>
                </div>

                <div className="card-panel" style={{ margin: 0, padding: 14 }}>
                  <div className="stat-label">Plan & Terms</div>
                  <div style={{ fontWeight: 600 }}>{selectedQuotation.planName}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Payment Terms: {selectedQuotation.paymentTerms}</div>
                  <div className="form-helper">Valid: {selectedQuotation.quotationDate} to {selectedQuotation.validUntil}</div>
                </div>
              </div>

              {/* Line Items Table */}
              <h3 className="card-heading">Itemized Product Lines</h3>
              <div className="table-container" style={{ marginBottom: 20 }}>
                <table className="saas-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Variant</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Tax</th>
                      <th style={{ textAlign: 'right' }}>Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedQuotation.lines?.map((line) => (
                      <tr key={line.lineId}>
                        <td style={{ fontWeight: 600 }}>{line.productName}</td>
                        <td>{line.variantName || 'Standard'}</td>
                        <td>{line.quantity}</td>
                        <td>${parseFloat(line.unitPrice || 0).toFixed(2)}</td>
                        <td>{parseFloat(line.taxRate || 0)}% (${parseFloat(line.taxAmount || 0).toFixed(2)})</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          ${parseFloat(line.lineTotal || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: 260, background: 'var(--bg-secondary)', padding: 16, borderRadius: 'var(--radius-button)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="form-label">Subtotal:</span>
                    <span>${parseFloat(selectedQuotation.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="form-label">Tax Total:</span>
                    <span>${parseFloat(selectedQuotation.taxAmount || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: 6, fontWeight: 700, fontSize: 16 }}>
                    <span>Total Amount:</span>
                    <span style={{ color: 'var(--accent-primary)' }}>${parseFloat(selectedQuotation.totalAmount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {selectedQuotation.notes && (
                <div style={{ marginTop: 20 }}>
                  <span className="form-label">Quotation Notes</span>
                  <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-button)', fontSize: 13 }}>
                    {selectedQuotation.notes}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setViewModalOpen(false)}
              >
                Close
              </button>

              {selectedQuotation.status === 'ACCEPTED' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={convertingId === selectedQuotation.quotationId}
                  onClick={() => handleConvertToSubscription(selectedQuotation.quotationId)}
                >
                  {convertingId === selectedQuotation.quotationId ? 'Converting...' : 'Convert to Active Subscription'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
