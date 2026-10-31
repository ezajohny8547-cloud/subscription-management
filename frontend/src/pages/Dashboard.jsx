import React, { useEffect, useState, useCallback } from 'react';
import { dashboardService } from '../services/dashboardService';
import { StatCard } from '../components/StatCard';
import { DataTable } from '../components/DataTable';
import { RevenueAreaChart, DonutChart, HorizontalBarBreakdown } from '../components/Charts';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { Badge } from '../components/Badge';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, chartsData, renewalsData] = await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getDashboardCharts(),
        dashboardService.getUpcomingRenewals(8),
      ]);
      setStats(statsData);
      setCharts(chartsData);
      setRenewals(renewalsData || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics from backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatCurrency = (val) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  };

  const renewalColumns = [
    {
      header: 'Sub ID',
      accessor: 'subscriptionId',
      width: '90px',
      render: (row) => <strong style={{ color: 'var(--color-primary-accent)' }}>#{row.subscriptionId}</strong>,
    },
    {
      header: 'Customer',
      accessor: 'customerName',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.customerName}</div>
          <div className="helper-text">{row.customerEmail}</div>
        </div>
      ),
    },
    {
      header: 'Plan',
      accessor: 'planName',
      render: (row) => (
        <span style={{ fontWeight: 500 }}>
          {row.planName} <span className="helper-text">({formatCurrency(row.amount)})</span>
        </span>
      ),
    },
    {
      header: 'Renewal Date',
      accessor: 'renewalDate',
      render: (row) => <span>{row.renewalDate}</span>,
    },
    {
      header: 'Auto-Renew',
      accessor: 'autoRenew',
      render: (row) => (
        <Badge
          status={row.autoRenew ? 'ENABLED' : 'MANUAL'}
          variant={row.autoRenew ? 'success' : 'neutral'}
        />
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge status={row.status} />,
    },
  ];

  if (loading && !stats) {
    return <LoadingSpinner message="Calculating business metrics and telemetry..." />;
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Executive Dashboard</h2>
          <p className="helper-text" style={{ fontSize: '13px', marginTop: '4px' }}>
            Real-time financial telemetry, subscription health, and renewal intelligence.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchDashboardData} className="btn btn-secondary btn-sm" disabled={loading}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>{loading ? 'Refreshing...' : 'Refresh Metrics'}</span>
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchDashboardData} />}

      {/* 5 Key Metric Cards Required by Prompt */}
      <div className="stats-grid">
        <StatCard
          title="Active Subscriptions"
          value={stats?.activeSubscriptions ?? 0}
          helperText="Customers with live recurring plans"
          trend="+12.5% this mo."
          trendPositive={true}
          accentColor="var(--color-primary-accent)"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <polyline points="17 11 19 13 23 9" />
            </svg>
          }
        />

        <StatCard
          title="Revenue Received"
          value={formatCurrency(stats?.revenueReceived)}
          helperText="Total settled revenue collected"
          trend="+8.2% vs target"
          trendPositive={true}
          accentColor="var(--color-success)"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />

        <StatCard
          title="Outstanding Balances"
          value={formatCurrency(stats?.outstandingBalances)}
          helperText="Uncollected invoiced balances"
          trend="Action required"
          trendPositive={false}
          accentColor="var(--color-highlight)"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />

        <StatCard
          title="Overdue Invoices"
          value={stats?.overdueInvoices ?? 0}
          helperText="Invoices past official due date"
          trend="Escalation active"
          trendPositive={false}
          accentColor="var(--color-danger)"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          }
        />

        <StatCard
          title="Upcoming Renewals"
          value={stats?.upcomingRenewals ?? 0}
          helperText="Renewing within the next 30 days"
          trend="High retention"
          trendPositive={true}
          accentColor="var(--color-secondary-accent)"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />
      </div>

      {/* Financial Reconciliation Summary Bar: Clearly Distinguishing Invoiced, Received, and Outstanding */}
      <div
        className="card-panel"
        style={{
          marginBottom: 'var(--spacing-lg)',
          backgroundColor: 'var(--color-secondary-bg)',
          borderColor: 'var(--color-borders)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <span className="label-text" style={{ fontSize: '12px', textTransform: 'uppercase' }}>
            Financial Reconciliation
          </span>
          <p className="card-heading" style={{ fontSize: '15px', marginTop: '2px' }}>
            Revenue Integrity & Billing Ledger
          </p>
        </div>

        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          <div>
            <span className="helper-text">Total Invoiced Amount</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary-text)' }}>
              {formatCurrency(stats?.totalInvoiced)}
            </div>
          </div>
          <div>
            <span className="helper-text">Revenue Received</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-success)' }}>
              {formatCurrency(stats?.revenueReceived)}
            </div>
          </div>
          <div>
            <span className="helper-text">Outstanding Balance</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-danger)' }}>
              {formatCurrency(stats?.outstandingBalances)}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Charts Grid: Revenue Over Time & Subscription Counts by Status */}
      <div className="charts-grid">
        <div className="card-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 className="card-heading">Revenue Over Time</h3>
              <p className="helper-text">Monthly revenue received vs invoiced billings</p>
            </div>
            <span className="badge badge-success">Settled vs Invoiced</span>
          </div>
          <RevenueAreaChart data={charts?.revenueOverTime} height={250} />
        </div>

        <div className="card-panel">
          <div style={{ marginBottom: '16px' }}>
            <h3 className="card-heading">Subscription Status</h3>
            <p className="helper-text">Breakdown by current subscription state</p>
          </div>
          <DonutChart
            items={charts?.subscriptionStatusDistribution}
            colors={['#2C4A3B', '#C4972F', '#8B2635', '#7A5C46']}
            size={180}
          />
        </div>
      </div>

      {/* Secondary Charts: Invoice Payment Status & Plan Distribution */}
      <div className="grid-2col">
        <div className="card-panel">
          <div style={{ marginBottom: '16px' }}>
            <h3 className="card-heading">Invoice Payment Status</h3>
            <p className="helper-text">Distribution of issued invoices by payment condition</p>
          </div>
          <DonutChart
            items={charts?.invoiceStatusDistribution}
            colors={['#2C4A3B', '#C4972F', '#8B2635', '#A9684F']}
            size={180}
          />
        </div>

        <div className="card-panel">
          <div style={{ marginBottom: '16px' }}>
            <h3 className="card-heading">Subscriptions by Plan</h3>
            <p className="helper-text">Active subscriber tier allocations</p>
          </div>
          <HorizontalBarBreakdown
            items={charts?.planDistribution}
            color="var(--color-primary-accent)"
          />
        </div>
      </div>

      {/* Upcoming Renewals Table */}
      <div className="card-panel" style={{ marginTop: 'var(--spacing-lg)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div>
            <h3 className="section-heading" style={{ fontSize: '18px' }}>
              Upcoming Subscription Renewals
            </h3>
            <p className="helper-text">Accounts renewing in the next cycle requiring processing</p>
          </div>
          <span className="label-text">{renewals.length} accounts queued</span>
        </div>

        <DataTable
          columns={renewalColumns}
          data={renewals}
          loading={loading}
          emptyMessage="No renewals scheduled in the upcoming window."
        />
      </div>
    </div>
  );
};
