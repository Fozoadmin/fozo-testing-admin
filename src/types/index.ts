// User Types
export interface User {
  id: string;
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  userType: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

// Customer Types
export interface Customer {
  id: string;
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  userType: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

// Restaurant Types
export interface Restaurant {
  id: string;
  restaurantId: string;
  userId?: string;
  restaurantName: string;
  userEmail: string | null;
  phoneNumber: string | null;
  restaurantOwnerPhone: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'closed';
  documentsVerified: boolean;
  averageRating: number | string;
  imageUrl: string | null;
  description: string | null;
  whatYouGet: string | null;
  contactPersonName: string | null;
  fssaiLicenseNumber: string | null;
  gstinNumber: string | null;
  cuisines: Cuisine[];
  primaryLocation: RestaurantLocation | null;
  totalBags?: number;
  createdAt?: string;
  userFullName?: string | null;
  bankAccountDetails?: {
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
    bankName?: string;
  } | null;
}

export interface RestaurantLocation {
  locationId?: string;
  locationName: string;
  address: string;
  latitude: number;
  longitude: number;
  contactNumber?: string | null;
  email?: string | null;
}

export interface Cuisine {
  id: number;
  name: string;
  imageUrl?: string | null;
}

// Surprise Bag Types
export interface SurpriseBag {
  bagId: string;
  bagName: string;
  denominationValue: number;
  actualWorth: number;
  description: string | null;
  imageUrl: string | null;
  quantityAvailable: number;
  pickupStartTime: string | null;
  pickupEndTime: string | null;
  availableDate: string | null;
  isActive: boolean;
  isVegetarian: boolean;
  pickupTime?: string;
}

export interface GroupedRestaurant {
  restaurantId: string;
  id?: string;
  restaurantName: string;
  restaurantOwnerPhone: string | null;
  userEmail?: string | null;
  phoneNumber?: string | null;
  totalBags: number;
  bags: SurpriseBag[];
}

// API Error Types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// Socket Event Callback Types
export type SocketEventCallback<T = unknown> = (data: T) => void;
