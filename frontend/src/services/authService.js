import apiClient from './apiClient';

/**
 * Service for Authentication and Session Management (Module 1).
 */
export const authService = {
  /**
   * Log in user using credentials.
   * On success, persists token and user metadata in localStorage.
   */
  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password });
    const payload = response?.data || response;
    const token = payload?.token;
    if (token) {
      apiClient.setToken(token);
      const userData = {
        id: payload.id || payload.userId,
        userId: payload.id || payload.userId,
        email: payload.email,
        fullName: payload.name || payload.fullName,
        name: payload.name || payload.fullName,
        role: payload.role
      };
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('sms_user', JSON.stringify(userData));
    }
    return payload;
  },

  /**
   * Register a new customer account.
   */
  async register(fullName, email, password) {
    return apiClient.post('/auth/register', {
      fullName,
      email,
      password
    });
  },

  /**
   * Log out current user, notify backend and purge client session.
   */
  async logout() {
    try {
      await apiClient.post('/auth/logout', {});
    } catch (err) {
      console.warn('Backend logout notification warning:', err.message);
    } finally {
      apiClient.setToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('sms_user');
    }
  },

  /**
   * Request password reset token via email.
   */
  async forgotPassword(email) {
    return apiClient.post('/auth/forgot-password', { email });
  },

  /**
   * Reset password using a valid reset token.
   */
  async resetPassword(token, newPassword) {
    return apiClient.post('/auth/reset-password', {
      token,
      newPassword
    });
  },

  /**
   * Returns current user object from storage, or null if unauthenticated.
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('user') || localStorage.getItem('sms_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Returns JWT token from storage.
   */
  getToken() {
    return apiClient.getToken();
  },

  /**
   * Checks whether an active authentication session exists.
   */
  isAuthenticated() {
    return !!this.getToken();
  },

  /**
   * Validates if current user has one of the allowed roles.
   * @param {string|string[]} allowedRoles - Role or array of allowed roles
   */
  hasRole(allowedRoles) {
    const user = this.getCurrentUser();
    if (!user || !user.role) return false;
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return roles.includes(user.role);
  },

  /**
   * Password policy validator.
   * Must contain > 8 characters, an uppercase letter, a lowercase letter, and a special character.
   */
  checkPasswordCriteria(password = '') {
    return {
      minLength: password.length > 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasSpecial: /[^a-zA-Z0-9]/.test(password),
      isValid: password.length > 8 &&
               /[A-Z]/.test(password) &&
               /[a-z]/.test(password) &&
               /[^a-zA-Z0-9]/.test(password)
    };
  }
};

export default authService;
