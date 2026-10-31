import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/auth.css';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const criteria = authService.checkPasswordCriteria(newPassword);

  const validate = () => {
    const newErrors = {};

    if (!token.trim()) {
      newErrors.token = 'A valid reset token is required to reset your password';
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (!criteria.isValid) {
      newErrors.newPassword = 'Password does not meet the mandatory security requirements';
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setGeneralError('');
    setSuccessMessage('');

    try {
      await authService.resetPassword(token.trim(), newPassword);
      setSuccessMessage('Password reset successfully! Redirecting to sign in...');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1800);
    } catch (err) {
      setGeneralError(err.message || 'Failed to reset password. The link may have expired or already been used.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-card-header">
          <span className="brand-badge">Security Update</span>
          <h1 className="auth-page-title">Set New Password</h1>
          <p className="auth-body-text">
            Choose a new, strong password to regain access to your account.
          </p>
        </div>

        {generalError && (
          <div className="auth-alert auth-alert-error" role="alert">
            <span>{generalError}</span>
          </div>
        )}

        {successMessage && (
          <div className="auth-alert auth-alert-success" role="status">
            <span>{successMessage}</span>
          </div>
        )}

        {!tokenFromUrl && (
          <div className="auth-form-group">
            <label className="auth-label" htmlFor="reset-token">
              Reset Token <span className="required">*</span>
            </label>
            <div className="auth-input-wrapper">
              <input
                id="reset-token"
                type="text"
                className={`auth-input ${errors.token ? 'has-error' : ''}`}
                placeholder="Paste the token from your email"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  if (errors.token) setErrors((prev) => ({ ...prev, token: '' }));
                }}
                disabled={isLoading}
              />
            </div>
            {errors.token && <span className="field-error">{errors.token}</span>}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-form-group">
            <label className="auth-label" htmlFor="reset-new-password">
              New Password <span className="required">*</span>
            </label>
            <div className="auth-input-wrapper">
              <input
                id="reset-new-password"
                type={showPassword ? 'text' : 'password'}
                className={`auth-input ${errors.newPassword ? 'has-error' : ''}`}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: '' }));
                  setGeneralError('');
                }}
                disabled={isLoading}
                autoComplete="new-password"
                autoFocus
              />
              <button
                type="button"
                className="auth-input-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.newPassword && <span className="field-error">{errors.newPassword}</span>}

            {/* Criteria Checklist */}
            <div className="password-criteria">
              <div className="password-criteria-title">Password must contain:</div>
              <ul className="password-criteria-list">
                <li className={`criteria-item ${criteria.minLength ? 'met' : ''}`}>
                  <span className="criteria-icon">{criteria.minLength ? '✓' : '○'}</span>
                  <span>More than 8 characters</span>
                </li>
                <li className={`criteria-item ${criteria.hasUpper ? 'met' : ''}`}>
                  <span className="criteria-icon">{criteria.hasUpper ? '✓' : '○'}</span>
                  <span>Uppercase letter (A-Z)</span>
                </li>
                <li className={`criteria-item ${criteria.hasLower ? 'met' : ''}`}>
                  <span className="criteria-icon">{criteria.hasLower ? '✓' : '○'}</span>
                  <span>Lowercase letter (a-z)</span>
                </li>
                <li className={`criteria-item ${criteria.hasSpecial ? 'met' : ''}`}>
                  <span className="criteria-icon">{criteria.hasSpecial ? '✓' : '○'}</span>
                  <span>Special symbol (!@#$...)</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="auth-form-group">
            <label className="auth-label" htmlFor="reset-confirm-password">
              Confirm New Password <span className="required">*</span>
            </label>
            <div className="auth-input-wrapper">
              <input
                id="reset-confirm-password"
                type={showPassword ? 'text' : 'password'}
                className={`auth-input ${errors.confirmPassword ? 'has-error' : ''}`}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }}
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
            {errors.confirmPassword && (
              <span className="field-error">{errors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            className="auth-btn auth-btn-primary auth-btn-block"
            disabled={isLoading || !criteria.isValid}
            style={{ marginTop: '12px' }}
          >
            {isLoading ? 'Updating Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-card-footer">
          Back to{' '}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
