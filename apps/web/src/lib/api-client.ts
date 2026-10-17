// ============================================
// Net-On — API Client
// ============================================
// Centralized API client for making authenticated
// requests to the NestJS backend.
// ============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  timestamp: string;
}

class ApiError extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    message: string,
    public details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Get the stored access token.
 */
function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('neton_access_token');
}

/**
 * Build URL with query parameters.
 */
function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

/**
 * Make an API request.
 */
export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, headers = {}, params } = options;
  const url = buildUrl(path, params);
  const token = getAccessToken();

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      statusCode: response.status,
      error: response.statusText,
      message: 'An error occurred',
    }));

    throw new ApiError(
      errorData.statusCode || response.status,
      errorData.error || response.statusText,
      errorData.message || 'An error occurred',
      errorData.details,
    );
  }

  const data: ApiResponse<T> = await response.json();
  return data.data;
}

/**
 * API helper methods.
 */
export const api = {
  get: <T>(path: string, params?: Record<string, string | number | boolean | undefined>) =>
    apiRequest<T>(path, { method: 'GET', params }),

  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: 'POST', body }),

  put: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: 'PUT', body }),

  patch: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: 'PATCH', body }),

  delete: <T>(path: string) =>
    apiRequest<T>(path, { method: 'DELETE' }),
};

export { ApiError };
