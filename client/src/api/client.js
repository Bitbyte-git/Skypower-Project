import axios from 'axios';

/**
 * Resolve API Base URL from Vite environment variables:
 * 1. Checks import.meta.env.VITE_API_BASE_URL
 * 2. Falls back to '/api' (handled by Vite dev proxy in vite.config.js)
 * 3. Strips trailing slashes to prevent double slashes in request paths
 */
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
export const API_BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

/**
 * Resolve Request Timeout from Vite environment variables (defaults to 15s)
 */
export const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 15000;

/**
 * Configured Axios instance for ERP API communication
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Request Interceptor: Attach JWT Bearer token to all outgoing requests
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('erp_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor:
 * - Unwraps response.data directly
 * - Handles 401 Unauthorized by clearing session and redirecting to /login
 * - Extracts clean error messages
 */
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('erp_token');
      localStorage.removeItem('erp_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

export default api;
