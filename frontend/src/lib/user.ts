/**
 * Current user and workspace display data.
 *
 * FALLBACK: Values come from config constants. When auth/API is ready,
 * replace this module (e.g. with a hook or context that fetches user/workspace)
 * and keep the same exports so components don't need to change.
 */

import {
  USER_DISPLAY_NAME as FALLBACK_DISPLAY_NAME,
  USER_EMAIL as FALLBACK_EMAIL,
  WORKSPACE_PLAN as FALLBACK_PLAN,
} from "@/config";

export function getDisplayName(): string {
  return FALLBACK_DISPLAY_NAME;
}

export function getEmail(): string {
  return FALLBACK_EMAIL;
}

export function getProjectsLabel(): string {
  return `${FALLBACK_DISPLAY_NAME}'s projects`;
}

export function getWorkspacePlan(): string {
  return FALLBACK_PLAN;
}

/** Single object for convenience; replace with API response shape later */
export function getCurrentUser() {
  return {
    displayName: getDisplayName(),
    email: getEmail(),
    projectsLabel: getProjectsLabel(),
    workspacePlan: getWorkspacePlan(),
  };
}
