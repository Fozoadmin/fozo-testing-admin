/**
 * Enum for all possible order statuses in the application.
 * This matches the backend ORDER_STATUS enum to ensure consistency.
 */
export const ORDER_STATUS = {
  PLACED: 'placed',
  CONFIRMED: 'confirmed',
  READY_FOR_PICKUP: 'ready_for_pickup',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED_BY_USER: 'cancelled_user',
  CANCELLED_BY_RESTAURANT: 'cancelled_restaurant',
  CANCELLED_BY_ADMIN: 'cancelled_admin',
  REFUNDED: 'refunded',
} as const;

/**
 * Type for order status values
 */
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

/**
 * Array of all order status values
 */
export const ORDER_STATUS_VALUES = Object.values(ORDER_STATUS);

/**
 * Helper function to check if a status is any cancelled type
 */
export function isCancelledStatus(status: string): boolean {
  return (
    status === ORDER_STATUS.CANCELLED_BY_USER ||
    status === ORDER_STATUS.CANCELLED_BY_RESTAURANT ||
    status === ORDER_STATUS.CANCELLED_BY_ADMIN
  );
}

/**
 * Helper function to get a display-friendly label for a status
 */
export function getStatusLabel(status: OrderStatus): string {
  switch (status) {
    case ORDER_STATUS.PLACED:
      return 'Placed';
    case ORDER_STATUS.CONFIRMED:
      return 'Confirmed';
    case ORDER_STATUS.READY_FOR_PICKUP:
      return 'Ready for Pickup';
    case ORDER_STATUS.OUT_FOR_DELIVERY:
      return 'Out for Delivery';
    case ORDER_STATUS.DELIVERED:
      return 'Delivered';
    case ORDER_STATUS.CANCELLED_BY_USER:
      return 'Cancelled by User';
    case ORDER_STATUS.CANCELLED_BY_RESTAURANT:
      return 'Cancelled by Restaurant';
    case ORDER_STATUS.CANCELLED_BY_ADMIN:
      return 'Cancelled by Admin';
    case ORDER_STATUS.REFUNDED:
      return 'Refunded';
  }
}
