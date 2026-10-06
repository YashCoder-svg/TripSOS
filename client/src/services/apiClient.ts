const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    credentials: 'include',
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'error' in payload
        ? String((payload as { error?: { message?: unknown } }).error?.message ?? 'Request failed')
        : 'Request failed';
    throw new Error(message);
  }
  return payload as T;
}
