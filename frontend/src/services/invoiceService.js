import apiClient from './apiClient';

export const invoiceService = {
  /**
   * Fetch list of invoices with optional filter
   * @param {Object} params - { status, customerId, subscriptionId }
   */
  async getInvoices(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.customerId) query.append('customerId', params.customerId);
    if (params.subscriptionId) query.append('subscriptionId', params.subscriptionId);
    
    const qs = query.toString();
    return await apiClient.get(`/invoices${qs ? `?${qs}` : ''}`);
  },

  /**
   * Fetch invoice details by ID
   */
  async getInvoiceById(id) {
    return await apiClient.get(`/invoices/${id}`);
  },

  /**
   * Fetch aggregate status and overdue metrics for invoices
   */
  async getInvoiceSummary() {
    return await apiClient.get('/invoices/summary');
  },

  /**
   * Create a new draft invoice
   */
  async createInvoice(invoiceData) {
    return await apiClient.post('/invoices', invoiceData);
  },

  /**
   * Transition invoice status from DRAFT to CONFIRMED
   */
  async confirmInvoice(id) {
    return await apiClient.put(`/invoices/${id}/confirm`, {});
  },

  /**
   * Cancel an invoice (where permitted)
   */
  async cancelInvoice(id, reason = '') {
    return await apiClient.put(`/invoices/${id}/cancel`, { reason });
  },

  /**
   * Mark invoice as sent and dispatch notification
   */
  async sendInvoice(id) {
    return await apiClient.put(`/invoices/${id}/send`, {});
  },

  /**
   * Trigger recurring billing run
   */
  async triggerRecurringBilling(date = null) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return await apiClient.post(`/invoices/billing/trigger-run${query}`, {});
  }
};

export default invoiceService;
