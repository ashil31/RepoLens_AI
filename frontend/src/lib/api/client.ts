/**
 * API client for backend. Uses credentials for refresh token cookie.
 * On 401, attempts refresh then retries the request once.
 */

const getBaseUrl = () =>
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1")
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

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

async function refreshToken(): Promise<string> {
  const res = await fetch(`${getBaseUrl()}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Session expired");
  }
  const data = await res.json();
  return data.accessToken;
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
  const url = path.startsWith("http") ? path : `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const token = getAccessToken?.() ?? null;

  const doFetch = async (tokenToUse: string | null): Promise<Response> => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string>),
    };
    if (tokenToUse) (headers as Record<string, string>)["Authorization"] = `Bearer ${tokenToUse}`;

    return fetch(url, {
      ...init,
      headers,
      credentials: "include",
    });
  };

  let res = await doFetch(token);

  if (res.status === 401 && !skipRefresh && token) {
    try {
      const newToken = await refreshToken();
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
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
