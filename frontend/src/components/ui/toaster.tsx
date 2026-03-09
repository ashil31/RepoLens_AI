"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * Global toast container. Renders at bottom-right (Vercel-style).
 * Use the `toast` helper from `@/lib/toast` for success, error, warning, info.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "rounded-lg border border-border bg-card text-card-foreground shadow-lg",
          success: "border-green-500/30 bg-card",
          error: "border-destructive/50 bg-card",
          warning: "border-amber-500/50 bg-card",
          info: "border-primary/30 bg-card",
        },
      }}
      richColors={false}
      closeButton
      duration={4000}
    />
  );
}
