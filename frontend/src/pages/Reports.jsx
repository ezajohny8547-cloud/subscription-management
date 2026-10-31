import React, { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboardService';
import { DataTable } from '../components/DataTable';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { Badge } from '../components/Badge';

export const Reports = () => {
  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('');
  const [planId, setPlanId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sortBy, setSortBy] = useState('issueDate');
  const [sortDirection, setSortDirection] = useState('desc');

  // Data States
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getReports({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        subscriptionStatus: subscriptionStatus || undefined,
        invoiceStatus: invoiceStatus || undefined,
        planId: planId || undefined,
        search: search || undefined,
        page,
        size,
        sortBy,
        sortDirection,
      });
      setReportData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch reporting records.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, subscriptionStatus, invoiceStatus, planId, search, page, size, sortBy, sortDirection]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSubscriptionStatus('');
    setInvoiceStatus('');
    setPlanId('');
    setSearch('');
    setPage(0);
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      await dashboardService.exportReportsCsv({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        subscriptionStatus: subscriptionStatus || undefined,
        invoiceStatus: invoiceStatus || undefined,
        planId: planId || undefined,
        search: search || undefined,
      });
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val || 0));
  };

  const columns = [
    {
      header: 'Invoice #',
      accessor: 'invoiceNumber',
      sortable: true,
      render: (row) => <strong style={{ color: 'var(--color-primary-accent)' }}>{row.invoiceNumber}</strong>,
    },
    {
      header: 'Customer',
      accessor: 'customerName',
      sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.customerName}</div>
          <div className="helper-text">{row.customerEmail}</div>
        </div>
      ),
    },
    {
      header: 'Plan Tier',
      accessor: 'planName',
      render: (row) => <span>{row.planName}</span>,
    },
    {
      header: 'Sub Status',
      accessor: 'subscriptionStatus',
      render: (row) => <Badge status={row.subscriptionStatus} />,
    },
    {
      header: 'Due Date',
      accessor: 'dueDate',
      sortable: true,
    },
    {
      header: 'Invoiced',
      accessor: 'invoicedAmount',
      sortable: true,
      render: (row) => <strong>{formatCurrency(row.invoicedAmount)}</strong>,
    },
    {
      header: 'Paid',
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
      header: 'Invoice Status',
      accessor: 'invoiceStatus',
      render: (row) => <Badge status={row.invoiceStatus} />,
    },
  ];

  const summary = reportData?.summary;
  const pageInfo = reportData?.page;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Financial & Subscription Reports</h2>
          <p className="helper-text" style={{ fontSize: '13px', marginTop: '4px' }}>
            Multi-dimensional reporting with server-side filtering, ledger reconciliation, and data export.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleExportCsv}
            className="btn btn-primary btn-sm"
            disabled={exporting || loading}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchReports} />}

      {/* Filter Controls Panel */}
      <div className="card-panel" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="card-heading" style={{ fontSize: '15px' }}>
            Filter Ledger & Telemetry
          </h3>
          <button onClick={handleResetFilters} className="btn btn-outline btn-sm">
            Reset Filters
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
          }}
        >
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search Keyword</label>
            <input
              type="text"
              placeholder="Search invoice or name..."
              className="form-input"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(0);
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(0);
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Subscription Status</label>
            <select
              className="form-select"
              value={subscriptionStatus}
              onChange={(e) => {
                setSubscriptionStatus(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="PENDING">PENDING</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="EXPIRED">EXPIRED</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Invoice Status</label>
            <select
              className="form-select"
              value={invoiceStatus}
              onChange={(e) => {
                setInvoiceStatus(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All Invoices</option>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="OVERDUE">OVERDUE</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Plan Tier</label>
            <select
              className="form-select"
              value={planId}
              onChange={(e) => {
                setPlanId(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All Plans</option>
              <option value="1">Starter Tier ($29/mo)</option>
              <option value="2">Professional Tier ($99/mo)</option>
              <option value="3">Enterprise Suite ($299/mo)</option>
              <option value="4">Annual Business ($999/yr)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filtered Summary Totals Bar */}
      {summary && (
        <div
          className="card-panel"
          style={{
            backgroundColor: 'var(--color-card-bg)',
            marginBottom: 'var(--spacing-lg)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            borderLeft: '4px solid var(--color-primary-accent)',
          }}
        >
          <div>
            <span className="helper-text">Filtered Invoiced</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary-text)' }}>
              {formatCurrency(summary.totalInvoiced)}
            </div>
          </div>
          <div>
            <span className="helper-text">Filtered Revenue</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-success)' }}>
              {formatCurrency(summary.totalRevenue)}
            </div>
          </div>
          <div>
            <span className="helper-text">Filtered Outstanding</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-danger)' }}>
              {formatCurrency(summary.totalOutstanding)}
            </div>
          </div>
          <div>
            <span className="helper-text">Invoices Matched</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary-text)' }}>
              {summary.totalInvoices}
            </div>
          </div>
          <div>
            <span className="helper-text">Overdue Count</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-highlight)' }}>
              {summary.overdueInvoices}
            </div>
          </div>
        </div>
      )}

      {/* Paginated Data Table */}
      <div className="card-panel">
        <DataTable
          columns={columns}
          data={pageInfo?.content || []}
          loading={loading}
          emptyMessage="No financial records found matching the active filter criteria."
          onSort={handleSort}
          currentSort={{ field: sortBy, direction: sortDirection }}
          pagination={{
            page: pageInfo?.pageNumber || 0,
            size: pageInfo?.pageSize || 10,
            totalElements: pageInfo?.totalElements || 0,
            totalPages: pageInfo?.totalPages || 0,
            onPageChange: (newPage) => setPage(newPage),
          }}
        />
      </div>
    </div>
  );
};
