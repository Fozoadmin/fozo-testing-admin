import type { OrderStatus } from '../constants/orderStatus';
import type {
  AdminNotification,
  AdminOrder,
  AdminUser,
  ApiMutationResponse,
  Coupon,
  DeliveryPartner,
  DeliveryPartnerStatus,
  GroceryItem,
  GroceryOrder,
  GroceryStore,
  GroupedRestaurant,
  Restaurant,
  RestaurantFinancialSummary,
  RestaurantStatus,
  SurpriseBag,
  DeliveryPartnerFinancialSummary,
} from '@/types';
import { getFriendlyStatusMessage, toUserFacingMessage } from './utils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_KEY = import.meta.env.VITE_API_KEY || '';

type AdminOrderStatus = OrderStatus;

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

type JsonRequestBody = Record<string, unknown>;
type AdminOverviewStats = {
  totalOrders: number;
  totalRevenue: number;
  totalRestaurants: number;
  totalUsers: number;
  totalBags: number;
  totalDeliveryPartners: number;
};
export type PaginationParams = {
  page?: number;
  limit?: number;
  offset?: number;
};

function appendPaginationParams(params: URLSearchParams, pagination?: PaginationParams) {
  if (!pagination) return;
  if (pagination.page) params.append('page', String(pagination.page));
  if (pagination.limit) params.append('limit', String(pagination.limit));
  if (pagination.offset !== undefined) params.append('offset', String(pagination.offset));
}

// Cache to prevent duplicate requests
const requestCache = new Map<string, Promise<unknown>>();

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

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { requireAuth = true, ...fetchOptions } = options;

  // Create cache key
  const cacheKey = `${endpoint}-${JSON.stringify(fetchOptions.body || {})}`;

  // Check if request is already in progress
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey) as Promise<T>;
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
  })
    .then(async response => {
      // Handle token expiration - check for 401 or 403 with JWT expired message
      if (response.status === 401 || response.status === 403) {
        const errorData = (await response.json().catch(() => ({}))) as { message?: string };
        const errorMessage = errorData.message?.toLowerCase() || '';

        if (
          errorMessage.includes('jwt expired') ||
          errorMessage.includes('expired') ||
          errorMessage.includes('invalid') ||
          errorMessage.includes('unauthorized') ||
          errorMessage.includes('verification failed')
        ) {
          handleTokenExpiration();
          throw new Error('Your session has expired. Please sign in again to continue.');
        }
      }

      if (!response.status || response.status >= 400) {
        const error = (await response
          .json()
          .catch(() => ({ message: 'Request failed' }))) as { message?: string };
        throw new Error(toUserFacingMessage(error.message, getFriendlyStatusMessage(response.status)));
      }

      return response.json().then((json: unknown) => {
        // If the response follows the { success, data, message } pattern, return just the data
        if (
          json &&
          typeof json === 'object' &&
          'success' in json &&
          'data' in json &&
          (json as { success?: boolean }).success === true
        ) {
          return (json as { data: T }).data;
        }
        return json as T;
      });
    })
    .finally(() => {
      // Remove from cache after completion
      requestCache.delete(cacheKey);
    });

  // Store the promise in cache
  requestCache.set(cacheKey, requestPromise);

  return requestPromise;
}

