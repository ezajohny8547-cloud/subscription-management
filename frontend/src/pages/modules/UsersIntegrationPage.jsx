import React, { useState, useEffect } from 'react';
import { api } from '../../api/apiConfig';
import { DataTable } from '../../components/DataTable';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Badge } from '../../components/Badge';

/**
 * Module 1 Integration Mount Point: Authentication & User Management
 * Contract:
 * - Expected Endpoint: GET /api/users
 * - Role: ADMIN, MANAGER
 */
export const UsersIntegrationPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        setUsers(res.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const columns = [
    {
      header: 'User ID',
      accessor: 'id',
      width: '80px',
      render: (r) => <strong>#{r.id}</strong>,
    },
    {
      header: 'Full Name',
      accessor: 'name',
      render: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span>,
    },
    {
      header: 'Email Address',
      accessor: 'email',
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (r) => <Badge status={r.role} />,
    },
    {
      header: 'Phone',
      accessor: 'phone',
      render: (r) => <span>{r.phone || '—'}</span>,
    },
    {
      header: 'Status',
      accessor: 'active',
      render: (r) => (
        <Badge
          status={r.active ? 'ACTIVE' : 'INACTIVE'}
          variant={r.active ? 'success' : 'neutral'}
        />
      ),
    },
    {
      header: 'Created On',
      accessor: 'createdAt',
      render: (r) => <span>{r.createdAt?.slice(0, 10) || '—'}</span>,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="helper-text" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Module 1 Integration Point
          </span>
          <h2 className="page-title">Users & Role Access Management</h2>
          <p className="helper-text" style={{ fontSize: '13px', marginTop: '4px' }}>
            Coordinated authentication directory and authorization scopes.
          </p>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="card-panel">
        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          emptyMessage="No users registered in system."
        />
      </div>
    </div>
  );
};
