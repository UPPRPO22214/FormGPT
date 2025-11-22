export interface User {
  id: number;
  email: string;
  name?: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

export interface UpdateProfileRequest {
  email?: string;
  name?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

