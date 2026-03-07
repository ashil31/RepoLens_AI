/**
 * Fallbacks for current user display when API has not returned yet (loading or unauthenticated).
 * Real data comes from auth store + getMe() and workspace APIs.
 */

export const FALLBACK_DISPLAY_NAME = "User";
export const FALLBACK_EMAIL = "—";
export const FALLBACK_PLAN = "Hobby";

export function getDisplayName(): string {
  return FALLBACK_DISPLAY_NAME;
}

export function getEmail(): string {
  return FALLBACK_EMAIL;
}

export function getProjectsLabel(): string {
  return "My projects";
}

export function getWorkspacePlan(): string {
  return FALLBACK_PLAN;
}

export function getCurrentUser() {
  return {
    displayName: getDisplayName(),
    email: getEmail(),
    projectsLabel: getProjectsLabel(),
    workspacePlan: getWorkspacePlan(),
  };
}
