import type { BankAccountDetails } from './api';

export type RestaurantStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'closed';

export interface Restaurant {
  id: string;
  restaurantId: string;
  userId?: string;
  restaurantName: string;
  userEmail: string | null;
  phoneNumber: string | null;
  restaurantOwnerPhone: string | null;
  status: RestaurantStatus;
  documentsVerified: boolean;
  averageRating: number | string;
  imageUrl: string | null;
  isTopProduct?: boolean | null;
  topProductRanking?: number | null;
  showOnTop?: boolean | null;
  productRanking?: number | null;
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
  bankAccountDetails?: BankAccountDetails | null;
  operatingHours?: Record<
    string,
    {
      openTime?: string;
      closeTime?: string;
      isClosed?: boolean;
    }
  >;
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
