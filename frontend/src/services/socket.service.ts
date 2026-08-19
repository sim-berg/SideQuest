import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

// Same base-URL logic as api.ts: an absolute VITE_API_URL points at a
// separate backend origin; a relative one ('/api', the production build)
// means same-origin — nginx proxies /socket.io/ to the backend there.
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || '/api';
const SOCKET_URL =
  API_URL.replace(/\/api\/?$/, '') || window.location.origin;

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
