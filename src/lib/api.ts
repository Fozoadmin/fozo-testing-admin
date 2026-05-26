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
  GroceryBundleBox,
  GroceryCategory,
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
import {
  clearStoredAuthSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  persistAccessToken,
  persistRefreshToken,
} from './authStorage';

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

type OrderListParams = PaginationParams & {
  dateFrom?: string;
  dateTo?: string;
};

function appendPaginationParams(params: URLSearchParams, pagination?: PaginationParams) {
  if (!pagination) return;
  if (pagination.page) params.append('page', String(pagination.page));
  if (pagination.limit) params.append('limit', String(pagination.limit));
  if (pagination.offset !== undefined) params.append('offset', String(pagination.offset));
}

function appendOrderListParams(params: URLSearchParams, orderListParams?: OrderListParams) {
  if (!orderListParams) return;
  appendPaginationParams(params, orderListParams);
  if (orderListParams.dateFrom) params.append('dateFrom', orderListParams.dateFrom);
  if (orderListParams.dateTo) params.append('dateTo', orderListParams.dateTo);
}

// Cache to prevent duplicate requests
const requestCache = new Map<string, Promise<unknown>>();
let refreshAccessTokenPromise: Promise<string | null> | null = null;

// Function to get auth token from localStorage
function getAuthToken(): string | null {
  return getStoredAccessToken();
}

function redirectToLogin() {
  window.location.href = '/login';
}

function handleSessionExpiration() {
  clearStoredAuthSession();
  redirectToLogin();
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    return null;
  }

  if (!refreshAccessTokenPromise) {
    refreshAccessTokenPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async response => {
        if (!response.ok) {
          return null;
        }

        const json = (await response.json()) as unknown;
        const data =
          json &&
          typeof json === 'object' &&
          'success' in json &&
          'data' in json &&
          (json as { success?: boolean }).success === true
            ? (json as { data: { accessToken?: string; token?: string; refreshToken?: string } })
                .data
            : (json as { accessToken?: string; token?: string; refreshToken?: string });

        const nextAccessToken = data.accessToken || data.token;
        if (!nextAccessToken) {
          return null;
        }

        persistAccessToken(nextAccessToken);
        if (data.refreshToken) {
          persistRefreshToken(data.refreshToken);
        }
        return nextAccessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshAccessTokenPromise = null;
      });
  }

  return refreshAccessTokenPromise;
}

async function buildHeaders(baseHeaders: HeadersInit | undefined, requireAuth: boolean) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
    ...baseHeaders,
  };

  if (requireAuth) {
    let token = getAuthToken();
    if (!token) {
      token = await refreshAccessToken();
    }
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

async function fetchWithAuth(
  endpoint: string,
  fetchOptions: RequestInit,
  requireAuth: boolean,
  hasRetried = false
): Promise<Response> {
  const headers = await buildHeaders(fetchOptions.headers, requireAuth);
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (requireAuth && response.status === 401 && !hasRetried) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      return fetchWithAuth(endpoint, fetchOptions, requireAuth, true);
    }
  }

  return response;
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  if (!response.status || response.status >= 400) {
    if (response.status === 401) {
      handleSessionExpiration();
      throw new Error('Your session has expired. Please sign in again to continue.');
    }

    const error = (await response.json().catch(() => ({ message: 'Request failed' }))) as {
      message?: string;
    };
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
}

async function uploadImage(endpoint: string, file: File, hasRetried = false): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  formData.append('image', file);

  let token = getAuthToken();
  if (!token) {
    token = await refreshAccessToken();
  }

  const headers: HeadersInit = { 'x-api-key': API_KEY };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (response.status === 401 && !hasRetried) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      return uploadImage(endpoint, file, true);
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      handleSessionExpiration();
      throw new Error('Your session has expired. Please sign in again to continue.');
    }

    const error = (await response.json().catch(() => ({ message: 'Upload failed' }))) as {
      message?: string;
    };
    throw new Error(toUserFacingMessage(error.message, getFriendlyStatusMessage(response.status)));
  }

  const json = await response.json();
  return json.success ? json.data : json;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { requireAuth = true, ...fetchOptions } = options;

  // Create cache key
  const cacheKey = `${endpoint}-${JSON.stringify(fetchOptions.body || {})}`;

  // Check if request is already in progress
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey) as Promise<T>;
  }

  const requestPromise = fetchWithAuth(endpoint, fetchOptions, requireAuth)
    .then(response => parseApiResponse<T>(response))
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

  getAllOrders: (status?: string, deliveryPartnerId?: string, orderListParams?: OrderListParams) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (deliveryPartnerId) params.append('deliveryPartnerId', deliveryPartnerId);
    appendOrderListParams(params, orderListParams);
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
  uploadRestaurantImage: (file: File): Promise<{ imageUrl: string }> =>
    uploadImage('/upload/restaurant', file),

  uploadSurpriseBagImage: (file: File): Promise<{ imageUrl: string }> =>
    uploadImage('/upload/surprise-bag', file),

  uploadCuisineImage: (file: File): Promise<{ imageUrl: string }> =>
    uploadImage('/upload/cuisine', file),

  uploadGroceryImage: (file: File): Promise<{ imageUrl: string }> =>
    uploadImage('/upload/grocery', file),

  uploadGroceryCategoryImage: (file: File): Promise<{ imageUrl: string }> =>
    uploadImage('/upload/grocery-category', file),

  // Grocery Category Management
  getAllGroceryCategories: (includeInactive = false) =>
    apiRequest<GroceryCategory[]>(
      `/admin/grocery-categories${includeInactive ? '?includeInactive=true' : ''}`
    ),

  createGroceryCategory: (body: JsonRequestBody) =>
    apiRequest<GroceryCategory>('/admin/grocery-categories', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateGroceryCategory: (id: number, body: JsonRequestBody) =>
    apiRequest<GroceryCategory>(`/admin/grocery-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  deleteGroceryCategory: (id: number) =>
    apiRequest<ApiMutationResponse>(`/admin/grocery-categories/${id}`, {
      method: 'DELETE',
    }),

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

  // Grocery Bundle Box Management
  getAllGroceryBundleBoxes: (
    storeId?: string,
    search?: string,
    includeInactive = true,
    pagination?: PaginationParams
  ) => {
    const params = new URLSearchParams();
    if (storeId) params.append('storeId', storeId);
    if (search) params.append('search', search);
    if (includeInactive) params.append('includeInactive', 'true');
    appendPaginationParams(params, pagination);
    return apiRequest<GroceryBundleBox[]>(
      `/admin/grocery-bundle-boxes${params.toString() ? `?${params.toString()}` : ''}`
    );
  },

  getGroceryBundleBoxById: (id: string) =>
    apiRequest<GroceryBundleBox>(`/admin/grocery-bundle-boxes/${id}`),

  createGroceryBundleBox: (body: JsonRequestBody) =>
    apiRequest<GroceryBundleBox>('/admin/grocery-bundle-boxes', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateGroceryBundleBox: (id: string, body: JsonRequestBody) =>
    apiRequest<GroceryBundleBox>(`/admin/grocery-bundle-boxes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  deleteGroceryBundleBox: (id: string) =>
    apiRequest<ApiMutationResponse>(`/admin/grocery-bundle-boxes/${id}`, { method: 'DELETE' }),

  // Grocery Order Management
  getAllGroceryOrders: (status?: string, orderListParams?: OrderListParams) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    appendOrderListParams(params, orderListParams);
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
