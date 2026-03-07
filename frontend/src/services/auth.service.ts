import { api } from "@/lib/api/client";
import type { AuthUser } from "@/store/auth-store";

export interface RegisterInput {
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  userId: string;
}

export interface VerifyOtpInput {
  userId: string;
  code: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface MeResponse {
  user: AuthUser & {
    fullName?: string | null;
    username?: string | null;
    profileImage?: string | null;
  };
}

export interface SessionItem {
  id: string;
  device: string | null;
  ip: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface SessionsResponse {
  sessions: SessionItem[];
  currentSessionId?: string | null;
}

export async function register(data: RegisterInput): Promise<RegisterResponse> {
  return api.post<RegisterResponse>("/auth/register", data);
}

export async function verifyOtp(data: VerifyOtpInput): Promise<{ message: string }> {
  return api.post("/auth/verify-otp", data);
}

export async function login(data: LoginInput): Promise<LoginResponse> {
  return api.post<LoginResponse>("/auth/login", data);
}

export async function logout(): Promise<{ message: string }> {
  return api.post("/auth/logout");
}

export async function getMe(): Promise<MeResponse> {
  return api.get<MeResponse>("/auth/me");
}

export async function getSessions(): Promise<SessionsResponse> {
  return api.get<SessionsResponse>("/auth/sessions");
}

export async function revokeSession(sessionId: string): Promise<{ message: string }> {
  return api.delete(`/auth/sessions/${sessionId}`);
}
