import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/auth.css';

export const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Real-time password criteria evaluation
  const criteria = authService.checkPasswordCriteria(formData.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setGeneralError('');
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!criteria.isValid) {
      newErrors.password = 'Password does not meet the mandatory security requirements';
    }

    if (formData.password !== formData.confirmPassword) {
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
      await authService.register(
        formData.fullName.trim(),
        formData.email.trim(),
        formData.password
      );

      setSuccessMessage('Registration successful! Redirecting to sign in...');
      setTimeout(() => {
        navigate('/login', {
          state: { registeredEmail: formData.email.trim() }
        });
      }, 1500);
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors);
      }
      setGeneralError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-card-header">
          <span className="brand-badge">Get Started</span>
          <h1 className="auth-page-title">Create Account</h1>
          <p className="auth-body-text">Register for subscription services</p>
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

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-form-group">
            <label className="auth-label" htmlFor="register-name">
              Full Name <span className="required">*</span>
            </label>
            <div className="auth-input-wrapper">
              <input
                id="register-name"
                type="text"
                name="fullName"
                className={`auth-input ${errors.fullName ? 'has-error' : ''}`}
                placeholder="Jane Doe"
                value={formData.fullName}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete="name"
                autoFocus
              />
            </div>
            {errors.fullName && <span className="field-error">{errors.fullName}</span>}
          </div>

          <div className="auth-form-group">
            <label className="auth-label" htmlFor="register-email">
              Email Address <span className="required">*</span>
            </label>
            <div className="auth-input-wrapper">
              <input
                id="register-email"
                type="email"
                name="email"
                className={`auth-input ${errors.email ? 'has-error' : ''}`}
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="auth-form-group">
            <label className="auth-label" htmlFor="register-password">
              Password <span className="required">*</span>
            </label>
            <div className="auth-input-wrapper">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                className={`auth-input ${errors.password ? 'has-error' : ''}`}
                placeholder="Create strong password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete="new-password"
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
            {errors.password && <span className="field-error">{errors.password}</span>}

            {/* Visual Password Security Checklist */}
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
            <label className="auth-label" htmlFor="register-confirm-password">
              Confirm Password <span className="required">*</span>
            </label>
            <div className="auth-input-wrapper">
              <input
                id="register-confirm-password"
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                className={`auth-input ${errors.confirmPassword ? 'has-error' : ''}`}
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
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
            {isLoading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="auth-card-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
