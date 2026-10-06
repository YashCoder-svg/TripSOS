import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, setAccessToken } from './apiClient';

function jsonResponse(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('API authentication client', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    setAccessToken(null);
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    setAccessToken(null);
    vi.unstubAllGlobals();
  });

  it('rotates once and retries an authenticated request with the new in-memory access token', async () => {
    setAccessToken('expired-access-token');
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(401, { success: false, error: { code: 'UNAUTHORIZED', message: 'Sign in.' } }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          success: true,
          data: { authenticated: true, accessToken: 'fresh-access-token', user: { id: '1' } },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, { success: true, data: { user: { id: '1', name: 'Taylor' } } }),
      );

    const result = await apiRequest<{ user: { id: string; name: string } }>('/users/me');

    expect(result.user.name).toBe('Taylor');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ credentials: 'include' });
    expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('Authorization')).toBe(
      'Bearer expired-access-token',
    );
    expect(new Headers(fetchMock.mock.calls[1]?.[1]?.headers).get('Authorization')).toBeNull();
    expect(new Headers(fetchMock.mock.calls[2]?.[1]?.headers).get('Authorization')).toBe(
      'Bearer fresh-access-token',
    );
    expect(localStorage.length).toBe(0);
  });

  it('does not try refreshing a failed login request', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(401, {
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      }),
    );
    await expect(apiRequest('/auth/login', { method: 'POST', body: '{}' })).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_CREDENTIALS',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not loop when the refresh request itself fails', async () => {
    setAccessToken('expired-access-token');
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { success: false, error: { code: 'UNAUTHORIZED' } }))
      .mockResolvedValueOnce(
        jsonResponse(401, { success: false, error: { code: 'INVALID_SESSION' } }),
      );
    await expect(apiRequest('/users/me')).rejects.toMatchObject({
      status: 401,
      code: 'SESSION_EXPIRED',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
