import React, { useState, useEffect, useMemo } from 'react';
import authService from '../services/authService';
import userService from '../services/userService';
import '../styles/auth.css';

export const UserManagement = () => {
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create Staff Modal State
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    fullName: '',
    email: '',
    password: ''
  });
  const [staffErrors, setStaffErrors] = useState({});
  const [staffSubmitting, setStaffSubmitting] = useState(false);
  const [staffModalError, setStaffModalError] = useState('');

  const staffCriteria = authService.checkPasswordCriteria(staffForm.password);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await userService.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusChange = async (userId, currentStatus) => {
    if (!isAdmin) return;
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await userService.updateUserStatus(userId, newStatus);
      setActionSuccess(`User status updated to ${newStatus}`);
      fetchUsers();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update user status');
    }
  };

  const handleStaffFormChange = (e) => {
    const { name, value } = e.target;
    setStaffForm((prev) => ({ ...prev, [name]: value }));
    if (staffErrors[name]) {
      setStaffErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setStaffModalError('');
  };

  const validateStaffForm = () => {
    const errors = {};
    if (!staffForm.fullName.trim()) errors.fullName = 'Full name is required';
    if (!staffForm.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(staffForm.email.trim())) {
      errors.email = 'Please provide a valid email address';
    }
    if (!staffForm.password) {
      errors.password = 'Password is required';
    } else if (!staffCriteria.isValid) {
      errors.password = 'Password must meet all complexity requirements';
    }
    setStaffErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!validateStaffForm()) return;

    setStaffSubmitting(true);
    setStaffModalError('');

    try {
      await userService.createStaff(staffForm);
      setShowStaffModal(false);
      setStaffForm({ fullName: '', email: '', password: '' });
      setActionSuccess('Staff account successfully created!');
      fetchUsers();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      if (err.errors) setStaffErrors(err.errors);
      setStaffModalError(err.message || 'Failed to create staff member');
    } finally {
      setStaffSubmitting(false);
    }
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchSearch =
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = roleFilter === 'ALL' || user.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || user.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="auth-page-title">User Management</h1>
          <p className="auth-body-text" style={{ margin: 0 }}>
            Manage platform accounts, roles, and security statuses
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {isAdmin && (
            <button
              type="button"
              className="auth-btn auth-btn-primary"
              onClick={() => setShowStaffModal(true)}
            >
              + Create Staff Member
            </button>
          )}

          <button
            type="button"
            className="auth-btn auth-btn-secondary"
            onClick={() => {
              authService.logout();
              window.location.href = '/login';
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="auth-alert auth-alert-error" role="alert">
          <span>{error}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="auth-alert auth-alert-success" role="status">
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Panel */}
      <div className="dashboard-panel">
        <div className="panel-toolbar">
          <div className="search-filter-group">
            <input
              type="text"
              className="auth-input"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
              className="auth-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter by role"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="STAFF">STAFF</option>
              <option value="CUSTOMER">CUSTOMER</option>
            </select>

            <select
              className="auth-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>

          <div className="auth-helper-text">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="user-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Account Status</th>
                <th>Registered On</th>
                {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} style={{ textAlign: 'center', padding: '32px' }}>
                    Loading user records...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} style={{ textAlign: 'center', padding: '32px' }}>
                    No users found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.userId || user.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {user.fullName}
                      </div>
                      <div className="auth-helper-text">{user.email}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${user.role?.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${user.status?.toLowerCase()}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="auth-helper-text">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        {user.role !== 'ADMIN' && (
                          <button
                            type="button"
                            className="auth-btn auth-btn-secondary"
                            style={{ height: '32px', padding: '0 12px', fontSize: '12px' }}
                            onClick={() => handleStatusChange(user.userId || user.id, user.status)}
                          >
                            {user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Staff Modal (Restricted to ADMIN) */}
      {showStaffModal && (
        <div className="modal-backdrop" onClick={() => setShowStaffModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="auth-card-heading" style={{ margin: 0 }}>
                Create New Staff Account
              </h2>
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowStaffModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateStaff} noValidate>
              <div className="modal-body">
                {staffModalError && (
                  <div className="auth-alert auth-alert-error">
                    <span>{staffModalError}</span>
                  </div>
                )}

                <div className="auth-form-group">
                  <label className="auth-label">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    className={`auth-input ${staffErrors.fullName ? 'has-error' : ''}`}
                    placeholder="Staff Member Name"
                    value={staffForm.fullName}
                    onChange={handleStaffFormChange}
                    disabled={staffSubmitting}
                    autoFocus
                  />
                  {staffErrors.fullName && (
                    <span className="field-error">{staffErrors.fullName}</span>
                  )}
                </div>

                <div className="auth-form-group">
                  <label className="auth-label">
                    Staff Email Address <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    className={`auth-input ${staffErrors.email ? 'has-error' : ''}`}
                    placeholder="staff@company.com"
                    value={staffForm.email}
                    onChange={handleStaffFormChange}
                    disabled={staffSubmitting}
                  />
                  {staffErrors.email && (
                    <span className="field-error">{staffErrors.email}</span>
                  )}
                </div>

                <div className="auth-form-group">
                  <label className="auth-label">
                    Temporary Password <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    className={`auth-input ${staffErrors.password ? 'has-error' : ''}`}
                    placeholder="Create secure password"
                    value={staffForm.password}
                    onChange={handleStaffFormChange}
                    disabled={staffSubmitting}
                  />
                  {staffErrors.password && (
                    <span className="field-error">{staffErrors.password}</span>
                  )}

                  <div className="password-criteria" style={{ marginTop: '8px' }}>
                    <div className="password-criteria-title">Password must contain:</div>
                    <ul className="password-criteria-list">
                      <li className={`criteria-item ${staffCriteria.minLength ? 'met' : ''}`}>
                        <span className="criteria-icon">{staffCriteria.minLength ? '✓' : '○'}</span>
                        <span>More than 8 chars</span>
                      </li>
                      <li className={`criteria-item ${staffCriteria.hasUpper ? 'met' : ''}`}>
                        <span className="criteria-icon">{staffCriteria.hasUpper ? '✓' : '○'}</span>
                        <span>Uppercase (A-Z)</span>
                      </li>
                      <li className={`criteria-item ${staffCriteria.hasLower ? 'met' : ''}`}>
                        <span className="criteria-icon">{staffCriteria.hasLower ? '✓' : '○'}</span>
                        <span>Lowercase (a-z)</span>
                      </li>
                      <li className={`criteria-item ${staffCriteria.hasSpecial ? 'met' : ''}`}>
                        <span className="criteria-icon">{staffCriteria.hasSpecial ? '✓' : '○'}</span>
                        <span>Special char</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="auth-btn auth-btn-secondary"
                  onClick={() => setShowStaffModal(false)}
                  disabled={staffSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="auth-btn auth-btn-primary"
                  disabled={staffSubmitting || !staffCriteria.isValid}
                >
                  {staffSubmitting ? 'Creating...' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
