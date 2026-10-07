import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useNetworkStatus } from './useNetworkStatus';

describe('useNetworkStatus', () => {
  it('detects online and offline transitions through window events', () => {
    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(false);

    // Simulate going offline
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.wasOffline).toBe(true);

    // Simulate reconnection
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(true);
  });
});
