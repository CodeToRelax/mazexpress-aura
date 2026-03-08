export interface UserAddress {
  street?: string;
  specificDescription?: string;
  city: string;
  country: 'libya' | 'turkey' | 'china' | 'uae';
}

export interface UserPrivacyPolicy {
  usageAgreement: boolean;
}

export type UserType = 'admin' | 'customer';
export type Gender = 'male' | 'female';

export interface User {
  _id: string;
  firebaseId: string;
  username?: string;
  firstName: string;
  lastName: string;
  birthdate: string;
  address: UserAddress;
  gender: Gender;
  email: string;
  phoneNumber: string;
  userType: UserType;
  uniqueShippingNumber: string;
  privacyPolicy: UserPrivacyPolicy;
  walletId?: string | { _id: string; balance: number; currency: string; isActive: boolean };
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalDocs: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

export interface UsersListResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: Pagination;
    filters?: Record<string, any>;
  };
  message?: string;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'firstName' | 'lastName' | 'email' | 'userType' | 'balance';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  userType?: UserType;
  disabled?: boolean;
  gender?: Gender;
  city?: string;
  country?: 'libya' | 'turkey' | 'china' | 'uae';
  createdAfter?: string;
  createdBefore?: string;
}

export interface CreateUserData {
  firebaseId: string;
  username?: string;
  firstName: string;
  lastName: string;
  birthdate: string;
  address: UserAddress;
  gender: Gender;
  email: string;
  phoneNumber: string;
  userType: UserType;
  uniqueShippingNumber: string;
  privacyPolicy: UserPrivacyPolicy;
  walletId?: string;
}

export interface UpdateUserData {
  username?: string;
  firstName?: string;
  lastName?: string;
  birthdate?: string;
  address?: UserAddress;
  gender?: Gender;
  email?: string;
  phoneNumber?: string;
  userType?: UserType;
  uniqueShippingNumber?: string;
  disabled?: boolean;
  walletId?: string;
}
