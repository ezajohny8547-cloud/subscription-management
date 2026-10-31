import apiClient from './apiClient';

/**
 * Service for Quotations (/api/quotations) and Subscriptions (/api/subscriptions).
 */
export const subscriptionService = {
  // =========================================================================
  // Quotation Management
  // =========================================================================

  /**
   * Search and retrieve quotations.
   * @param {Object} params - { search, status, customerId }
   */
  async getAllQuotations(params = {}) {
    return apiClient.get('/api/quotations', params);
  },

  /**
   * Retrieve single quotation with lines by ID.
   * @param {number|string} id
   */
  async getQuotationById(id) {
    return apiClient.get(`/api/quotations/${id}`);
  },

  /**
   * Create a quotation.
   * @param {Object} quotationData - { customerId, customerName, customerEmail, planId, quotationDate, validUntil, paymentTerms, notes, lines }
   */
  async createQuotation(quotationData) {
    return apiClient.post('/api/quotations', quotationData);
  },

  /**
   * Update an existing quotation.
   * @param {number|string} id
   * @param {Object} quotationData
   */
  async updateQuotation(id, quotationData) {
    return apiClient.put(`/api/quotations/${id}`, quotationData);
  },

  /**
   * Update quotation status (DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED).
   * @param {number|string} id
   * @param {string} status
   */
  async updateQuotationStatus(id, status) {
    return apiClient.patch(`/api/quotations/${id}/status`, null, { status });
  },

  /**
   * Convert an ACCEPTED quotation into an active/confirmed subscription.
   * @param {number|string} id
   */
  async convertQuotationToSubscription(id) {
    return apiClient.post(`/api/quotations/${id}/convert`);
  },

  /**
   * Delete a draft quotation.
   * @param {number|string} id
   */
  async deleteQuotation(id) {
    return apiClient.delete(`/api/quotations/${id}`);
  },

  /**
   * Retrieve reusable quotation templates.
   */
  async getQuotationTemplates() {
    return apiClient.get('/api/quotations/templates');
  },

  /**
   * Create a reusable quotation template.
   * @param {Object} templateData
   */
  async createQuotationTemplate(templateData) {
    return apiClient.post('/api/quotations/templates', templateData);
  },

  // =========================================================================
  // Subscription Lifecycle Management
  // Progression: DRAFT -> QUOTATION -> CONFIRMED -> ACTIVE -> CLOSED (+ PAUSED)
  // =========================================================================

  /**
   * Search and retrieve subscriptions.
   * @param {Object} params - { search, status, customerId, planId }
   */
  async getAllSubscriptions(params = {}) {
    return apiClient.get('/api/subscriptions', params);
  },

  /**
   * Retrieve single subscription with lines and audit history by ID.
   * @param {number|string} id
   */
  async getSubscriptionById(id) {
    return apiClient.get(`/api/subscriptions/${id}`);
  },

  /**
   * Create a subscription manually.
   * @param {Object} subscriptionData
   */
  async createSubscription(subscriptionData) {
    return apiClient.post('/api/subscriptions', subscriptionData);
  },

  /**
   * Transition subscription to a new lifecycle status with validation.
   * @param {number|string} id
   * @param {string} targetStatus - Target lifecycle state
   * @param {string} reason - Optional transition rationale
   * @param {string} changedBy - Optional user name
   */
  async transitionStatus(id, targetStatus, reason = '', changedBy = 'STAFF') {
    return apiClient.post(`/api/subscriptions/${id}/transition`, {
      targetStatus,
      reason,
      changedBy,
    });
  },

  /**
   * Activate an eligible subscription (CONFIRMED -> ACTIVE).
   * @param {number|string} id
   */
  async activateSubscription(id) {
    return apiClient.post(`/api/subscriptions/${id}/activate`);
  },

  /**
   * Pause an ACTIVE subscription.
   * @param {number|string} id
   * @param {string} reason
   */
  async pauseSubscription(id, reason = '') {
    return apiClient.post(`/api/subscriptions/${id}/pause`, { reason });
  },

  /**
   * Resume a PAUSED subscription back to ACTIVE.
   * @param {number|string} id
   */
  async resumeSubscription(id) {
    return apiClient.post(`/api/subscriptions/${id}/resume`);
  },

  /**
   * Renew an ACTIVE subscription (extends expiry, increments cycle, updates next billing date).
   * @param {number|string} id
   */
  async renewSubscription(id) {
    return apiClient.post(`/api/subscriptions/${id}/renew`);
  },

  /**
   * Close a subscription early.
   * @param {number|string} id
   * @param {string} reason
   */
  async closeSubscription(id, reason = '') {
    return apiClient.post(`/api/subscriptions/${id}/close`, { reason });
  },

  /**
   * Trigger automatic closure processing for eligible expired subscriptions.
   */
  async triggerAutoCloseCheck() {
    return apiClient.post('/api/subscriptions/process-auto-close');
  },
};

export default subscriptionService;
