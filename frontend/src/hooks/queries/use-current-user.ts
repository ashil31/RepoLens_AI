"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryKeys } from "@/lib/query-keys";
import { getMe } from "@/services/auth.service";
import type { CurrentUser } from "@/types/user";
import { getDisplayName, getEmail, getProjectsLabel, getWorkspacePlan } from "@/lib/user";
import { useAuthStore } from "@/store/auth-store";

/** Shape returned to components (query data or fallback) */
export interface CurrentUserState {
  displayName: string;
  email: string;
  projectsLabel: string;
  workspacePlan: string;
  initial: string;
}

function toState(user: CurrentUser | null): CurrentUserState {
  const displayName = user?.displayName ?? getDisplayName();
  const email = user?.email ?? getEmail();
  const projectsLabel = user ? `${user.displayName}'s projects` : getProjectsLabel();
  const workspacePlan = user?.workspacePlan ?? getWorkspacePlan();
  return {
    displayName,
    email,
    projectsLabel,
    workspacePlan,
    initial: displayName.charAt(0).toUpperCase(),
  };
}

function mapMeToCurrentUser(data: Awaited<ReturnType<typeof getMe>> | undefined): CurrentUser | null {
  if (!data?.user) return null;
  const u = data.user;
  return {
    id: u.id,
    email: u.email,
    displayName: u.fullName?.trim() || u.email?.split("@")[0] || "User",
    workspacePlan: "Hobby",
    avatarUrl: (u as { profileImage?: string | null }).profileImage ?? null,
  };
}

export function useCurrentUser() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const isAuthenticated = !!accessToken;
  const query = useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: getMe,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const user = mapMeToCurrentUser(query.data);

  useEffect(() => {
    if (query.data?.user) {
      const u = query.data.user;
      setUser({
        id: u.id,
        email: u.email,
        credits: u.credits,
        fullName: u.fullName ?? null,
        username: u.username ?? null,
      });
    }
  }, [query.data, setUser]);

  return {
    ...query,
    user: toState(user ?? null),
    currentUser: user,
  };
}
