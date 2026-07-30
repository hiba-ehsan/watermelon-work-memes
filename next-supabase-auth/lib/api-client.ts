const API_URL = process.env.API_URL || 'http://localhost:4000';

interface ApiOptions {
  path: string;
  method?: string;
  body?: unknown;
  accessToken?: string;
}

export async function apiClient<T = unknown>(
  options: ApiOptions,
): Promise<T> {
  const { path, method = 'GET', body, accessToken } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}
