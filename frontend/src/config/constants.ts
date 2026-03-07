/**
 * App-wide constants. Use for display labels, default values, and config
 * that doesn't come from env or API.
 *
 * User/workspace values here are FALLBACKS. Real data will come from
 * auth/API later; lib/user.ts reads these for now and can be switched
 * to API without changing components.
 */

export const APP_NAME = "RepoLens";

/** Default workspace/plan label in UI (fallback until API) */
export const WORKSPACE_PLAN = "Hobby";

/** Fallback user display name (replace via lib/user when auth is wired) */
export const USER_DISPLAY_NAME = "ashil31";

/** Fallback user email (replace via lib/user when auth is wired) */
export const USER_EMAIL = "ashilpatel.aa134@gmail.com";

/** Derived label for "my projects" (used by lib/user getProjectsLabel()) */
export const USER_PROJECTS_LABEL = `${USER_DISPLAY_NAME}'s projects` as const;
