/**
 * API Service Layer
 * Handles all backend API calls
 */
import axios from 'axios';

// API Base URL Configuration
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:8000/api'
  : 'https://api.digitstec.store/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increased to 30 seconds for slower operations like repairs with SMS
});

// Add auth token to all requests
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

// Brand API
export const brandAPI = {
  getAll: () => api.get('/brands/'),
  getById: (id: number) => api.get(`/brands/${id}`),
  create: (data: any) => api.post('/brands/', data),
  update: (id: number, data: any) => api.put(`/brands/${id}`, data),
  delete: (id: number) => api.delete(`/brands/${id}`),
};

// Category API
export const categoryAPI = {
  getAll: () => api.get('/categories/'),
  getById: (id: number) => api.get(`/categories/${id}`),
  create: (data: any) => api.post('/categories/', data),
  update: (id: number, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};

// Auth API
export const authAPI = {
  me: () => api.get('/auth/me'),
  login: (username: string, password: string) => api.post('/auth/login-json', { username, password }),
  register: (userData: any) => api.post('/auth/register', userData),
};

// Bulk Upload API
export const bulkUploadAPI = {
  uploadPhones: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/bulk-upload/phones', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getPhoneTemplate: () => `${API_BASE_URL}/bulk-upload/phones/template`,
};

// Export API_URL for direct fetch calls
export { API_BASE_URL as API_URL };

export default api;
