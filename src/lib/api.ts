/* eslint-disable @typescript-eslint/no-explicit-any */
import type { OrderStatus } from '../constants/orderStatus';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_KEY = import.meta.env.VITE_API_KEY || '';

type AdminOrderStatus = OrderStatus;


interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

// Cache to prevent duplicate requests
const requestCache = new Map<string, Promise<any>>();

// Function to get auth token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

// Function to handle logout on token expiration
function handleTokenExpiration() {
  localStorage.removeItem('user');
  localStorage.removeItem('auth_token');
  // Redirect to login page directly instead of reloading
  window.location.href = '/login';
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requireAuth = true, ...fetchOptions } = options;

  // Create cache key
  const cacheKey = `${endpoint}-${JSON.stringify(fetchOptions.body || {})}`;

  // Check if request is already in progress
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey)!;
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
    ...fetchOptions.headers,
  };

  if (requireAuth) {
    const token = getAuthToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  const requestPromise = fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  }).then(async (response) => {
    // Handle token expiration - check for 401 or 403 with JWT expired message
    if (response.status === 401 || response.status === 403) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message?.toLowerCase() || '';

      if (errorMessage.includes('jwt expired') ||
        errorMessage.includes('expired') ||
        errorMessage.includes('invalid') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('verification failed')) {
        handleTokenExpiration();
        throw new Error('Token expired. Please login again.');
      }
    }

    if (!response.status || response.status >= 400) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json().then(json => {
      // If the response follows the { success, data, message } pattern, return just the data
      if (json && typeof json === 'object' && 'success' in json && 'data' in json && json.success === true) {
        return json.data;
      }
      return json;
    });
  }).finally(() => {
    // Remove from cache after completion
    requestCache.delete(cacheKey);
  });

  // Store the promise in cache
  requestCache.set(cacheKey, requestPromise);

  return requestPromise;
}

