import type { BankAccountDetails } from './api';
import type { RestaurantStatus } from './restaurants';

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
