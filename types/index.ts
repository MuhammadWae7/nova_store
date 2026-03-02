export type UserRole = 'admin' | 'customer';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export type Currency = 'EGP'; // Default currency for this store

export interface Price {
  amount: number;
  currency: Currency;
}
