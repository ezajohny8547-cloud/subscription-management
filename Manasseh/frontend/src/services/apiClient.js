/**
 * Shared API Client for Subscription Management System.
 * Standardizes HTTP communication, headers, query serialization, and error parsing.
 */

const BASE_URL = (typeof process !== 'undefined' && process.env?.VITE_API_BASE_URL)
  || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL)
  || 'http://localhost:8080';

class ApiClient {
  constructor(baseUrl = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const { method = 'GET', data, params, headers = {} } = options;

    let url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val !== '') {
          queryParams.append(key, val);
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers,
      },
    };

    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      const isJson = response.headers.get('content-type')?.includes('application/json');
      const payload = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        const errorMsg = (isJson && payload?.message) 
          || (isJson && payload?.data && typeof payload.data === 'object' ? JSON.stringify(payload.data) : null)
          || (typeof payload === 'string' ? payload : 'Request failed with status ' + response.status);
        const error = new Error(errorMsg);
        error.status = response.status;
        error.response = payload;
        throw error;
      }

      // Return payload data if wrapped in standard ApiResponse envelope
      if (payload && typeof payload === 'object' && 'data' in payload) {
        return payload.data;
      }

      return payload;
    } catch (err) {
      console.error(`[API Error] ${method} ${endpoint}:`, err.message);
      throw err;
    }
  }

  get(endpoint, params = {}) {
    return this.request(endpoint, { method: 'GET', params });
  }

  post(endpoint, data = {}, params = {}) {
    return this.request(endpoint, { method: 'POST', data, params });
  }

  put(endpoint, data = {}, params = {}) {
    return this.request(endpoint, { method: 'PUT', data, params });
  }

  patch(endpoint, data = {}, params = {}) {
    return this.request(endpoint, { method: 'PATCH', data, params });
  }

  delete(endpoint, params = {}) {
    return this.request(endpoint, { method: 'DELETE', params });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
