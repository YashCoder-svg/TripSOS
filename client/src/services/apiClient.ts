import type { User } from '../types/user';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
const sessionExpiredEvent = 'tripsos:session-expired';

type ApiEnvelope<T> = { success: true; data: T } | { success: false; error: ApiErrorBody };
type ApiErrorBody = { code?: string; message?: string };

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let accessToken: string | null = null;
let refreshInFlight: Promise<SessionRefreshData> | null = null;

export type SessionRefreshData =
  { authenticated: true; accessToken: string; user: User } | { authenticated: false };

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

function notifySessionExpired(): void {
  setAccessToken(null);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(sessionExpiredEvent));
}

function apiError(payload: unknown, status: number): ApiError {
  const body = payload as { error?: ApiErrorBody } | null;
  return new ApiError(
    body?.error?.message ?? 'Unable to complete your request.',
    status,
    body?.error?.code ?? 'REQUEST_FAILED',
  );
}

async function requestEnvelope<T>(path: string, init?: RequestInit, token = accessToken) {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      credentials: 'include',
    });
  } catch {
    throw new ApiError(
      'Unable to connect. Check your connection and try again.',
      0,
      'NETWORK_ERROR',
    );
  }

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !payload || payload.success === false) {
    throw apiError(payload, response.status);
  }
  return payload.data;
}

export function refreshSession(): Promise<SessionRefreshData> {
  if (!refreshInFlight) {
    refreshInFlight = requestEnvelope<SessionRefreshData>('/auth/refresh', { method: 'POST' }, null)
      .then((result) => {
        setAccessToken(result.authenticated ? result.accessToken : null);
        return result;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export function clearSession(): void {
  notifySessionExpired();
}

function isAuthEndpoint(path: string): boolean {
  return ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'].includes(path);
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const tokenAtRequest = accessToken;
  try {
    return await requestEnvelope<T>(path, init, tokenAtRequest);
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      error.status !== 401 ||
      isAuthEndpoint(path) ||
      !tokenAtRequest
    ) {
      throw error;
    }
    try {
      const refreshed = await refreshSession();
      if (!refreshed.authenticated) throw new ApiError('Session expired.', 401, 'SESSION_EXPIRED');
    } catch {
      notifySessionExpired();
      throw new ApiError('Your session has expired. Please sign in again.', 401, 'SESSION_EXPIRED');
    }
    try {
      return await requestEnvelope<T>(path, init, accessToken);
    } catch (retryError) {
      if (retryError instanceof ApiError && retryError.status === 401) {
        notifySessionExpired();
        throw new ApiError(
          'Your session has expired. Please sign in again.',
          401,
          'SESSION_EXPIRED',
        );
      }
      throw retryError;
    }
  }
}

export function addSessionExpiredListener(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener(sessionExpiredEvent, listener);
  return () => window.removeEventListener(sessionExpiredEvent, listener);
}
