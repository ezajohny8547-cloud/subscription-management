import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/auth.css';

/**
 * Route protection wrapper component for role-based access control.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render when authorized
 * @param {string[]} [props.allowedRoles] - Optional list of permitted roles (e.g., ['ADMIN', 'STAFF'])
 * @param {string} [props.redirectTo] - Destination route when unauthenticated (defaults to '/login')
 */
export const ProtectedRoute = ({
  children,
  allowedRoles = [],
  redirectTo = '/login'
}) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();

  if (!isAuthenticated) {
    // Preserve attempted URL so login can redirect back
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser?.role)) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ maxWidth: '520px', textAlign: 'center' }}>
          <div className="auth-card-header">
            <span className="brand-badge" style={{ backgroundColor: 'rgba(110, 42, 58, 0.15)' }}>
              Access Restricted
            </span>
            <h1 className="auth-page-title" style={{ fontSize: '20px' }}>
              Insufficient Permissions
            </h1>
            <p className="auth-body-text">
              Your account ({currentUser?.email || 'User'}) with role{' '}
              <strong>{currentUser?.role || 'CUSTOMER'}</strong> does not have permission
              to access this resource.
            </p>
          </div>

          <div className="auth-alert auth-alert-info">
            Required role: <strong>{allowedRoles.join(' or ')}</strong>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
            <button
              type="button"
              className="auth-btn auth-btn-secondary"
              onClick={() => window.history.back()}
            >
              Go Back
            </button>
            <button
              type="button"
              className="auth-btn auth-btn-primary"
              onClick={() => {
                authService.logout();
                window.location.href = '/login';
              }}
            >
              Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
