
export interface CreateUserData {
    username: string;
    email: string;
    password: string;
  }

export interface RegisterRequest {
    username: string;
    password: string;
    email: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}