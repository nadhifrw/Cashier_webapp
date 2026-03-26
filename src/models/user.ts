export interface User {
  id?: string;
  email: string;
  username: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export type UserRole = 'admin' | 'cashier' | 'manager';

export interface CreateUserInput {
  email: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface UpdateUserInput {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}
