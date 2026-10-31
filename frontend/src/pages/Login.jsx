import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ErrorMessage } from '../components/ErrorMessage';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      const savedUser = JSON.parse(localStorage.getItem('sms_user') || '{}');
      if (savedUser.role === 'CUSTOMER') {
        navigate('/portal');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.message);
    }
  };

  const handleQuickLogin = async (presetEmail, presetPass) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setLoading(true);
    setError(null);
    const result = await login(presetEmail, presetPass);
    setLoading(false);

    if (result.success) {
      const savedUser = JSON.parse(localStorage.getItem('sms_user') || '{}');
      if (savedUser.role === 'CUSTOMER') {
        navigate('/portal');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.message);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-main-bg)',
        padding: '24px',
      }}
    >
      <div
        className="card-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          boxShadow: 'var(--shadow-lg)',
          borderTop: '5px solid var(--color-primary-accent)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-primary-accent)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '24px',
              marginBottom: '12px',
            }}
          >
            S
          </div>
          <h2 className="page-title" style={{ fontSize: '22px' }}>
            Subscription Management
          </h2>
          <p className="helper-text" style={{ fontSize: '13px', marginTop: '4px' }}>
            Unified Enterprise Portal & Dashboard
          </p>
        </div>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleLoginSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Password</label>
              <Link to="/forgot-password" className="helper-text" style={{ color: 'var(--color-primary-accent)', fontWeight: 600 }}>
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--color-secondary-text)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--color-primary-accent)', fontWeight: 600 }}>
              Create Account
            </Link>
          </div>
        </form>

        {/* Quick Demo Personas */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid var(--color-borders)',
          }}
        >
          <span
            className="helper-text"
            style={{
              display: 'block',
              textAlign: 'center',
              marginBottom: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Instant Test Personas
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@subscription.com', 'Admin@12345')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between', width: '100%' }}
            >
              <span>👑 Administrator</span>
              <span className="helper-text">admin@subscription.com</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('manager@subscription.com', 'Password@123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between', width: '100%' }}
            >
              <span>💼 Operations Manager</span>
              <span className="helper-text">manager@subscription.com</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('john.doe@example.com', 'Password@123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between', width: '100%' }}
            >
              <span>👤 Customer (John Doe)</span>
              <span className="helper-text">john.doe@example.com</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('sarah.smith@example.com', 'Password@123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between', width: '100%' }}
            >
              <span>⚠️ Customer (Overdue Balance)</span>
              <span className="helper-text">sarah.smith@example.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
