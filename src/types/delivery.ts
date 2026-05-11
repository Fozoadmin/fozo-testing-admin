import type { BankAccountDetails } from './api';

export type DeliveryPartnerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type VehicleType = 'bicycle' | 'scooter' | 'motorcycle' | 'car';

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

export type DeliveryPartnerOption = Pick<DeliveryPartner, 'id' | 'fullName' | 'phoneNumber'>;
