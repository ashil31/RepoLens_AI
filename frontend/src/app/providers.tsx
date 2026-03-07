"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { setAuthTokenGetter, setOnRefreshSuccess, setOnRefreshFailure } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  useEffect(() => {
    setAuthTokenGetter(() => useAuthStore.getState().accessToken);
    setOnRefreshSuccess((token) => useAuthStore.getState().setAccessToken(token));
    setOnRefreshFailure(() => useAuthStore.getState().clearAuth());
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
        themes={["light", "dark", "system", "pure-light", "classic-dark"]}
      >
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