// Admin API methods
export const adminApi = {
  getAllUsers: (userType?: 'customer' | 'restaurant' | 'delivery_partner' | 'admin', search?: string) => {
    const params = new URLSearchParams();
    if (userType) params.append('userType', userType);
    if (search) params.append('search', search);
    return apiRequest<any[]>(`/admin/users${params.toString() ? `?${params.toString()}` : ''}`);
  },
  getAllRestaurants: (search?: string) =>
    apiRequest<any[]>(`/admin/restaurants${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getRestaurantById: (id: string) => apiRequest<any>(`/admin/restaurants/${id}`),
  getAllCuisines: () => apiRequest<Array<{ id: number; name: string; imageUrl?: string }>>('/admin/cuisines'),
  createCuisine: (body: { name: string; imageUrl?: string }) => apiRequest<{ id: number; name: string; imageUrl?: string }>(
    '/admin/cuisines',
    { method: 'POST', body: JSON.stringify(body) }
  ),

  onboardRestaurant: (body: any) => apiRequest<any>(
    '/admin/restaurants',
    { method: 'POST', body: JSON.stringify(body) }
  ),

  getAllOrders: (status?: string, deliveryPartnerId?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (deliveryPartnerId) params.append('deliveryPartnerId', deliveryPartnerId);
    return apiRequest<{ orders: any[] }>(`/admin/orders${params.toString() ? `?${params.toString()}` : ''}`);
  },

  getAllDeliveryPartners: (status?: string, isOnline?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (isOnline) params.append('isOnline', isOnline);
    return apiRequest<any[]>(`/admin/delivery-partners?${params.toString()}`);
  },

  onboardDeliveryPartner: (body: any) => apiRequest<any>(
    '/admin/delivery-partners',
    { method: 'POST', body: JSON.stringify(body) }
  ),

  getAllSurpriseBags: () => apiRequest<any[]>('/admin/bags'),
  getGroupedSurpriseBags: () => apiRequest<any[]>('/admin/bags/grouped'),

  createSurpriseBag: (body: any) => apiRequest<any>(
    '/bags',
    { method: 'POST', body: JSON.stringify(body) }
  ),

  updateSurpriseBag: (bagId: string, body: any) => apiRequest<any>(
    `/bags/${bagId}`,
    { method: 'PUT', body: JSON.stringify(body) }
  ),

  deleteSurpriseBag: (bagId: string, targetRestaurantId?: string) =>
    apiRequest<any>(
      `/bags/${bagId}`,
      {
        method: 'DELETE',
        body: JSON.stringify({ targetRestaurantId })
      }
    ),

  // Restaurant Admin Updates
  updateRestaurantProfile: (restaurantId: string, profileData: any) =>
    apiRequest(`/admin/restaurants/${restaurantId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  updateRestaurantStatus: (
    restaurantId: string,
    status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'closed',
    documentsVerified?: boolean
  ) => apiRequest(`/admin/restaurants/${restaurantId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, documentsVerified }),
  }),

  updateRestaurantCuisines: (restaurantId: string, cuisineIds: (string | number)[]) =>
    apiRequest<any>(`/admin/restaurants/${restaurantId}/cuisines`, {
      method: 'PUT',
      body: JSON.stringify({ cuisineIds }),
    }),

  deleteRestaurant: (restaurantId: string) =>
    apiRequest<any>(`/admin/restaurants/${restaurantId}`, {
      method: 'DELETE',
    }),

  deleteUser: (userId: string) =>
    apiRequest<any>(`/admin/users/${userId}`, {
      method: 'DELETE',
    }),

  // Delivery Partner Admin Updates
  updateDeliveryPartner: (dpUserId: string, profileData: any) =>
    apiRequest(`/admin/delivery-partners/${dpUserId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  updateDeliveryPartnerStatus: (
    dpUserId: string,
    status: 'pending' | 'approved' | 'rejected' | 'suspended',
    documentsVerified?: boolean
  ) => apiRequest(`/admin/delivery-partners/${dpUserId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, documentsVerified }),
  }),

  updateDeliveryPartnerOnlineStatus: (dpId: string, isOnline: boolean) =>
    apiRequest<any>(`/admin/delivery-partners/${dpId}/online-status`, {
      method: 'PUT',
      body: JSON.stringify({ isOnline }),
    }),

  updateOrderStatus: (orderId: string, newStatus: AdminOrderStatus, deliveryPartnerId?: string) =>
    apiRequest<any>(
      `/orders/${orderId}/status`,
      {
        method: 'PUT',
        body: JSON.stringify({
          newStatus,
          ...(deliveryPartnerId ? { deliveryPartnerId } : {}),
        }),
      }
    ),

  // Settings Management
  getSettings: () => apiRequest<Record<string, string>>('/admin/settings'),
  updateSettings: (settingsData: Record<string, string>) =>
    apiRequest<any>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    }),

  // Coupons Management
  getAllCoupons: (restaurantId?: string) => {
    const params = new URLSearchParams();
    if (restaurantId) params.append('restaurantId', restaurantId);
    return apiRequest<{ coupons: any[] }>(`/admin/coupons${params.toString() ? `?${params.toString()}` : ''}`);
  },

  createCoupon: (body: any) => apiRequest<any>(
    '/admin/coupons',
    { method: 'POST', body: JSON.stringify(body) }
  ),

  updateCoupon: (couponId: string, body: any) =>
    apiRequest<any>(
      `/admin/coupons/${couponId}`,
      { method: 'PUT', body: JSON.stringify(body) }
    ),

  setCouponActive: (couponId: string, isActive: boolean) =>
    apiRequest<any>(
      `/admin/coupons/${couponId}`,
      { method: 'PUT', body: JSON.stringify({ isActive }) }
    ),

  deleteCoupon: (couponId: string) =>
    apiRequest<any>(
      `/admin/coupons/${couponId}`,
      { method: 'DELETE' }
    ),

  // Finance Management
  getRestaurantFinancialSummary: (restaurantIds?: string[], startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (restaurantIds && restaurantIds.length > 0) params.append('restaurantIds', restaurantIds.join(','));
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiRequest<any[]>(`/admin/finance/restaurants?${params.toString()}`);
  },

  getDeliveryPartnerFinancialSummary: (deliveryPartnerIds?: string[], startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (deliveryPartnerIds && deliveryPartnerIds.length > 0) params.append('deliveryPartnerIds', deliveryPartnerIds.join(','));
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiRequest<any[]>(`/admin/finance/delivery-partners?${params.toString()}`);
  },

  // Notification Management
  getAllNotifications: () => apiRequest<any[]>('/admin/notifications'),
  getNotificationById: (id: string | number) => apiRequest<any>(`/admin/notifications/${id}`),
  createNotification: (body: any) =>
    apiRequest<any>('/admin/notifications', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateNotification: (id: string | number, body: any) =>
    apiRequest<any>(`/admin/notifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteNotification: (id: string | number) =>
    apiRequest<any>(`/admin/notifications/${id}`, {
      method: 'DELETE',
    }),

  // Image Upload
  uploadRestaurantImage: async (file: File): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    const token = getAuthToken();
    const headers: HeadersInit = { 'x-api-key': API_KEY };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/upload/restaurant`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    const json = await response.json();
    return json.success ? json.data : json;
  },

  uploadSurpriseBagImage: async (file: File): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    const token = getAuthToken();
    const headers: HeadersInit = { 'x-api-key': API_KEY };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/upload/surprise-bag`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    const json = await response.json();
    return json.success ? json.data : json;
  },

  uploadCuisineImage: async (file: File): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    const token = getAuthToken();
    const headers: HeadersInit = { 'x-api-key': API_KEY };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/upload/cuisine`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    const json = await response.json();
    return json.success ? json.data : json;
  },

  uploadGroceryImage: async (file: File): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    const token = getAuthToken();
    const headers: HeadersInit = { 'x-api-key': API_KEY };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/upload/grocery`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    const json = await response.json();
    return json.success ? json.data : json;
  },

  // Grocery Store Management
  getAllGroceryStores: (search?: string) =>
    apiRequest<any[]>(`/admin/grocery-stores${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  getGroceryStoreById: (id: string) =>
    apiRequest<any>(`/admin/grocery-stores/${id}`),

  createGroceryStore: (body: any) =>
    apiRequest<any>('/admin/grocery-stores', { method: 'POST', body: JSON.stringify(body) }),

  updateGroceryStore: (id: string, body: any) =>
    apiRequest<any>(`/admin/grocery-stores/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  deleteGroceryStore: (id: string) =>
    apiRequest<any>(`/admin/grocery-stores/${id}`, { method: 'DELETE' }),

  // Grocery Item Management
  getAllGroceryItems: (storeId?: string, search?: string) => {
    const params = new URLSearchParams();
    if (storeId) params.append('storeId', storeId);
    if (search) params.append('search', search);
    return apiRequest<any[]>(`/admin/grocery-items${params.toString() ? `?${params.toString()}` : ''}`);
  },

  getGroceryItemById: (id: string) =>
    apiRequest<any>(`/admin/grocery-items/${id}`),

  createGroceryItem: (body: any) =>
    apiRequest<any>('/admin/grocery-items', { method: 'POST', body: JSON.stringify(body) }),

  updateGroceryItem: (id: string, body: any) =>
    apiRequest<any>(`/admin/grocery-items/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  deleteGroceryItem: (id: string) =>
    apiRequest<any>(`/admin/grocery-items/${id}`, { method: 'DELETE' }),
};
