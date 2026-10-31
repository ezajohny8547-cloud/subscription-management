/**
 * Shared API Client for Subscription Management System.
 * Automatically injects JWT Bearer token into Authorization headers,
 * normalizes JSON request/response formats, and centralizes error handling.
 */

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
  ? import.meta.env.VITE_API_BASE_URL
  : 'http://localhost:8080/api';

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...customHeaders
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    let data = null;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { message: text } : {};
    }

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or unauthorized; purge local session
        this.setToken(null);
        localStorage.removeItem('user');
      }

      const errorMessage = data?.message || data?.error || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      error.errors = data?.errors || null;
      throw error;
    }

    return data;
  }

  async get(endpoint, customHeaders = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(customHeaders)
    });
    return this.handleResponse(response);
  }

  async post(endpoint, body = {}, customHeaders = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(customHeaders),
      body: JSON.stringify(body)
    });
    return this.handleResponse(response);
  }

  async put(endpoint, body = {}, customHeaders = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(customHeaders),
      body: JSON.stringify(body)
    });
    return this.handleResponse(response);
  }

  async delete(endpoint, customHeaders = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(customHeaders)
    });
    return this.handleResponse(response);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
