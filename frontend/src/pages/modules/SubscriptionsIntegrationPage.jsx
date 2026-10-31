import React, { useState, useEffect } from 'react';
import { api } from '../../api/apiConfig';
import { DataTable } from '../../components/DataTable';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Badge } from '../../components/Badge';

/**
 * Module 2 Integration Mount Point: Subscription Management
 * Contract:
 * - Expected Endpoint: GET /api/subscriptions
 * - Shared Entity: com.subscription.entity.Subscription
 */
export const SubscriptionsIntegrationPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const res = await api.get('/subscriptions');
        setSubscriptions(res.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSubscriptions();
  }, []);

  const columns = [
    {
      header: 'Sub #',
      accessor: 'id',
      width: '80px',
      render: (r) => <strong style={{ color: 'var(--color-primary-accent)' }}>#{r.id}</strong>,
    },
    {
      header: 'Customer ID',
      accessor: (r) => r.user?.id || r.userId,
      render: (r) => <span>Customer #{r.user?.id || r.userId}</span>,
    },
    {
      header: 'Plan',
      accessor: (r) => r.plan?.name || 'Assigned Plan',
      render: (r) => <strong>{r.plan?.name || 'Standard Tier'}</strong>,
    },
    {
      header: 'Start Date',
      accessor: 'startDate',
    },
    {
      header: 'End Date',
      accessor: 'endDate',
    },
    {
      header: 'Renewal Date',
      accessor: 'renewalDate',
      render: (r) => <span>{r.renewalDate || '—'}</span>,
    },
    {
      header: 'Auto Renew',
      accessor: 'autoRenew',
      render: (r) => (
        <Badge
          status={r.autoRenew ? 'ENABLED' : 'DISABLED'}
          variant={r.autoRenew ? 'success' : 'neutral'}
        />
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
            Module 2 Integration Point
          </span>
          <h2 className="page-title">Active & Historical Subscriptions</h2>
          <p className="helper-text" style={{ fontSize: '13px', marginTop: '4px' }}>
            Subscriber contracts, life-cycle lifecycle transitions, and auto-renewal parameters.
          </p>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="card-panel">
        <DataTable
          columns={columns}
          data={subscriptions}
          loading={loading}
          emptyMessage="No subscription records registered."
        />
      </div>
    </div>
  );
};
