"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export function useRequireAuth() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = !!accessToken;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);
}
