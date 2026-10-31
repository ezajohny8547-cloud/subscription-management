import React, { useState, useEffect } from 'react';
import { api } from '../../api/apiConfig';
import { DataTable } from '../../components/DataTable';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Badge } from '../../components/Badge';

/**
 * Module 2 Integration Mount Point: Products & Plans
 * Contract:
 * - Expected Endpoint: GET /api/plans
 * - Shared Entity: com.subscription.entity.Plan
 */
export const PlansIntegrationPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/plans');
        setPlans(res.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val || 0));

  const columns = [
    {
      header: 'Code',
      accessor: 'code',
      render: (r) => <code style={{ color: 'var(--color-primary-accent)', fontWeight: 600 }}>{r.code}</code>,
    },
    {
      header: 'Plan Name',
      accessor: 'name',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.name}</div>
          <div className="helper-text">{r.description}</div>
        </div>
      ),
    },
    {
      header: 'Price',
      accessor: 'price',
      render: (r) => <strong>{formatCurrency(r.price)}</strong>,
    },
    {
      header: 'Billing Cycle',
      accessor: 'billingCycle',
      render: (r) => <Badge status={r.billingCycle} />,
    },
    {
      header: 'Features',
      accessor: 'features',
      render: (r) => <span style={{ fontSize: '12px' }}>{r.features}</span>,
    },
    {
      header: 'Status',
      accessor: 'active',
      render: (r) => (
        <Badge status={r.active ? 'ACTIVE' : 'INACTIVE'} variant={r.active ? 'success' : 'neutral'} />
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="helper-text" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Module 2 Integration Point
          </span>
          <h2 className="page-title">Products & Plans Catalog</h2>
          <p className="helper-text" style={{ fontSize: '13px', marginTop: '4px' }}>
            Subscription tiers, pricing schedules, and feature provisioning packages.
          </p>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="card-panel">
        <DataTable
          columns={columns}
          data={plans}
          loading={loading}
          emptyMessage="No subscription plans active."
        />
      </div>
    </div>
  );
};
