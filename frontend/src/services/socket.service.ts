import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

const SOCKET_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace('/api', '') ||
  'http://localhost:3002';

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
