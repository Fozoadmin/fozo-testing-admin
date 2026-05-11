import type { OrderStatus } from '@/constants/orderStatus';

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
  operatingHours?: Record<string, {
    openTime?: string;
    closeTime?: string;
    isClosed?: boolean;
  }>;
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

export type ApiMutationResponse = {
  message?: string;
  changedKeys?: string[];
  [key: string]: unknown;
};

export type BankAccountDetails = {
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  bankName?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
  bank_name?: string;
};

export type RestaurantStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'closed';

export type DeliveryPartnerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type VehicleType = 'bicycle' | 'scooter' | 'motorcycle' | 'car';

export type AdminUser = User;

export type DeliveryPartner = {
  id: string;
  deliveryPartnerId?: string;
  userId: string;
  fullName: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  status?: DeliveryPartnerStatus;
  documentsVerified?: boolean;
  isOnline?: boolean;
  vehicleType?: VehicleType;
  licenseNumber?: string | null;
  bankAccountDetails?: BankAccountDetails | null;
  totalDeliveries?: number;
  averageRating?: number | string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type GroceryStoreStatus = RestaurantStatus;

export type GroceryStore = {
  id: string;
  user_id?: string;
  store_name?: string;
  storeName?: string;
  contact_person_name?: string | null;
  contactPersonName?: string | null;
  fssai_license_number?: string | null;
  gstin_number?: string | null;
  description?: string | null;
  image_url?: string | null;
  status?: GroceryStoreStatus;
  documents_verified?: boolean;
  is_approved?: boolean;
  bank_account_details?: BankAccountDetails | null;
  average_rating?: number | string | null;
};

export type GroceryUnit = 'piece' | 'kg' | 'g' | 'l' | 'ml' | 'dozen' | 'pack';

export type GroceryItem = {
  id: string;
  store_id: string;
  store_name?: string;
  item_name: string;
  category?: string;
  description?: string | null;
  image_url?: string | null;
  price?: number | string;
  mrp?: number | string;
  unit?: GroceryUnit;
  quantity_available?: number;
  total_quantity_listed?: number;
  is_active?: boolean;
  is_in_stock?: boolean;
};

export type Coupon = {
  id: string;
  code: string;
  discountType: 'flat' | 'percentage';
  discountValue: number;
  restaurantId: string | null;
  restaurantName?: string | null;
  groceryStoreId: string | null;
  groceryStoreName?: string | null;
  applicableTo: 'restaurant' | 'grocery' | 'both';
  minOrderValue: number;
  maxDiscountAmount: number | null;
  usageLimit: number;
  usageCount: number;
  expiresAt: string | null;
  isActive: boolean;
  visibility: boolean;
  createdAt: string;
};

export type NotificationTargetType =
  | 'all'
  | 'specific'
  | 'all_customers'
  | 'all_restaurants'
  | 'all_delivery_partners';

export type AdminNotificationTarget = {
  id: string;
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  userType?: string;
};

export type AdminNotification = {
  id: number;
  title: string;
  description?: string | null;
  scheduled_at?: string | null;
  sent_at?: string | null;
  target_type: NotificationTargetType;
  targets?: AdminNotificationTarget[];
  created_at?: string;
  created_by_name?: string | null;
  status?: string;
};

export type AdminOrder = {
  id: string;
  orderId?: string;
  customerId: string;
  restaurantId: string;
  deliveryPartnerId: string | null;
  totalBagAmount: string;
  deliveryFee: string;
  platformCommission: string;
  totalPaymentAmount: string;
  total_amount?: string;
  discountAmount: string;
  couponCode: string | null;
  walletAmountUsed: string;
  finalAmountPaid: string | null;
  deliveryAddressSnapshot: string;
  deliveryLatitude: string;
  deliveryLongitude: string;
  customerNameSnapshot: string | null;
  customerPhoneSnapshot: string;
  customerEmailSnapshot: string | null;
  notesToRestaurant: string | null;
  orderStatus: OrderStatus;
  paymentStatus: 'paid' | 'pending' | 'failed';
  paymentTransactionId: string | null;
  paymentMethod: string | null;
  orderDate: string;
  restaurantConfirmedAt: string | null;
  deliveryPartnerAssignedAt: string | null;
  pickupTimeSlotStart: string | null;
  pickupTimeSlotEnd: string | null;
  expectedDeliveryTime: string | null;
  actualDeliveryTime: string | null;
  cancellationReason: string | null;
  cancelledByUserType: string | null;
  createdAt: string;
  updatedAt: string;
  customerName: string | null;
  customerPhone: string | null;
  restaurantName: string | null;
  restaurantContactPerson: string | null;
  deliveryPartnerName: string | null;
  deliveryPartnerPhone: string | null;
  items: Array<{
    bagId: string;
    bagName: string;
    bagIsVegetarian: boolean;
    quantity: number;
    pricePaid: number;
    actualWorth: number;
    co2SavedKg: number;
  }>;
};

export type GroceryOrder = {
  id: string;
  customerId: string;
  storeId: string;
  deliveryPartnerId: string | null;
  storeNameSnapshot: string;
  storeImage: string | null;
  totalItemsAmount: string;
  deliveryCharge: string;
  handlingCharge: string;
  platformCommission: string;
  gstAmount: string;
  discountAmount: string;
  totalPaymentAmount: string;
  deliveryAddressSnapshot: string | null;
  orderStatus: string;
  order_status?: string;
  paymentMethod: string | null;
  paymentStatus: string;
  customerNameSnapshot: string | null;
  customerName: string | null;
  customerPhone: string | null;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    groceryItemId: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
};

export type FinancialOrder = {
  orderId: string;
  customerName?: string | null;
  customerPhone?: string | null;
  restaurantName?: string | null;
  orderStatus: string;
  paymentStatus?: string;
  bagAmount?: number | string;
  totalBagAmount?: number | string;
  deliveryFee?: number | string;
  totalAmount?: number | string;
  totalPaymentAmount?: number | string;
  orderDate?: string;
  createdAt?: string;
};

export type RestaurantFinancialSummary = {
  restaurantId: string;
  restaurantName: string;
  restaurantPhone?: string | null;
  totalOrders: number;
  paidOrders?: number;
  deliveredOrders?: number;
  cancelledOrders?: number;
  totalRevenue?: number;
  totalBagAmount?: number;
  totalDeliveryFee?: number;
  totalPlatformCommission?: number;
  totalPaymentAmount?: number;
  orders?: FinancialOrder[];
};

export type DeliveryPartnerFinancialSummary = {
  deliveryPartnerId: string;
  deliveryPartnerName: string;
  deliveryPartnerPhone?: string | null;
  vehicleType?: string | null;
  isOnline?: boolean;
  totalOrders: number;
  paidOrders?: number;
  deliveredOrders?: number;
  cancelledOrders?: number;
  totalEarnings?: number;
  totalDeliveryFee?: number;
  totalDeliveryFeeEarned?: number;
  totalOrderValue?: number;
  averageRating?: number | string | null;
  orders?: FinancialOrder[];
};

// Socket Event Callback Types
export type SocketEventCallback<T = unknown> = (data: T) => void;
