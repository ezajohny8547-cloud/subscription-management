import React, { useState, useEffect } from 'react';
import { api } from '../../api/apiConfig';
import { DataTable } from '../../components/DataTable';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Badge } from '../../components/Badge';

/**
 * Module 3 Integration Mount Point: Billing & Invoices
 * Contract:
 * - Expected Endpoint: GET /api/invoices
 * - Shared Entity: com.subscription.entity.Invoice
 */
export const InvoicesIntegrationPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await api.get('/invoices');
        setInvoices(res.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val || 0));

  const columns = [
    {
      header: 'Invoice #',
      accessor: 'invoiceNumber',
      render: (r) => <strong style={{ color: 'var(--color-primary-accent)' }}>{r.invoiceNumber}</strong>,
    },
    {
      header: 'Customer ID',
      accessor: (r) => r.user?.id || r.userId,
      render: (r) => <span>Customer #{r.user?.id || r.userId}</span>,
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
      header: 'Total Invoiced',
      accessor: 'totalAmount',
      render: (r) => <strong>{formatCurrency(r.totalAmount)}</strong>,
    },
    {
      header: 'Paid Amount',
      accessor: 'paidAmount',
      render: (r) => (
        <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
          {formatCurrency(r.paidAmount)}
        </span>
      ),
    },
    {
      header: 'Outstanding',
      accessor: 'outstandingAmount',
      render: (r) => (
        <span
          style={{
            color: Number(r.outstandingAmount) > 0 ? 'var(--color-danger)' : 'var(--color-secondary-text)',
            fontWeight: 600,
          }}
        >
          {formatCurrency(r.outstandingAmount)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (r) => <Badge status={r.status} />,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="helper-text" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Module 3 Integration Point
          </span>
          <h2 className="page-title">Invoices & Billing Statements</h2>
          <p className="helper-text" style={{ fontSize: '13px', marginTop: '4px' }}>
            Generated invoices, payment schedules, and account receivables.
          </p>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="card-panel">
        <DataTable
          columns={columns}
          data={invoices}
          loading={loading}
          emptyMessage="No invoices generated in billing database."
        />
      </div>
    </div>
  );
};
