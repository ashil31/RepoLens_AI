/**
 * User and workspace types. Align with API response shape.
 */

export interface CurrentUser {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  workspacePlan: string;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  role: "OWNER" | "MEMBER";
  user?: { id: string; email: string };
}

export interface Workspace {
  id: string;
  name: string;
  plan?: string;
  slug?: string;
  members?: WorkspaceMember[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Repository {
  id: string;
  name: string;
  owner?: string;
  fullName?: string;
  slug?: string;
  description?: string | null;
  language?: string | null;
  stars?: number | null;
  isPrivate?: boolean;
  repoUrl?: string | null;
  analyzedAt?: string;
  workspaceId?: string;
  files?: { id: string; path: string; language: string | null }[];
}

/** Profile for Settings page (from API). */
export interface Profile {
  id?: string;
  email: string;
  fullName: string | null;
  username: string | null;
  profileImage?: string | null;
  avatarUrl?: string | null; // UI alias for profileImage
}

/** Session from API (device, ip, createdAt, expiresAt). */
export interface Session {
  id: string;
  device: string | null;
  ip: string | null;
  createdAt: string;
  expiresAt: string;
  browser?: string;
  os?: string;
  isCurrent?: boolean;
  location?: string;
  lastActive?: string;
}

/** Helper: "displayName's projects" */
export function getProjectsLabel(displayName: string): string {
  return `${displayName}'s projects`;
}
