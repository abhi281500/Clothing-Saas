/**
 * Centralized API client with credentials support for server-side sessions
 */

const rawApiBase = import.meta.env.VITE_API_URL || '/api';
const API_BASE = rawApiBase.replace(/\/+$/, '');

export async function apiRequest(endpoint, { method = 'GET', body, headers = {} } = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
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

  let response;
  try {
    response = await fetch(`${API_BASE}${cleanEndpoint}`, config);
  } catch (netErr) {
    // Handle network errors (e.g. Render server waking from cold start)
    const err = new Error(
      netErr.message === 'Failed to fetch'
        ? 'Unable to connect to the boutique server. If using free-tier hosting (Render), the backend may take 30-50 seconds to wake up. Please retry in a few moments.'
        : netErr.message || 'Network request failed'
    );
    err.status = 0;
    throw err;
  }

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
  setCustomDomain: (payload) => apiRequest('/stores/my-store/custom-domain', { method: 'POST', body: payload }),
  verifyCustomDomain: () => apiRequest('/stores/my-store/verify-domain', { method: 'POST' }),
  removeCustomDomain: () => apiRequest('/stores/my-store/custom-domain', { method: 'DELETE' }),

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

  // Promotions & Campaigns (Seller)
  getCampaigns: () => apiRequest('/campaigns'),
  createCampaign: (payload) => apiRequest('/campaigns', { method: 'POST', body: payload }),
  updateCampaign: (id, payload) => apiRequest(`/campaigns/${id}`, { method: 'PUT', body: payload }),
  deleteCampaign: (id) => apiRequest(`/campaigns/${id}`, { method: 'DELETE' }),

  // Public Storefront (Shopper)
  getStorefront: (slug) => apiRequest(`/storefront/${slug}`),
  getStorefrontByDomain: (domain) => apiRequest(`/storefront/by-domain/${encodeURIComponent(domain)}`),
  getStoreDeals: (slug) => apiRequest(`/storefront/${slug}/deals`),
  getStoreCatalog: (slug, params = '') => apiRequest(`/storefront/${slug}/catalog${params}`),
  getStoreProduct: (slug, productSlug) => apiRequest(`/storefront/${slug}/products/${productSlug}`),
  validateCoupon: (slug, payload) => apiRequest(`/storefront/${slug}/validate-coupon`, { method: 'POST', body: payload }),
  checkout: (slug, payload) => apiRequest(`/storefront/${slug}/checkout`, { method: 'POST', body: payload }),
  trackOrder: (slug, orderNumber, phone) =>
    apiRequest(`/storefront/${slug}/track-order?orderNumber=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`),
};
