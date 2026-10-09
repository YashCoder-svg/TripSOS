import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from './apiClient';

let socket: Socket | null = null;

function getSocketUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (apiUrl) {
    return apiUrl.replace(/\/api\/?$/, '');
  }
  return window.location.origin.includes('5173')
    ? 'http://localhost:4000'
    : window.location.origin;
}

export function getSocket(token?: string | null): Socket {
  const activeToken = token ?? getAccessToken();
  if (!socket) {
    socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      auth: activeToken ? { token: activeToken } : undefined,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  } else if (activeToken && socket.auth && (socket.auth as { token?: string }).token !== activeToken) {
    socket.auth = { token: activeToken };
    socket.disconnect().connect();
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
