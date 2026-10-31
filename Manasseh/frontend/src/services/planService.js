import apiClient from './apiClient';

/**
 * Service for Subscription Plan management endpoints (/api/plans).
 */
export const planService = {
  /**
   * Search and retrieve plans.
   * @param {Object} params - { search, interval, status }
   */
  async getAllPlans(params = {}) {
    return apiClient.get('/api/plans', params);
  },

  /**
   * Get plans that are strictly ACTIVE and within current validity dates.
   */
  async getActiveAvailablePlans() {
    return apiClient.get('/api/plans/available');
  },

  /**
   * Retrieve a single plan by ID.
   * @param {number|string} id
   */
  async getPlanById(id) {
    return apiClient.get(`/api/plans/${id}`);
  },

  /**
   * Create a new plan.
   * @param {Object} planData - { planName, planCode, description, price, billingInterval, minimumQuantity, availabilityStartDate, availabilityEndDate, autoClose, autoCloseAfterCycles, status, productIds }
   */
  async createPlan(planData) {
    return apiClient.post('/api/plans', planData);
  },

  /**
   * Update an existing plan.
   * @param {number|string} id
   * @param {Object} planData
   */
  async updatePlan(id, planData) {
    return apiClient.put(`/api/plans/${id}`, planData);
  },

  /**
   * Update plan status (ACTIVE, INACTIVE, ARCHIVED).
   * @param {number|string} id
   * @param {string} status
   */
  async updatePlanStatus(id, status) {
    return apiClient.patch(`/api/plans/${id}/status`, null, { status });
  },

  /**
   * Delete a plan.
   * @param {number|string} id
   */
  async deletePlan(id) {
    return apiClient.delete(`/api/plans/${id}`);
  },
};

export default planService;
