/**
 * API client: access token in localStorage (via auth store), refresh token in httpOnly cookie.
 * - Protected calls (non-auth): only Authorization: Bearer <accessToken>; no cookie sent.
 * - Auth calls (/auth/*): credentials: "include" so refresh & logout receive the cookie.
 * On 401, attempts refresh (cookie sent only to /auth/refresh) then retries once.
 * Only one refresh runs at a time; concurrent 401s wait for the same refresh and then retry.
 */

const getBaseUrl = () =>
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1")
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const isAuthPath = (path: string) => {
  const p = path.startsWith("/") ? path : `/${path}`;
  return p.startsWith("/auth");
};

let getAccessToken: (() => string | null) | null = null;
let onRefreshSuccess: ((token: string) => void) | null = null;
let onRefreshFailure: (() => void) | null = null;

export function setAuthTokenGetter(fn: () => string | null) {
  getAccessToken = fn;
}

export function setOnRefreshSuccess(fn: (token: string) => void) {
  onRefreshSuccess = fn;
}

export function setOnRefreshFailure(fn: () => void) {
  onRefreshFailure = fn;
}

let refreshPromise: Promise<string> | null = null;

/**
 * Attempts to refresh the access token using the httpOnly refresh cookie.
 * Updates the auth store on success; calls onRefreshFailure on error.
 * Used by chat service and other raw fetch calls that bypass the api client.
 */
export async function tryRefreshToken(): Promise<string | null> {
  try {
    const token = await refreshAccessToken();
    onRefreshSuccess?.(token);
    return token;
  } catch {
    onRefreshFailure?.();
    return null;
  }
}

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${getBaseUrl()}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Session expired");
      }
      const data = await res.json();
      return data.accessToken;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  code?: string;
}

export class ApiClientError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { skipRefresh?: boolean } = {}
): Promise<T> {
  const { skipRefresh, ...init } = options;
  const url = path.startsWith("http")
    ? path
    : `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const doFetch = (token: string | null): Promise<Response> => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string>),
    };
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
    return fetch(url, {
      ...init,
      headers,
      credentials: isAuthPath(path) ? "include" : "omit",
    });
  };

  const token = getAccessToken?.() ?? null;
  let res = await doFetch(token);

  if (res.status === 401 && !skipRefresh) {
    try {
      const newToken = await refreshAccessToken();
      onRefreshSuccess?.(newToken);
      res = await doFetch(newToken);
    } catch (e) {
      onRefreshFailure?.();
      if (e instanceof ApiClientError) throw e;
      throw e;
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiClientError(
      data?.message || res.statusText || "Request failed",
      res.status,
      data?.code
    );
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
