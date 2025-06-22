export type ApiResponse<T = void> = {
  status: 'success' | 'error';
  data?: T;
  error?: {
    message: string;
    code: string;
  };
};

export type UserResponse = {
  id: string;
  username: string;
  email: string;
  isVerified: boolean;
};

export type AuthResponse = {
  userId: string;
  accessToken: string;
};

export type AuthStatusResponse = {
  isAuthenticated: boolean;
  user?: UserResponse;
}; 