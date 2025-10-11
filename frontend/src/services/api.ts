/**
 * API Service Layer - V4.0 EMERGENCY CACHE BUST
 * Handles all backend API calls
 */
import axios from 'axios';

// EMERGENCY: Force immediate cache bust
console.log('🚨 EMERGENCY CACHE BUST v4.1 - FORCE VERCEL DEPLOY');
console.log('🚨 VERIFICATION: This is the latest code - v4.1');

// API Base URL Configuration - ALWAYS HTTPS in production
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:8000/api'
  : 'https://api.digitstec.store/api';

// EMERGENCY DEBUG - V4.0 FORCE DEPLOY
console.log('🚨 EMERGENCY API Configuration (v4.0 - FORCE DEPLOY):', {
  hostname: window.location.hostname,
  isDevelopment,
  apiUrl: API_BASE_URL,
  timestamp: new Date().toISOString(),
  protocol: window.location.protocol,
  buildVersion: '4.0-EMERGENCY-FORCE-DEPLOY',
  emergencyId: 'FORCE-' + Date.now(),
  forceDeploy: true
});

// EMERGENCY: Force immediate HTTPS validation
console.log('🚨 EMERGENCY: Checking API URL:', API_BASE_URL);
console.log('🚨 EMERGENCY: Is HTTPS?', API_BASE_URL.startsWith('https://'));

// Force HTTPS in production - double check
if (!isDevelopment && API_BASE_URL.startsWith('http://')) {
  console.error('🚨 CRITICAL: Using HTTP in production! This should never happen!');
  throw new Error('HTTP detected in production - security violation');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Force HTTPS and prevent caching issues
  timeout: 10000,
  // Force HTTPS protocol
  httpsAgent: undefined,
  // Prevent protocol downgrade
  maxRedirects: 0,
});

// Override axios defaults to force HTTPS
api.defaults.baseURL = API_BASE_URL;
api.defaults.timeout = 10000;

// Add request interceptor to force HTTPS
api.interceptors.request.use((config) => {
  // Force HTTPS in production
  if (config.url && config.url.startsWith('http://api.digitstec.store')) {
    config.url = config.url.replace('http://', 'https://');
    console.log('🔧 FORCED HTTPS:', config.url);
  }
  if (config.baseURL && config.baseURL.startsWith('http://api.digitstec.store')) {
    config.baseURL = config.baseURL.replace('http://', 'https://');
    console.log('🔧 FORCED HTTPS baseURL:', config.baseURL);
  }
  return config;
});

// Add auth token to all requests (second interceptor)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Analytics API
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getWeeklyStats: () => api.get('/analytics/weekly-stats'),
  getMonthlyStats: (year?: number, month?: number) => 
    api.get('/analytics/monthly-stats', { params: { year, month } }),
  getCustomerInsights: () => api.get('/analytics/customer-insights'),
  getRepairStatistics: () => api.get('/analytics/repair-statistics'),
  getSwapAnalytics: () => api.get('/analytics/swap-analytics'),
  getSalesAnalytics: () => api.get('/analytics/sales-analytics'),
  getInventoryReport: () => api.get('/analytics/inventory-report'),
  getProfitLoss: () => api.get('/analytics/profit-loss'),
  getDashboardSummary: () => api.get('/analytics/dashboard-summary'),
};

// Customer API
export const customerAPI = {
  getAll: () => api.get('/customers/'),
  getById: (id: number) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers/', data),
  update: (id: number, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: number) => api.delete(`/customers/${id}`),
};

// Phone API
export const phoneAPI = {
  getAll: (availableOnly?: boolean) => api.get('/phones/', { params: { available_only: availableOnly } }),
  getById: (id: number) => api.get(`/phones/${id}`),
  create: (data: any) => api.post('/phones/', data),
  update: (id: number, data: any) => api.put(`/phones/${id}`, data),
  toggleAvailability: (id: number, isAvailable: boolean) => 
    api.patch(`/phones/${id}/availability`, null, { params: { is_available: isAvailable } }),
  delete: (id: number) => api.delete(`/phones/${id}`),
};

// Sale API
export const saleAPI = {
  getAll: () => api.get('/sales/'),
  getById: (id: number) => api.get(`/sales/${id}`),
  create: (data: any) => api.post('/sales/', data),
  getByCustomer: (customerId: number) => api.get(`/sales/customer/${customerId}`),
};

// Swap API
export const swapAPI = {
  getAll: () => api.get('/swaps/'),
  getById: (id: number) => api.get(`/swaps/${id}`),
  create: (data: any) => api.post('/swaps/', data),
  getByCustomer: (customerId: number) => api.get(`/swaps/customer/${customerId}`),
  getChain: (phoneId: number) => api.get(`/swaps/phone/${phoneId}/chain`),
};

// Repair API
export const repairAPI = {
  getAll: (statusFilter?: string) => api.get('/repairs/', { params: { status_filter: statusFilter } }),
  getById: (id: number) => api.get(`/repairs/${id}`),
  create: (data: any) => api.post('/repairs/', data),
  update: (id: number, data: any) => api.put(`/repairs/${id}`, data),
  updateStatus: (id: number, newStatus: string) => 
    api.patch(`/repairs/${id}/status`, null, { params: { new_status: newStatus } }),
  getByCustomer: (customerId: number) => api.get(`/repairs/customer/${customerId}`),
  delete: (id: number) => api.delete(`/repairs/${id}`),
};

// Product API
export const productAPI = {
  getAll: (params?: any) => api.get('/products/', { params }),
  getById: (id: number) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products/', data),
  update: (id: number, data: any) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
  adjustStock: (id: number, data: any) => api.post(`/products/${id}/stock-adjustment`, data),
  getSummary: () => api.get('/products/summary'),
  search: (params: any) => api.get('/products/search', { params }),
};

// Product Sales API
export const productSaleAPI = {
  getAll: () => api.get('/product-sales/'),
  getById: (id: number) => api.get(`/product-sales/${id}`),
  create: (data: any) => api.post('/product-sales/', data),
  getSummary: () => api.get('/product-sales/summary'),
  getByCustomer: (customerId: number) => api.get(`/product-sales/customer/${customerId}`),
  getByProduct: (productId: number) => api.get(`/product-sales/product/${productId}`),
};

// Export API_URL for direct fetch calls
export { API_BASE_URL as API_URL };

export default api;
