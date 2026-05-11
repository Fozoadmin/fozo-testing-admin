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
