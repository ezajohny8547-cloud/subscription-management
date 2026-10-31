import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dashboardService';
import { DataTable } from '../components/DataTable';
import { StatCard } from '../components/StatCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { Badge } from '../components/Badge';

export const CustomerPortal = () => {
  const { user, isCustomer } = useAuth();

  const [activeTab, setActiveTab] = useState('subscriptions'); // 'subscriptions' | 'invoices' | 'payments'
  const [summary, setSummary] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCustomerData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Note: Backend verifies authentication; customers are bound strictly to their authenticated identity
      const [sumData, subsData, invsData, paysData] = await Promise.all([
        dashboardService.getCustomerPortalSummary(),
        dashboardService.getCustomerSubscriptions(),
        dashboardService.getCustomerInvoices(),
        dashboardService.getCustomerPayments(),
      ]);

      setSummary(sumData);
      setSubscriptions(subsData || []);
      setInvoices(invsData || []);
      setPayments(paysData || []);
    } catch (err) {
      setError(err.message || 'Unable to retrieve customer portal records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val || 0));
  };

  const invoiceColumns = [
    {
      header: 'Invoice #',
      accessor: 'invoiceNumber',
      render: (row) => <strong style={{ color: 'var(--color-primary-accent)' }}>{row.invoiceNumber}</strong>,
    },
    {
      header: 'Associated Plan',
      accessor: 'planName',
    },
    {
      header: 'Issue Date',
      accessor: 'issueDate',
    },
    {
      header: 'Due Date',
      accessor: 'dueDate',
    },
    {
      header: 'Total Amount',
      accessor: 'totalAmount',
      render: (row) => <strong>{formatCurrency(row.totalAmount)}</strong>,
    },
    {
      header: 'Paid Amount',
      accessor: 'paidAmount',
      render: (row) => (
        <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
          {formatCurrency(row.paidAmount)}
        </span>
      ),
    },
    {
      header: 'Balance',
      accessor: 'outstandingAmount',
      render: (row) => (
        <span
          style={{
            color: Number(row.outstandingAmount) > 0 ? 'var(--color-danger)' : 'var(--color-secondary-text)',
            fontWeight: 600,
          }}
        >
          {formatCurrency(row.outstandingAmount)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge status={row.status} />,
    },
    {
      header: 'Receipt',
      accessor: 'actions',
      render: (row) => (
        <button
          onClick={() => alert(`Downloading receipt for invoice ${row.invoiceNumber}...`)}
          className="btn btn-secondary btn-sm"
          style={{ padding: '4px 8px', fontSize: '11px' }}
        >
          Download
        </button>
      ),
    },
  ];

  const paymentColumns = [
    {
      header: 'Reference',
      accessor: 'paymentReference',
      render: (row) => <code>{row.paymentReference}</code>,
    },
    {
      header: 'Invoice',
      accessor: 'invoiceNumber',
      render: (row) => <span>{row.invoiceNumber}</span>,
    },
    {
      header: 'Payment Date',
      accessor: 'paymentDate',
      render: (row) => <span>{row.paymentDate?.slice(0, 10) || '—'}</span>,
    },
    {
      header: 'Amount Paid',
      accessor: 'amount',
      render: (row) => (
        <strong style={{ color: 'var(--color-success)' }}>{formatCurrency(row.amount)}</strong>
      ),
    },
    {
      header: 'Method',
      accessor: 'paymentMethod',
      render: (row) => <span className="label-text">{row.paymentMethod?.replace('_', ' ')}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge status={row.status} />,
    },
    {
      header: 'Notes',
      accessor: 'notes',
      render: (row) => <span className="helper-text">{row.notes || '—'}</span>,
    },
  ];

  if (loading && !summary) {
    return <LoadingSpinner message="Securing and loading your account portal..." />;
  }

  return (
    <div>
      {/* Customer Header */}
      <div className="page-header">
        <div>
          <span className="helper-text" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Customer Self-Service Portal
          </span>
          <h2 className="page-title">Welcome, {summary?.customerName || user?.name}</h2>
          <p className="helper-text" style={{ fontSize: '13px', marginTop: '4px' }}>
            Account ID: #{summary?.customerId || user?.id} | Email: {summary?.customerEmail || user?.email}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchCustomerData} className="btn btn-secondary btn-sm">
            Refresh
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchCustomerData} />}

      {/* Backend Security Assurance Notice */}
      <div
        className="card-panel-compact"
        style={{
          backgroundColor: 'var(--color-secondary-bg)',
          borderRadius: '8px',
          border: '1px solid var(--color-borders)',
          marginBottom: 'var(--spacing-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <div style={{ fontSize: '13px', color: 'var(--color-primary-text)' }}>
          <strong>Secure Data Isolation:</strong> Your portal records are cryptographically bounded to your
          authenticated account token on the backend. Cross-customer data tampering is strictly rejected.
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="stats-grid">
        <StatCard
          title="Active Subscriptions"
          value={summary?.activeSubscriptionsCount ?? 0}
          helperText="Current active service plans"
          accentColor="var(--color-primary-accent)"
        />

        <StatCard
          title="Total Paid"
          value={formatCurrency(summary?.totalPaid)}
          helperText="Lifetime settled payment total"
          accentColor="var(--color-success)"
        />

        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(summary?.totalOutstanding)}
          helperText={
            Number(summary?.totalOutstanding) > 0 ? 'Pending invoice due' : 'Account in good standing'
          }
          accentColor={
            Number(summary?.totalOutstanding) > 0 ? 'var(--color-danger)' : 'var(--color-borders)'
          }
        />

        <StatCard
          title="Next Renewal"
          value={summary?.nextRenewalDate ? summary.nextRenewalDate : 'None Scheduled'}
          helperText={
            summary?.nextRenewalPlan
              ? `${summary.nextRenewalPlan} (${formatCurrency(summary.nextRenewalAmount)})`
              : 'No upcoming renewal'
          }
          accentColor="var(--color-highlight)"
        />
      </div>

      {/* Outstanding Balance Warning Alert if balance > 0 */}
      {Number(summary?.totalOutstanding) > 0 && (
        <div
          className="card-panel"
          style={{
            marginBottom: 'var(--spacing-lg)',
            backgroundColor: 'var(--color-highlight-bg)',
            borderColor: 'var(--color-highlight)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h4 style={{ color: 'var(--color-primary-text)', fontSize: '15px', fontWeight: 600 }}>
              Outstanding Balance Notice
            </h4>
            <p className="body-text" style={{ fontSize: '13px' }}>
              You have an unsettled invoice balance of {formatCurrency(summary.totalOutstanding)}. Please review
              the Invoices tab to avoid service disruption.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('invoices')}
            className="btn btn-primary btn-sm"
          >
            Review Invoices
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid var(--color-borders)',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        <button
          onClick={() => setActiveTab('subscriptions')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'subscriptions' ? '3px solid var(--color-primary-accent)' : '3px solid transparent',
            color: activeTab === 'subscriptions' ? 'var(--color-primary-accent)' : 'var(--color-secondary-text)',
            fontWeight: activeTab === 'subscriptions' ? 700 : 500,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          My Subscriptions ({subscriptions.length})
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'invoices' ? '3px solid var(--color-primary-accent)' : '3px solid transparent',
            color: activeTab === 'invoices' ? 'var(--color-primary-accent)' : 'var(--color-secondary-text)',
            fontWeight: activeTab === 'invoices' ? 700 : 500,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Billing & Invoices ({invoices.length})
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'payments' ? '3px solid var(--color-primary-accent)' : '3px solid transparent',
            color: activeTab === 'payments' ? 'var(--color-primary-accent)' : 'var(--color-secondary-text)',
            fontWeight: activeTab === 'payments' ? 700 : 500,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Payment History ({payments.length})
        </button>
      </div>

      {/* Tab 1: Subscriptions View */}
      {activeTab === 'subscriptions' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {subscriptions.length === 0 ? (
            <div className="card-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
              <p className="body-text" style={{ color: 'var(--color-secondary-text)' }}>
                No active or historical subscriptions found for this account.
              </p>
            </div>
          ) : (
            subscriptions.map((sub) => (
              <div key={sub.id} className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 className="card-heading" style={{ fontSize: '18px' }}>
                      {sub.planName}
                    </h3>
                    <span className="helper-text">{sub.planCode}</span>
                  </div>
                  <Badge status={sub.status} />
                </div>

                <div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary-accent)' }}>
                    {formatCurrency(sub.price)}
                    <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--color-secondary-text)' }}>
                      {' '}/ {sub.billingCycle?.toLowerCase()}
                    </span>
                  </div>
                  <p className="body-text" style={{ fontSize: '13px', marginTop: '6px' }}>
                    {sub.planDescription}
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--color-secondary-bg)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '13px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="helper-text">Start Date:</span>
                    <strong>{sub.startDate}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="helper-text">Expires On:</span>
                    <strong>{sub.endDate}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="helper-text">Renewal Date:</span>
                    <strong>{sub.renewalDate || 'N/A'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="helper-text">Auto Renewal:</span>
                    <Badge
                      status={sub.autoRenew ? 'ACTIVE' : 'MANUAL'}
                      variant={sub.autoRenew ? 'success' : 'neutral'}
                    />
                  </div>
                </div>

                {sub.features && sub.features.length > 0 && (
                  <div>
                    <span className="label-text" style={{ display: 'block', marginBottom: '8px' }}>
                      Included Features:
                    </span>
                    <ul style={{ paddingLeft: '18px', fontSize: '13px', color: 'var(--color-primary-text)' }}>
                      {sub.features.map((feat, fIdx) => (
                        <li key={fIdx} style={{ marginBottom: '4px' }}>
                          {feat.trim()}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Invoices View */}
      {activeTab === 'invoices' && (
        <div className="card-panel">
          <DataTable
            columns={invoiceColumns}
            data={invoices}
            loading={loading}
            emptyMessage="You have no issued invoices."
          />
        </div>
      )}

      {/* Tab 3: Payments View */}
      {activeTab === 'payments' && (
        <div className="card-panel">
          <DataTable
            columns={paymentColumns}
            data={payments}
            loading={loading}
            emptyMessage="No payment records found on file."
          />
        </div>
      )}
    </div>
  );
};
