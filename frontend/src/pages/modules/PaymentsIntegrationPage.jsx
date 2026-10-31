import React, { useState, useEffect } from 'react';
import { api } from '../../api/apiConfig';
import { DataTable } from '../../components/DataTable';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Badge } from '../../components/Badge';

/**
 * Module 3 Integration Mount Point: Payments & Discounts
 * Contract:
 * - Expected Endpoint: GET /api/payments
 * - Shared Entity: com.subscription.entity.Payment
 */
export const PaymentsIntegrationPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await api.get('/payments');
        setPayments(res.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val || 0));

  const columns = [
    {
      header: 'Payment Reference',
      accessor: 'paymentReference',
      render: (r) => <code style={{ color: 'var(--color-primary-accent)', fontWeight: 600 }}>{r.paymentReference}</code>,
    },
    {
      header: 'Customer ID',
      accessor: (r) => r.user?.id || r.userId,
      render: (r) => <span>Customer #{r.user?.id || r.userId}</span>,
    },
    {
      header: 'Amount Settled',
      accessor: 'amount',
      render: (r) => (
        <strong style={{ color: 'var(--color-success)' }}>{formatCurrency(r.amount)}</strong>
      ),
    },
    {
      header: 'Payment Method',
      accessor: 'paymentMethod',
      render: (r) => <span className="label-text">{r.paymentMethod?.replace('_', ' ')}</span>,
    },
    {
      header: 'Date',
      accessor: 'paymentDate',
      render: (r) => <span>{r.paymentDate?.slice(0, 16).replace('T', ' ') || '—'}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (r) => <Badge status={r.status} />,
    },
    {
      header: 'Notes',
      accessor: 'notes',
      render: (r) => <span className="helper-text">{r.notes || '—'}</span>,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="helper-text" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Module 3 Integration Point
          </span>
          <h2 className="page-title">Settled Payments & Transactions</h2>
          <p className="helper-text" style={{ fontSize: '13px', marginTop: '4px' }}>
            Payment reconciliation, credit card settlements, bank wire records, and discount auditing.
          </p>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="card-panel">
        <DataTable
          columns={columns}
          data={payments}
          loading={loading}
          emptyMessage="No payment records registered."
        />
      </div>
    </div>
  );
};
