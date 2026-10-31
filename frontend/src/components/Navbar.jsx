import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Shared Navbar Component
 * Features user profile details, role indicators, rapid persona switching for evaluation, and logout
 */
export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, switchPersona } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      style={{
        height: 'var(--navbar-height)',
        backgroundColor: 'var(--color-card-bg)',
        borderBottom: '1px solid var(--color-borders)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Mobile menu toggle */}
        <button
          onClick={onToggleSidebar}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', padding: '8px' }}
          aria-label="Toggle Navigation"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div>
          <span className="helper-text" style={{ fontSize: '12px' }}>
            Subscription Management Platform
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-success)',
              }}
            />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary-text)' }}>
              System Online
            </span>
          </div>
        </div>
      </div>

      {/* Right Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Role Persona Switcher (Convenient for Reviewers & Integrators) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--color-secondary-bg)',
            borderRadius: '8px',
            padding: '3px',
            border: '1px solid var(--color-borders)',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 600, padding: '0 8px', color: 'var(--color-secondary-text)' }}>
            Switch Persona:
          </span>
          <button
            onClick={() => switchPersona('ADMIN')}
            className="btn btn-sm"
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              backgroundColor: user?.role === 'ADMIN' ? 'var(--color-primary-accent)' : 'transparent',
              color: user?.role === 'ADMIN' ? '#FFFFFF' : 'var(--color-primary-text)',
            }}
          >
            Admin
          </button>
          <button
            onClick={() => switchPersona('MANAGER')}
            className="btn btn-sm"
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              backgroundColor: user?.role === 'MANAGER' ? 'var(--color-primary-accent)' : 'transparent',
              color: user?.role === 'MANAGER' ? '#FFFFFF' : 'var(--color-primary-text)',
            }}
          >
            Manager
          </button>
          <button
            onClick={() => switchPersona('CUSTOMER')}
            className="btn btn-sm"
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              backgroundColor: user?.role === 'CUSTOMER' ? 'var(--color-primary-accent)' : 'transparent',
              color: user?.role === 'CUSTOMER' ? '#FFFFFF' : 'var(--color-primary-text)',
            }}
          >
            Customer
          </button>
        </div>

        {/* User Role Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: 'var(--color-accent-bg)',
              color: 'var(--color-primary-accent)',
              border: '1px solid var(--color-borders)',
            }}
          >
            {user?.role || 'GUEST'}
          </span>

          <button onClick={handleLogout} className="btn btn-outline btn-sm" title="Log out">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
