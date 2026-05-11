export const GROCERY_STORE_STATUS_COLORS: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  approved: 'default',
  pending: 'secondary',
  rejected: 'destructive',
  suspended: 'destructive',
  closed: 'outline',
};

export const emptyGroceryStoreForm = {
  fullName: '',
  email: '',
  phoneNumber: '',
  password: '',
  storeName: '',
  contactPersonName: '',
  fssaiLicenseNumber: '',
  gstinNumber: '',
  description: '',
};

export const emptyBankDetailsForm = {
  accountNumber: '',
  ifscCode: '',
  accountHolderName: '',
  bankName: '',
};

export const emptyGroceryStoreEditForm = {
  storeName: '',
  contactPersonName: '',
  fssaiLicenseNumber: '',
  gstinNumber: '',
  description: '',
  imageUrl: '',
  status: 'pending' as GroceryStoreStatus,
  documentsVerified: false,
  isApproved: false,
};
import type { GroceryStoreStatus } from '@/types';
