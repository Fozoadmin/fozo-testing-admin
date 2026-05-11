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

export type AdminUser = User;
