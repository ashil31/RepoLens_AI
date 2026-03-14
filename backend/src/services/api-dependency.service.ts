/**
 * Extracts API call → route file dependencies for MERN/Express architectures.
 * Connects frontend (axios, fetch) to backend (router.get/post/put/delete).
 */

export interface ApiPathMatch {
  path: string;
  filePath: string;
}

/**
 * Normalize API path for matching: remove domain, query, trailing slash, leading slash.
 */
function normalizePath(raw: string): string {
  let s = raw.trim();
  // Remove protocol and domain
  s = s.replace(/^https?:\/\/[^/]+/, "");
  // Remove query string
  s = s.replace(/\?.*$/, "");
  // Remove trailing slash, ensure leading slash for consistency
  s = s.replace(/\/+$/, "") || "/";
  if (!s.startsWith("/")) s = "/" + s;
  return s;
}

/**
 * Extract API paths from frontend code (axios, fetch).
 * Returns normalized paths like /api/ride, /captain/login.
 */
export function extractApiPathsFromContent(content: string): string[] {
  const paths = new Set<string>();

  // axios.get("/path"), axios.post("/path", ...), axios.put, axios.delete, axios.patch
  const axiosRe =
    /axios\.(get|post|put|delete|patch)\s*\(\s*[`'"]([^`'"]+)[`'"]/g;
  let m: RegExpExecArray | null;
  while ((m = axiosRe.exec(content)) !== null) {
    paths.add(normalizePath(m[2]));
  }

  // fetch("/path"), fetch(`/path`)
  const fetchRe = /fetch\s*\(\s*[`'"]([^`'"]+)[`'"]/g;
  while ((m = fetchRe.exec(content)) !== null) {
    paths.add(normalizePath(m[1]));
  }

  // fetch with template literal (partial): fetch(`/api/ride/${id}`) -> /api/ride
  const fetchTemplateRe = /fetch\s*\(\s*`([^`$]+)/g;
  while ((m = fetchTemplateRe.exec(content)) !== null) {
    paths.add(normalizePath(m[1]));
  }

  // axios with template literal
  const axiosTemplateRe =
    /axios\.(get|post|put|delete|patch)\s*\(\s*`([^`$]+)/g;
  while ((m = axiosTemplateRe.exec(content)) !== null) {
    paths.add(normalizePath(m[2]));
  }

  // Common pattern: api.get("/path") - custom axios instance
  const apiInstanceRe =
    /(?:api|axios|http)\.(get|post|put|delete|patch)\s*\(\s*[`'"]([^`'"]+)[`'"]/g;
  while ((m = apiInstanceRe.exec(content)) !== null) {
    paths.add(normalizePath(m[2]));
  }

  return Array.from(paths);
}

/**
 * Extract route definitions from backend route files.
 * Handles: router.get("/path", ...), app.get("/path", ...), router.post, etc.
 * Returns { path, filePath } for each route.
 */
export function extractRoutePathsFromContent(
  content: string,
  filePath: string
): ApiPathMatch[] {
  const matches: ApiPathMatch[] = [];

  // router.get("/path", ...), router.post("/path", ...), app.get, app.post
  const routeRe =
    /(?:router|app|express)\.(get|post|put|delete|patch|use)\s*\(\s*[`'"]([^`'"]+)[`'"]/g;
  let m: RegExpExecArray | null;
  while ((m = routeRe.exec(content)) !== null) {
    matches.push({ path: normalizePath(m[2]), filePath });
  }

  // Template literal: router.get(`/path`, ...)
  const routeTemplateRe =
    /(?:router|app|express)\.(get|post|put|delete|patch|use)\s*\(\s*`([^`$]+)/g;
  while ((m = routeTemplateRe.exec(content)) !== null) {
    matches.push({ path: normalizePath(m[2]), filePath });
  }

  // router.route("/path").get(...).post(...)
  const routeMethodRe =
    /(?:router|app)\.route\s*\(\s*[`'"]([^`'"]+)[`'"]\s*\)/g;
  while ((m = routeMethodRe.exec(content)) !== null) {
    matches.push({ path: normalizePath(m[1]), filePath });
  }

  return matches;
}

/**
 * Check if a file is likely a frontend file (client-side API caller).
 * Excludes backend route files.
 */
export function isFrontendFile(path: string): boolean {
  if (isRouteFile(path)) return false;
  const lower = path.toLowerCase();
  return (
    lower.includes("client/") ||
    lower.includes("frontend/") ||
    lower.includes("components/") ||
    lower.includes("pages/") ||
    lower.includes("views/") ||
    /\.(jsx|tsx)$/.test(lower) ||
    (lower.includes("src/") && !lower.includes("routes/") && !lower.includes("server/"))
  );
}

/**
 * Check if a file is likely a backend route file.
 * Avoids matching frontend router files (e.g. router.js, Router.tsx).
 */
export function isRouteFile(path: string): boolean {
  const lower = path.toLowerCase();
  return (
    lower.includes("routes/") ||
    lower.endsWith(".routes.js") ||
    lower.endsWith(".routes.ts") ||
    /route[s]?\.(js|ts)$/.test(lower) // route.js, routes.ts at end of path
  );
}

/**
 * Generate path variants for matching (handles /api prefix mismatch).
 * Frontend often calls /api/ride/create while backend defines /ride/create (mounted at /api).
 */
function getApiPathVariants(apiPath: string): string[] {
  const variants = new Set<string>([apiPath]);
  if (apiPath.startsWith("/api/")) {
    variants.add(apiPath.slice(4) || "/"); // /ride/create
    const parts = apiPath.slice(5).split("/").filter(Boolean);
    if (parts.length > 0) variants.add("/" + parts[0]); // /ride
  }
  return Array.from(variants);
}

/**
 * Match an API path to a route file.
 * Uses prefix matching and path variants for /api prefix mismatch.
 */
function findRouteForApiPath(
  apiPath: string,
  routeMatches: ApiPathMatch[]
): string | null {
  const variants = getApiPathVariants(apiPath);

  for (const v of variants) {
    const exact = routeMatches.find((r) => r.path === v);
    if (exact) return exact.filePath;
  }

  // Prefix match: route /ride matches apiPath /api/ride/create (via variant /ride)
  for (const v of variants) {
    const byPrefix = routeMatches
      .filter((r) => v.startsWith(r.path) || r.path.startsWith(v))
      .sort((a, b) => b.path.length - a.path.length);
    if (byPrefix[0]) return byPrefix[0].filePath;
  }

  return null;
}

export interface ApiDependency {
  sourcePath: string;
  targetPath: string;
}

/**
 * Build API edges: frontend file → route file.
 */
export function buildApiDependencies(
  parsedFiles: { path: string; content: string; meta?: { imports: string[] } }[]
): ApiDependency[] {
  const routeMatches: ApiPathMatch[] = [];
  const dependencies: ApiDependency[] = [];
  const seenEdges = new Set<string>();

  const allPaths = new Set(parsedFiles.map((f) => f.path));

  // 1. Collect all route definitions (from any file that defines routes)
  for (const file of parsedFiles) {
    const matches = extractRoutePathsFromContent(file.content, file.path);
    routeMatches.push(...matches);
  }

  if (routeMatches.length === 0) return dependencies;

  // 2. For each frontend file, find API calls and map to route files
  for (const file of parsedFiles) {
    if (!isFrontendFile(file.path)) continue;

    const apiPaths = extractApiPathsFromContent(file.content);
    for (const apiPath of apiPaths) {
      const routeFilePath = findRouteForApiPath(apiPath, routeMatches);
      if (!routeFilePath || !allPaths.has(routeFilePath)) continue;

      const key = `${file.path}->${routeFilePath}`;
      if (seenEdges.has(key)) continue;
      seenEdges.add(key);

      dependencies.push({
        sourcePath: file.path,
        targetPath: routeFilePath,
      });
    }
  }

  return dependencies;
}
