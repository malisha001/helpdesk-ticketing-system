
import { apiClient } from "./apiClient";
import type { AuthUser } from "@/lib/auth";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: Pick<AuthUser, "id" | "name" | "email"> & {
    role: "customer";
  };
}

export interface LogoutResponse {
  success: boolean;
  serverRevoked: boolean;
  message: string;
}

export async function login(
  credentials: LoginCredentials
): Promise<LoginResponse> {

  const response = await apiClient.post<LoginResponse>(
    "/auth/login",
    credentials
  );

  return response.data;
}

export async function logout(): Promise<LogoutResponse> {
  const response = await apiClient.post<LogoutResponse>(
    "/auth/logout"
  );

  return response.data;
}

export async function register(
  credentials: RegisterCredentials
): Promise<RegisterResponse> {
  const response = await apiClient.post<RegisterResponse>(
    "/auth/register",
    credentials
  );

  return response.data;
}

export async function getMe(): Promise<AuthUser> {
  const response = await apiClient.get<AuthUser>("/auth/me");
  return response.data;
}
