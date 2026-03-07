import { api } from "@/lib/api/client";
import type { Profile } from "@/types/user";

export interface ProfileResponse {
  data: Profile;
}

export interface UpdateProfileInput {
  fullName?: string;
  username?: string;
  profileImage?: string;
}

export interface UpdateProfileResponse {
  message: string;
  data: Profile;
}

export async function getProfile(): Promise<ProfileResponse> {
  return api.get<ProfileResponse>("/profile");
}

export async function updateProfile(data: UpdateProfileInput): Promise<UpdateProfileResponse> {
  return api.put<UpdateProfileResponse>("/profile", data);
}