// Admin API methods
export const adminApi = {
  getOverviewStats: () => apiRequest<AdminOverviewStats>('/admin/overview-stats'),
  getAllUsers: (
    userType?: 'customer' | 'restaurant' | 'delivery_partner' | 'admin' | 'grocery',
    search?: string,
    pagination?: PaginationParams
  ) => {
    const params = new URLSearchParams();
    if (userType) params.append('userType', userType);
    if (search) params.append('search', search);
    appendPaginationParams(params, pagination);
    return apiRequest<AdminUser[]>(
      `/admin/users${params.toString() ? `?${params.toString()}` : ''}`
    );
  },
  getUserCount: () => apiRequest<{ totalUsers: number }>('/admin/users/count'),
  getAllRestaurants: (search?: string, pagination?: PaginationParams) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    appendPaginationParams(params, pagination);
    return apiRequest<Restaurant[]>(
      `/admin/restaurants${params.toString() ? `?${params.toString()}` : ''}`
    );
  },
  getRestaurantById: (id: string) => apiRequest<Restaurant>(`/admin/restaurants/${id}`),
  getAllCuisines: () =>
    apiRequest<Array<{ id: number; name: string; imageUrl?: string }>>('/admin/cuisines'),
  createCuisine: (body: { name: string; imageUrl?: string }) =>
    apiRequest<{ id: number; name: string; imageUrl?: string }>('/admin/cuisines', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  onboardRestaurant: (body: JsonRequestBody) =>
    apiRequest<Restaurant>('/admin/restaurants', { method: 'POST', body: JSON.stringify(body) }),

  getAllOrders: (status?: string, deliveryPartnerId?: string, pagination?: PaginationParams) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (deliveryPartnerId) params.append('deliveryPartnerId', deliveryPartnerId);
    appendPaginationParams(params, pagination);
    return apiRequest<{ orders: AdminOrder[] }>(
      `/admin/orders${params.toString() ? `?${params.toString()}` : ''}`
    );
  },

  getAllDeliveryPartners: (status?: string, isOnline?: string, pagination?: PaginationParams) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (isOnline) params.append('isOnline', isOnline);
    appendPaginationParams(params, pagination);
    return apiRequest<DeliveryPartner[]>(
      `/admin/delivery-partners${params.toString() ? `?${params.toString()}` : ''}`
    );
  },

  onboardDeliveryPartner: (body: JsonRequestBody) =>
    apiRequest<DeliveryPartner>('/admin/delivery-partners', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getAllSurpriseBags: (pagination?: PaginationParams) => {
    const params = new URLSearchParams();
    appendPaginationParams(params, pagination);
    return apiRequest<SurpriseBag[]>(`/admin/bags${params.toString() ? `?${params.toString()}` : ''}`);
  },
  getGroupedSurpriseBags: (pagination?: PaginationParams) => {
    const params = new URLSearchParams();
    appendPaginationParams(params, pagination);
    return apiRequest<GroupedRestaurant[]>(`/admin/bags/grouped${params.toString() ? `?${params.toString()}` : ''}`);
  },

  createSurpriseBag: (body: JsonRequestBody) =>
    apiRequest<SurpriseBag>('/bags', { method: 'POST', body: JSON.stringify(body) }),

  updateSurpriseBag: (bagId: string, body: JsonRequestBody) =>
    apiRequest<SurpriseBag>(`/bags/${bagId}`, { method: 'PUT', body: JSON.stringify(body) }),

  deleteSurpriseBag: (bagId: string, targetRestaurantId?: string) =>
    apiRequest<ApiMutationResponse>(`/bags/${bagId}`, {
      method: 'DELETE',
      body: JSON.stringify({ targetRestaurantId }),
    }),

  // Restaurant Admin Updates
  updateRestaurantProfile: (restaurantId: string, profileData: JsonRequestBody) =>
    apiRequest<Restaurant>(`/admin/restaurants/${restaurantId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  updateRestaurantStatus: (
    restaurantId: string,
    status: RestaurantStatus,
    documentsVerified?: boolean
  ) =>
    apiRequest(`/admin/restaurants/${restaurantId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, documentsVerified }),
    }),

  updateRestaurantCuisines: (restaurantId: string, cuisineIds: (string | number)[]) =>
    apiRequest<ApiMutationResponse>(`/admin/restaurants/${restaurantId}/cuisines`, {
      method: 'PUT',
      body: JSON.stringify({ cuisineIds }),
    }),

  deleteRestaurant: (restaurantId: string) =>
    apiRequest<ApiMutationResponse>(`/admin/restaurants/${restaurantId}`, {
      method: 'DELETE',
    }),

  deleteUser: (userId: string) =>
    apiRequest<ApiMutationResponse>(`/admin/users/${userId}`, {
      method: 'DELETE',
    }),

  // Delivery Partner Admin Updates
  updateDeliveryPartner: (dpUserId: string, profileData: JsonRequestBody) =>
    apiRequest<DeliveryPartner>(`/admin/delivery-partners/${dpUserId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  updateDeliveryPartnerStatus: (
    dpUserId: string,
    status: DeliveryPartnerStatus,
    documentsVerified?: boolean
  ) =>
    apiRequest(`/admin/delivery-partners/${dpUserId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, documentsVerified }),
    }),

  updateDeliveryPartnerOnlineStatus: (dpId: string, isOnline: boolean) =>
    apiRequest<DeliveryPartner>(`/admin/delivery-partners/${dpId}/online-status`, {
      method: 'PUT',
      body: JSON.stringify({ isOnline }),
    }),

  updateOrderStatus: (orderId: string, newStatus: AdminOrderStatus, deliveryPartnerId?: string) =>
    apiRequest<ApiMutationResponse>(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({
        newStatus,
        ...(deliveryPartnerId ? { deliveryPartnerId } : {}),
      }),
    }),

  // Settings Management
  getSettings: () => apiRequest<Record<string, string>>('/admin/settings'),
  updateSettings: (settingsData: Record<string, string>) =>
    apiRequest<ApiMutationResponse>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    }),

  // Coupons Management
  getAllCoupons: (restaurantId?: string, pagination?: PaginationParams) => {
    const params = new URLSearchParams();
    if (restaurantId) params.append('restaurantId', restaurantId);
    appendPaginationParams(params, pagination);
    return apiRequest<{ coupons: Coupon[] }>(
      `/admin/coupons${params.toString() ? `?${params.toString()}` : ''}`
    );
  },

  createCoupon: (body: JsonRequestBody) =>
    apiRequest<Coupon>('/admin/coupons', { method: 'POST', body: JSON.stringify(body) }),

  updateCoupon: (couponId: string, body: JsonRequestBody) =>
    apiRequest<Coupon>(`/admin/coupons/${couponId}`, { method: 'PUT', body: JSON.stringify(body) }),

  setCouponActive: (couponId: string, isActive: boolean) =>
    apiRequest<Coupon>(`/admin/coupons/${couponId}`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    }),

  deleteCoupon: (couponId: string) =>
    apiRequest<ApiMutationResponse>(`/admin/coupons/${couponId}`, { method: 'DELETE' }),

  // Finance Management
  getRestaurantFinancialSummary: (
    restaurantIds?: string[],
    startDate?: string,
    endDate?: string
  ) => {
    const params = new URLSearchParams();
    if (restaurantIds && restaurantIds.length > 0)
      params.append('restaurantIds', restaurantIds.join(','));
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiRequest<RestaurantFinancialSummary[]>(`/admin/finance/restaurants?${params.toString()}`);
  },

  getDeliveryPartnerFinancialSummary: (
    deliveryPartnerIds?: string[],
    startDate?: string,
    endDate?: string
  ) => {
    const params = new URLSearchParams();
    if (deliveryPartnerIds && deliveryPartnerIds.length > 0)
      params.append('deliveryPartnerIds', deliveryPartnerIds.join(','));
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiRequest<DeliveryPartnerFinancialSummary[]>(
      `/admin/finance/delivery-partners?${params.toString()}`
    );
  },

  // Notification Management
  getAllNotifications: (pagination?: PaginationParams) => {
    const params = new URLSearchParams();
    appendPaginationParams(params, pagination);
    return apiRequest<AdminNotification[]>(
      `/admin/notifications${params.toString() ? `?${params.toString()}` : ''}`
    );
  },
  getNotificationById: (id: string | number) =>
    apiRequest<AdminNotification>(`/admin/notifications/${id}`),
  createNotification: (body: JsonRequestBody) =>
    apiRequest<AdminNotification>('/admin/notifications', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateNotification: (id: string | number, body: JsonRequestBody) =>
    apiRequest<AdminNotification>(`/admin/notifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteNotification: (id: string | number) =>
    apiRequest<ApiMutationResponse>(`/admin/notifications/${id}`, {
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
      const error = (await response.json().catch(() => ({ message: 'Upload failed' }))) as {
        message?: string;
      };
      throw new Error(toUserFacingMessage(error.message, getFriendlyStatusMessage(response.status)));
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
      const error = (await response.json().catch(() => ({ message: 'Upload failed' }))) as {
        message?: string;
      };
      throw new Error(toUserFacingMessage(error.message, getFriendlyStatusMessage(response.status)));
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
      const error = (await response.json().catch(() => ({ message: 'Upload failed' }))) as {
        message?: string;
      };
      throw new Error(toUserFacingMessage(error.message, getFriendlyStatusMessage(response.status)));
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
      const error = (await response.json().catch(() => ({ message: 'Upload failed' }))) as {
        message?: string;
      };
      throw new Error(toUserFacingMessage(error.message, getFriendlyStatusMessage(response.status)));
    }
    const json = await response.json();
    return json.success ? json.data : json;
  },

  // Grocery Store Management
  getAllGroceryStores: (search?: string, pagination?: PaginationParams) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    appendPaginationParams(params, pagination);
    return apiRequest<GroceryStore[]>(
      `/admin/grocery-stores${params.toString() ? `?${params.toString()}` : ''}`
    );
  },

  getGroceryStoreById: (id: string) => apiRequest<GroceryStore>(`/admin/grocery-stores/${id}`),

  createGroceryStore: (body: JsonRequestBody) =>
    apiRequest<GroceryStore>('/admin/grocery-stores', { method: 'POST', body: JSON.stringify(body) }),

  updateGroceryStore: (id: string, body: JsonRequestBody) =>
    apiRequest<GroceryStore>(`/admin/grocery-stores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  deleteGroceryStore: (id: string) =>
    apiRequest<ApiMutationResponse>(`/admin/grocery-stores/${id}`, { method: 'DELETE' }),

  // Grocery Item Management
  getAllGroceryItems: (storeId?: string, search?: string, pagination?: PaginationParams) => {
    const params = new URLSearchParams();
    if (storeId) params.append('storeId', storeId);
    if (search) params.append('search', search);
    appendPaginationParams(params, pagination);
    return apiRequest<GroceryItem[]>(
      `/admin/grocery-items${params.toString() ? `?${params.toString()}` : ''}`
    );
  },

  getGroceryItemById: (id: string) => apiRequest<GroceryItem>(`/admin/grocery-items/${id}`),

  createGroceryItem: (body: JsonRequestBody) =>
    apiRequest<GroceryItem>('/admin/grocery-items', { method: 'POST', body: JSON.stringify(body) }),

  updateGroceryItem: (id: string, body: JsonRequestBody) =>
    apiRequest<GroceryItem>(`/admin/grocery-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  deleteGroceryItem: (id: string) =>
    apiRequest<ApiMutationResponse>(`/admin/grocery-items/${id}`, { method: 'DELETE' }),

  // Grocery Order Management
  getAllGroceryOrders: (status?: string, pagination?: PaginationParams) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    appendPaginationParams(params, pagination);
    return apiRequest<{ orders: GroceryOrder[] }>(
      `/admin/grocery-orders${params.toString() ? `?${params.toString()}` : ''}`
    );
  },

  updateGroceryOrderStatus: (orderId: string, newStatus: string) =>
    apiRequest<ApiMutationResponse>(`/admin/grocery-orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ newStatus }),
    }),
};
