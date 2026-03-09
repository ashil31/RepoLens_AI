"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import * as repositoryService from "@/services/repository.service";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store";

export default function GitHubCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [proceedAnyway, setProceedAnyway] = useState(false);
  const effectRan = useRef(false);

  const installationIdRaw = searchParams.get("installation_id");
  const state = searchParams.get("state"); // workspaceId passed from Connect button

  const workspaceId = state?.trim() || null;
  const installationId = installationIdRaw ? parseInt(installationIdRaw, 10) : null;

  // If persist doesn't rehydrate within 2.5s, proceed anyway so we don't stick on "Loading…"
  useEffect(() => {
    if (hasHydrated || status !== "idle") return;
    const t = setTimeout(() => setProceedAnyway(true), 2500);
    return () => clearTimeout(t);
  }, [hasHydrated, status]);

  const ready = hasHydrated || proceedAnyway;

  // Call install API once we have params and (rehydrated or timed out)
  useEffect(() => {
    if (!ready || status !== "idle" || effectRan.current) return;
    if (!workspaceId || !installationId || Number.isNaN(installationId)) {
      setStatus("error");
      setErrorMessage("Missing installation_id or state (workspace). Return to the app and try connecting again.");
      return;
    }
    if (!accessToken) {
      setStatus("error");
      setErrorMessage("Please log in first, then try connecting GitHub again.");
      return;
    }

    effectRan.current = true;
    setStatus("loading");

    repositoryService
      .installGitHub(workspaceId, installationId)
      .then(() => {
        setStatus("success");
        router.replace(`/dashboard/repositories?github=connected&workspace=${encodeURIComponent(workspaceId)}`);
      })
      .catch((err: Error & { statusCode?: number }) => {
        setStatus("error");
        if (err.statusCode === 401) {
          router.replace("/login");
          return;
        }
        setErrorMessage(err?.message || "Failed to connect GitHub.");
      });
  }, [ready, accessToken, workspaceId, installationId, status, router]);

  if (status === "error" && errorMessage) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="text-center text-muted-foreground">{errorMessage}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/repositories">Back to Repositories</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <p className="text-muted-foreground">
        {!hasHydrated
          ? "Loading…"
          : status === "success"
            ? "Redirecting…"
            : "Connecting your GitHub account…"}
      </p>
      {(!hasHydrated || status === "loading") && (
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      )}
    </div>
  );
}
