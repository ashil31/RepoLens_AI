"use client";

import { create } from "zustand";
import type { Profile } from "@/types/user";

interface ProfileState {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  updateProfile: (patch: Partial<Profile>) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  updateProfile: (patch) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...patch } : null,
    })),
}));
