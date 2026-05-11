import { ORDER_STATUS, type OrderStatus } from '@/constants/orderStatus';
import type { AdminOrder } from '@/types';

export const GROCERY_STATUS_OPTIONS = [
  'all',
  'placed',
  'confirmed',
  'ready_for_pickup',
  'out_for_delivery',
  'delivered',
  'cancelled_user',
  'cancelled_store',
] as const;

export type GroceryOrderStatus = (typeof GROCERY_STATUS_OPTIONS)[number];

export const groceryStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    placed: 'Placed',
    confirmed: 'Confirmed',
    ready_for_pickup: 'Ready for Pickup',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled_user: 'Cancelled by User',
    cancelled_store: 'Cancelled by Store',
    all: 'All Statuses',
  };
  return labels[status] ?? status;
};

export const groceryStatusVariant = (status: string) => {
  if (!status) return 'outline' as const;
  if (status === 'delivered') return 'default' as const;
  if (status.startsWith('cancelled')) return 'destructive' as const;
  if (['out_for_delivery', 'ready_for_pickup', 'confirmed', 'placed'].includes(status))
    return 'secondary' as const;
  return 'outline' as const;
};

export const orderStatusVariant = (status: AdminOrder['orderStatus']) => {
  switch (status) {
    case ORDER_STATUS.DELIVERED:
      return 'default' as const;
    case ORDER_STATUS.CANCELLED_BY_USER:
    case ORDER_STATUS.CANCELLED_BY_RESTAURANT:
    case ORDER_STATUS.CANCELLED_BY_ADMIN:
    case ORDER_STATUS.REFUNDED:
      return 'destructive' as const;
    case ORDER_STATUS.OUT_FOR_DELIVERY:
    case ORDER_STATUS.READY_FOR_PICKUP:
    case ORDER_STATUS.CONFIRMED:
    case ORDER_STATUS.PLACED:
      return 'secondary' as const;
    default:
      return 'outline' as const;
  }
};

export const ORDER_STATUS_OPTIONS: Array<OrderStatus | 'all'> = [
  'all',
  ORDER_STATUS.PLACED,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.READY_FOR_PICKUP,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.CANCELLED_BY_USER,
  ORDER_STATUS.CANCELLED_BY_RESTAURANT,
  ORDER_STATUS.CANCELLED_BY_ADMIN,
  ORDER_STATUS.REFUNDED,
];
