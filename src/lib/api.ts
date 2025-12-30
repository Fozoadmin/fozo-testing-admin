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
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
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
  getAllCuisines: () => apiRequest<Array<{ id: number; name: string }>>('/admin/cuisines'),
  // Onboard new restaurant (single transaction)
  onboardRestaurant: (body: {
    phoneNumber?: string;
    email?: string;
    password: string;
    fullName: string;
    userType: 'restaurant';
    restaurantName: string;
    contactPersonName?: string;
    fssaiLicenseNumber?: string;
    gstinNumber?: string;
    bankAccountDetails?: {
      accountNumber: string;
      ifscCode: string;
      accountHolderName: string;
      bankName: string;
    };
    primaryLocation: {
      locationName?: string;
      address: string;
      latitude: number;
      longitude: number;
      contactNumber?: string;
      email?: string;
    };
    operatingHours: Array<{
      dayOfWeek: string;
      openTime: string | null;
      closeTime: string | null;
      isClosed: boolean;
    }>;
    restaurantCuisineIds: number[];
  }) => apiRequest<{ message: string; restaurantId: string; status: string }>(
    '/admin/restaurants',
    { method: 'POST', body: JSON.stringify(body) }
  ),
  getAllOrders: (status?: string, deliveryPartnerId?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (deliveryPartnerId) params.append('deliveryPartnerId', deliveryPartnerId);
    return apiRequest<{ orders: any[] }>(`/admin/orders${params.toString() ? `?${params.toString()}` : ''}`);
  },
  getAllDeliveryPartners: (status?: string, isOnline?: string) => 
    apiRequest<any[]>(`/admin/delivery-partners${status ? `?status=${status}` : ''}${isOnline ? `?isOnline=${isOnline}` : ''}`),
  // Note: Delivery partners use OTP-based auth, so email and password are optional
  onboardDeliveryPartner: (body: {
    phoneNumber: string; // Required - used for OTP authentication
    email?: string; // Optional
    password?: string; // Optional - DPs typically use OTP
    fullName: string;
    userType: 'delivery_partner';
    vehicleType: 'bicycle' | 'scooter' | 'motorcycle' | 'car';
    licenseNumber?: string;
    bankAccountDetails?: {
      accountNumber: string;
      ifscCode: string;
      accountHolderName: string;
      bankName: string;
    };
  }) => apiRequest<{ message: string; userId: string; status: string }>(
    '/admin/delivery-partners',
    { method: 'POST', body: JSON.stringify(body) }
  ),
  getAllSurpriseBags: () => apiRequest<any[]>('/admin/bags'),
  getGroupedSurpriseBags: () => apiRequest<any[]>('/admin/bags/grouped'),
  createSurpriseBag: (body: {
    targetRestaurantId: string; // admin creating for a specific restaurant
    bagName: string;
    denominationValue: number;
    actualWorth: number;
    description?: string;
    imageUrl?: string;
    quantityAvailable: number;
    pickupStartTime?: string; // HH:MM:SS
    pickupEndTime?: string;   // HH:MM:SS
    availableDate?: string;  // YYYY-MM-DD
    isActive?: boolean;
    isVegetarian?: boolean;
  }) => apiRequest<{ message: string; bag: any }>(
    '/bags',
    { method: 'POST', body: JSON.stringify(body) }
  ),
  updateSurpriseBag: (bagId: string, body: {
    targetRestaurantId?: string; // admin updating for a specific restaurant
    bagName?: string;
    denominationValue?: number;
    actualWorth?: number;
    description?: string;
    imageUrl?: string;
    quantityAvailable?: number;
    pickupStartTime?: string; // HH:MM:SS
    pickupEndTime?: string;   // HH:MM:SS
    availableDate?: string;  // YYYY-MM-DD
    isActive?: boolean;
    isVegetarian?: boolean;
  }) => apiRequest<{ message: string; bag: any }>(
    `/bags/${bagId}`,
    { method: 'PUT', body: JSON.stringify(body) }
  ),
  deleteSurpriseBag: (bagId: string, targetRestaurantId?: string) => 
    apiRequest<{ message: string }>(
      `/bags/${bagId}`,
      { 
        method: 'DELETE', 
        body: JSON.stringify({ targetRestaurantId }) 
      }
    ),
  // Auth/Registration
  registerPasswordUser: (body: {
    phoneNumber?: string;
    email?: string;
    password: string;
    userType: 'restaurant' | 'delivery_partner';
    fullName: string;
  }) => apiRequest<{ message: string; userId: string }>(
    '/auth/register-password',
    { method: 'POST', body: JSON.stringify(body), requireAuth: false }
  ),
  // Restaurant Admin Updates
  updateRestaurantProfile: (
    restaurantId: string,
    profileData: {
      restaurantName?: string;
      contactPersonName?: string;
      fssaiLicenseNumber?: string;
      gstinNumber?: string;
      imageUrl?: string;
      bankAccountDetails?: any;
      primaryLocation?: any;
      operatingHours?: any[];
    }
  ) => apiRequest(`/admin/restaurants/${restaurantId}`, {
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
  updateRestaurantCuisines: (restaurantId: string, cuisineIds: number[]) => 
    apiRequest<{ message: string }>(`/admin/restaurants/${restaurantId}/cuisines`, {
      method: 'PUT',
      body: JSON.stringify({ cuisineIds }),
    }),
  deleteRestaurant: (restaurantId: string) => 
    apiRequest<{ message: string }>(`/admin/restaurants/${restaurantId}`, {
      method: 'DELETE',
    }),
  deleteUser: (userId: string) => 
    apiRequest<{ message: string }>(`/admin/users/${userId}`, {
      method: 'DELETE',
    }),
  // Delivery Partner Admin Updates
  updateDeliveryPartner: (
    dpUserId: string,
    profileData: {
      fullName?: string;
      vehicleType?: 'bicycle' | 'scooter' | 'motorcycle' | 'car';
      licenseNumber?: string;
      bankAccountDetails?: {
        accountNumber: string;
        ifscCode: string;
        accountHolderName: string;
        bankName: string;
      };
    }
  ) => apiRequest(`/admin/delivery-partners/${dpUserId}`, {
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
  updateDeliveryPartnerOnlineStatus: (
    dpId: string,
    isOnline: boolean
  ) => apiRequest<{ message: string; dp: any }>(`/admin/delivery-partners/${dpId}/online-status`, {
    method: 'PUT',
    body: JSON.stringify({ isOnline }),
  }),
  updateOrderStatus: (
    orderId: string,
    newStatus: AdminOrderStatus,
    deliveryPartnerId?: string
  ) =>
    apiRequest<{ message: string; order: any }>(
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
    apiRequest<{ message: string; updated: any[]; changedKeys: string[]; changedSettings: Record<string, string> }>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    }),
  // Finance Management
  getRestaurantFinancialSummary: (restaurantIds?: string[], startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (restaurantIds && restaurantIds.length > 0) {
      params.append('restaurantIds', restaurantIds.join(','));
    }
    if (startDate) {
      params.append('startDate', startDate);
    }
    if (endDate) {
      params.append('endDate', endDate);
    }
    return apiRequest<any[]>(`/admin/finance/restaurants${params.toString() ? `?${params.toString()}` : ''}`);
  },
  getDeliveryPartnerFinancialSummary: (deliveryPartnerIds?: string[], startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (deliveryPartnerIds && deliveryPartnerIds.length > 0) {
      params.append('deliveryPartnerIds', deliveryPartnerIds.join(','));
    }
    if (startDate) {
      params.append('startDate', startDate);
    }
    if (endDate) {
      params.append('endDate', endDate);
    }
    return apiRequest<any[]>(`/admin/finance/delivery-partners${params.toString() ? `?${params.toString()}` : ''}`);
  },
  // Image Upload
  uploadRestaurantImage: async (file: File): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = getAuthToken();
    const headers: HeadersInit = {
      'x-api-key': API_KEY,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/upload/restaurant`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    
    return response.json();
  },
  uploadSurpriseBagImage: async (file: File): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = getAuthToken();
    const headers: HeadersInit = {
      'x-api-key': API_KEY,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/upload/surprise-bag`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    
    return response.json();
  },
};
