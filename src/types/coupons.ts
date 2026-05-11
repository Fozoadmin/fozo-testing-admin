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
