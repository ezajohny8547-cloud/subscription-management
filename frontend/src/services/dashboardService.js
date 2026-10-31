/**
 * Module 4 - Dashboard & Customer Portal Service
 * Connects to /api/dashboard REST Endpoints
 */

import { api } from '../api/apiConfig';

export const dashboardService = {
  /**
   * Fetches high-level executive dashboard statistics:
   * Active Subscriptions, Revenue Received, Outstanding Balances, Overdue Invoices, Upcoming Renewals
   */
  async getDashboardStats() {
    const res = await api.get('/dashboard/stats');
    return res.data;
  },

  /**
   * Fetches charts telemetry:
   * Revenue over time, Subscription status breakdown, Payments received, Invoice payment status, Plan distribution
   */
  async getDashboardCharts() {
    const res = await api.get('/dashboard/charts');
    return res.data;
  },

  /**
   * Fetches upcoming subscription renewals
   */
  async getUpcomingRenewals(limit = 10) {
    const res = await api.get(`/dashboard/renewals?limit=${limit}`);
    return res.data;
  },

  /**
   * Fetches filtered, paginated report data
   */
  async getReports(params = {}) {
    const searchParams = new URLSearchParams();

    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    if (params.subscriptionStatus) searchParams.append('subscriptionStatus', params.subscriptionStatus);
    if (params.invoiceStatus) searchParams.append('invoiceStatus', params.invoiceStatus);
    if (params.planId) searchParams.append('planId', params.planId);
    if (params.customerId) searchParams.append('customerId', params.customerId);
    if (params.search) searchParams.append('search', params.search);
    if (params.page !== undefined) searchParams.append('page', params.page);
    if (params.size !== undefined) searchParams.append('size', params.size);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortDirection) searchParams.append('sortDirection', params.sortDirection);

    const queryString = searchParams.toString();
    const endpoint = `/dashboard/reports${queryString ? `?${queryString}` : ''}`;
    const res = await api.get(endpoint);
    return res.data;
  },

  /**
   * Exports report records to CSV and prompts browser download
   */
  async exportReportsCsv(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    if (params.subscriptionStatus) searchParams.append('subscriptionStatus', params.subscriptionStatus);
    if (params.invoiceStatus) searchParams.append('invoiceStatus', params.invoiceStatus);
    if (params.planId) searchParams.append('planId', params.planId);
    if (params.search) searchParams.append('search', params.search);

    const queryString = searchParams.toString();
    const endpoint = `/dashboard/reports/export${queryString ? `?${queryString}` : ''}`;
    const blob = await api.get(endpoint);

    // Trigger file download in browser
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `subscription-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * CUSTOMER PORTAL APIS
   * Note: The backend strictly verifies that authenticated customer cannot access another customer's ID
   */
  async getCustomerPortalSummary(customerId = null) {
    const endpoint = customerId ? `/dashboard/portal/summary?customerId=${customerId}` : '/dashboard/portal/summary';
    const res = await api.get(endpoint);
    return res.data;
  },

  async getCustomerSubscriptions(customerId = null) {
    const endpoint = customerId ? `/dashboard/portal/subscriptions?customerId=${customerId}` : '/dashboard/portal/subscriptions';
    const res = await api.get(endpoint);
    return res.data;
  },

  async getCustomerInvoices(customerId = null) {
    const endpoint = customerId ? `/dashboard/portal/invoices?customerId=${customerId}` : '/dashboard/portal/invoices';
    const res = await api.get(endpoint);
    return res.data;
  },

  async getCustomerPayments(customerId = null) {
    const endpoint = customerId ? `/dashboard/portal/payments?customerId=${customerId}` : '/dashboard/portal/payments';
    const res = await api.get(endpoint);
    return res.data;
  },
};
