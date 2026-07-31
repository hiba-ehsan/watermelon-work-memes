const API_URL = process.env.API_URL || 'http://localhost:4000';

interface ApiOptions {
  path: string;
  method?: string;
  body?: unknown;
  accessToken?: string;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiClient<T = unknown>(options: ApiOptions): Promise<T> {
  const { path, method = 'GET', body, accessToken } = options;

  const headers: Record<string, string> = {};
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      data?.error || data?.message || res.statusText,
      res.status,
    );
  }

  return data as T;
}
