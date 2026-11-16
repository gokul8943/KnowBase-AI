export interface User {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  emailVerified: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}
