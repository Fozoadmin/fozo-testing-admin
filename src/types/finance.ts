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
