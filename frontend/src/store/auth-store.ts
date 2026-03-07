"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Auth state: access token in localStorage (via persist), refresh token in httpOnly cookie only.
 * API client sends Bearer accessToken and credentials: "include" for cookie; on 401 it refreshes using the cookie.
 */
export interface AuthUser {
  id: string;
  email: string;
  credits?: number;
  fullName?: string | null;
  username?: string | null;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  setAuth: (accessToken: string, user: AuthUser) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: AuthUser | null) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

const STORAGE_KEY = "repolens-auth";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      setAuth: (accessToken, user) => set({ accessToken, user }),
      setAccessToken: (token) => set({ accessToken: token }),
      setUser: (user) => set({ user }),
      clearAuth: () => set({ accessToken: null, user: null }),
      isAuthenticated: () => !!get().accessToken,
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({ accessToken: s.accessToken, user: s.user }),
    }
  )
);
