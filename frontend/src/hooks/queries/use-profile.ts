"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getProfile, updateProfile as updateProfileApi } from "@/services/profile.service";
import type { Profile } from "@/types/user";
import { useProfileStore } from "@/store/profile-store";
import { useEffect } from "react";

function mapProfile(p: Profile): Profile {
  return {
    ...p,
    fullName: p.fullName ?? "",
    username: p.username ?? "",
    avatarUrl: p.profileImage ?? p.avatarUrl,
  };
}

export function useProfile() {
  const queryClient = useQueryClient();
  const setProfile = useProfileStore((s) => s.setProfile);
  const query = useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const res = await getProfile();
      return mapProfile(res.data);
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data) setProfile(query.data);
  }, [query.data, setProfile]);

  return query;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setProfile = useProfileStore((s) => s.setProfile);
  return useMutation({
    mutationFn: (data: { fullName?: string; username?: string; profileImage?: string }) =>
      updateProfileApi(data),
    onSuccess: (res) => {
      const profile = mapProfile(res.data);
      setProfile(profile);
      queryClient.setQueryData(queryKeys.profile, profile);
    },
  });
}

export type { Profile };
