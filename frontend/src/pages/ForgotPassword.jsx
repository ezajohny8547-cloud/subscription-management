import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/auth.css';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setGeneralError('');

    if (!email.trim()) {
      setError('Email address is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please provide a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      await authService.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err) {
      setGeneralError(err.message || 'Unable to process reset request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-card-header">
          <span className="brand-badge">Account Recovery</span>
          <h1 className="auth-page-title">Reset Password</h1>
          <p className="auth-body-text">
            Enter your email address and we will send you a secure link to reset your password.
          </p>
        </div>

        {generalError && (
          <div className="auth-alert auth-alert-error" role="alert">
            <span>{generalError}</span>
          </div>
        )}

        {submitted ? (
          <div>
            <div className="auth-alert auth-alert-success" role="status">
              <div>
                <strong>Check your inbox</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                  If an account exists for <strong>{email}</strong>, a secure, time-limited
                  password reset link has been dispatched. The link expires in 15 minutes.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <Link to="/login" className="auth-btn auth-btn-secondary auth-btn-block">
                Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="forgot-email">
                Registered Email <span className="required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="forgot-email"
                  type="email"
                  className={`auth-input ${error ? 'has-error' : ''}`}
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                    setGeneralError('');
                  }}
                  disabled={isLoading}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {error && <span className="field-error">{error}</span>}
            </div>

            <button
              type="submit"
              className="auth-btn auth-btn-primary auth-btn-block"
              disabled={isLoading}
            >
              {isLoading ? 'Sending Link...' : 'Send Reset Link'}
            </button>

            <div className="auth-card-footer">
              Remember your password?{' '}
              <Link to="/login" className="auth-link">
                Sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
