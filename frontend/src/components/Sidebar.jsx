import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Shared Sidebar Component
 * Unifies Module 1, 2, 3, and 4 into ONE coordinated navigation hierarchy
 */
export const Sidebar = ({ isOpen, onClose }) => {
  const { user, isCustomer, isAdmin, isManager } = useAuth();
  const location = useLocation();

  const navItemStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: isActive ? '600' : '500',
    color: isActive ? '#FFFFFF' : 'var(--color-primary-text)',
    backgroundColor: isActive ? 'var(--color-primary-accent)' : 'transparent',
    transition: 'all 0.15s ease',
    textDecoration: 'none',
    marginBottom: '4px',
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(59, 42, 30, 0.4)',
            zIndex: 90,
            display: 'block',
          }}
        />
      )}

      <aside
        style={{
          width: 'var(--sidebar-width)',
          backgroundColor: 'var(--color-secondary-bg)',
          borderRight: '1px solid var(--color-borders)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          transform: isOpen ? 'translateX(0)' : undefined,
          transition: 'transform 0.25s ease',
        }}
      >
        {/* Brand / Logo */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--color-borders)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-primary-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '18px',
            }}
          >
            S
          </div>
          <div>
            <h1
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--color-primary-text)',
                lineHeight: 1.1,
              }}
            >
              SubHub Manager
            </h1>
            <span className="helper-text" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
              Integrated Suite
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
          {/* Module 4: Executive Dashboard & Customer Portal */}
          <div style={{ marginBottom: '20px' }}>
            <span
              className="helper-text"
              style={{
                padding: '0 12px',
                marginBottom: '8px',
                display: 'block',
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                fontSize: '11px',
              }}
            >
              Module 4 : Portal & Insights
            </span>

            {!isCustomer && (
              <>
                <NavLink to="/dashboard" style={navItemStyle} onClick={onClose}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="9" />
                    <rect x="14" y="3" width="7" height="5" />
                    <rect x="14" y="12" width="7" height="9" />
                    <rect x="3" y="16" width="7" height="5" />
                  </svg>
                  <span>Dashboard</span>
                </NavLink>

                <NavLink to="/reports" style={navItemStyle} onClick={onClose}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span>Reports & Analytics</span>
                </NavLink>
              </>
            )}

            <NavLink to="/portal" style={navItemStyle} onClick={onClose}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Customer Portal</span>
            </NavLink>
          </div>

          {/* Module 1 Integration: Auth & User Management */}
          {!isCustomer && (
            <div style={{ marginBottom: '20px' }}>
              <span
                className="helper-text"
                style={{
                  padding: '0 12px',
                  marginBottom: '8px',
                  display: 'block',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  fontSize: '11px',
                }}
              >
                Module 1 : Authentication
              </span>

              <NavLink to="/users" style={navItemStyle} onClick={onClose}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Users & Roles</span>
              </NavLink>
            </div>
          )}

          {/* Module 2 Integration: Products, Plans & Subscriptions */}
          {!isCustomer && (
            <div style={{ marginBottom: '20px' }}>
              <span
                className="helper-text"
                style={{
                  padding: '0 12px',
                  marginBottom: '8px',
                  display: 'block',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  fontSize: '11px',
                }}
              >
                Module 2 : Products & Plans
              </span>

              <NavLink to="/plans" style={navItemStyle} onClick={onClose}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
                <span>Plans Catalog</span>
              </NavLink>

              <NavLink to="/subscriptions" style={navItemStyle} onClick={onClose}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <span>Subscriptions</span>
              </NavLink>
            </div>
          )}

          {/* Module 3 Integration: Billing, Invoices & Payments */}
          {!isCustomer && (
            <div style={{ marginBottom: '20px' }}>
              <span
                className="helper-text"
                style={{
                  padding: '0 12px',
                  marginBottom: '8px',
                  display: 'block',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  fontSize: '11px',
                }}
              >
                Module 3 : Billing & Payments
              </span>

              <NavLink to="/invoices" style={navItemStyle} onClick={onClose}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <line x1="6" y1="8" x2="18" y2="8" />
                  <line x1="6" y1="12" x2="14" y2="12" />
                </svg>
                <span>Invoices</span>
              </NavLink>

              <NavLink to="/payments" style={navItemStyle} onClick={onClose}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                <span>Payments & Discounts</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* User Card at bottom of sidebar */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--color-borders)',
            backgroundColor: 'rgba(234, 217, 195, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-accent)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--color-primary-text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.name || 'Guest User'}
            </p>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--color-primary-accent)',
                textTransform: 'uppercase',
              }}
            >
              {user?.role || 'ANONYMOUS'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
