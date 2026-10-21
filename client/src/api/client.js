/**
 * Centralized API client with credentials support for server-side sessions
 */

const API_BASE = '/api';

export async function apiRequest(endpoint, { method = 'GET', body, headers = {} } = {}) {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include', // Send session cookie with cross-origin or proxied requests
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.message || 'Network request failed';
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: payload }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  getMe: () => apiRequest('/auth/me'),

  // Store Management (Seller)
  getMyStore: () => apiRequest('/stores/my-store'),
  updateMyStore: (payload) => apiRequest('/stores/my-store', { method: 'PATCH', body: payload }),
  getDashboardStats: () => apiRequest('/stores/dashboard-stats'),

  // Product Management (Seller)
  getProducts: (params = '') => apiRequest(`/products${params}`),
  createProduct: (payload) => apiRequest('/products', { method: 'POST', body: payload }),
  updateProduct: (id, payload) => apiRequest(`/products/${id}`, { method: 'PUT', body: payload }),
  deleteProduct: (id) => apiRequest(`/products/${id}`, { method: 'DELETE' }),

  // Order Management (Seller)
  getOrders: (params = '') => apiRequest(`/orders${params}`),
  getOrder: (id) => apiRequest(`/orders/${id}`),
  updateOrderStatus: (id, payload) => apiRequest(`/orders/${id}/status`, { method: 'PATCH', body: payload }),

  // Discount Management (Seller)
  getDiscounts: () => apiRequest('/discounts'),
  createDiscount: (payload) => apiRequest('/discounts', { method: 'POST', body: payload }),
  deleteDiscount: (id) => apiRequest(`/discounts/${id}`, { method: 'DELETE' }),

  // Public Storefront (Shopper)
  getStorefront: (slug) => apiRequest(`/storefront/${slug}`),
  getStoreCatalog: (slug, params = '') => apiRequest(`/storefront/${slug}/catalog${params}`),
  getStoreProduct: (slug, productSlug) => apiRequest(`/storefront/${slug}/products/${productSlug}`),
  validateCoupon: (slug, payload) => apiRequest(`/storefront/${slug}/validate-coupon`, { method: 'POST', body: payload }),
  checkout: (slug, payload) => apiRequest(`/storefront/${slug}/checkout`, { method: 'POST', body: payload }),
  trackOrder: (slug, orderNumber, phone) =>
    apiRequest(`/storefront/${slug}/track-order?orderNumber=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`),
};
