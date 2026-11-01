export type UserRole = 'ADMIN' | 'EMPLOYEE';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  /** Linked employee id for EMPLOYEE users, absent for admins. */
  employeeId?: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresInMs: number;
  user: AuthUser;
}
