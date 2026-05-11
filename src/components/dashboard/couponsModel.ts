import type { Coupon } from '@/types';

export type RestaurantLite = {
  id?: string;
  restaurantId?: string;
  restaurantName?: string;
  status?: string;
  userEmail?: string;
  phoneNumber?: string;
};

export type GroceryStoreLite = {
  id: string;
  storeName: string;
  status?: string;
};

export type ApplicableTo = Coupon['applicableTo'];
export type DiscountType = Coupon['discountType'];

export const formatCouponDate = (iso: string | null) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};
