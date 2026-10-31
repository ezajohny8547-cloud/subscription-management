import apiClient from './apiClient';

export const paymentService = {
  /**
   * Record a payment against a confirmed invoice
   */
  async recordPayment(invoiceId, paymentData) {
    return await apiClient.post(`/invoices/${invoiceId}/payments`, paymentData);
  },

  /**
   * Fetch all payments recorded for a specific invoice
   */
  async getPaymentsByInvoice(invoiceId) {
    return await apiClient.get(`/invoices/${invoiceId}/payments`);
  },

  /**
   * Fetch all payments across the system
   */
  async getAllPayments() {
    return await apiClient.get('/payments');
  },

  /**
   * Fetch aggregate payment metrics
   */
  async getPaymentSummary() {
    return await apiClient.get('/payments/summary');
  }
};

export default paymentService;
