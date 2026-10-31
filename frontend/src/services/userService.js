import apiClient from './apiClient';

/**
 * Service for User Management and Staff Provisioning (Module 1).
 */
export const userService = {
  /**
   * Fetch all registered users (Requires ADMIN or STAFF role).
   * @returns {Promise<Array>} List of user objects
   */
  async getUsers() {
    const response = await apiClient.get('/users');
    // Handles either direct list or standard ApiResponse wrapping { data: [...] }
    return response?.data || response;
  },

  /**
   * Create a new STAFF account (Restricted to ADMIN role).
   * @param {Object} staffData - { fullName, email, password }
   */
  async createStaff(staffData) {
    return apiClient.post('/users/staff', staffData);
  },

  /**
   * Update a user's account status (Restricted to ADMIN role).
   * @param {number|string} userId
   * @param {string} status - 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
   */
  async updateUserStatus(userId, status) {
    return apiClient.put(`/users/${userId}/status`, { status });
  }
};

export default userService;
