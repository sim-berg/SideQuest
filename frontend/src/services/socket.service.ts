import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

/**
 * Same origin by default: nginx proxies /socket.io/ to the backend, so a
 * production build without VITE_API_URL still connects instead of hammering a
 * hard-coded localhost port. Only an explicit VITE_API_URL points elsewhere.
 */
const SOCKET_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(
    /\/api\/?$/,
    '',
  ) || window.location.origin;

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;
  // A disconnected socket from an earlier session would keep its stale token.
  if (socket) disconnectSocket();

  socket = io(SOCKET_URL, {
    auth: { token },
    // Allow the polling handshake as a fallback: some proxies and mobile
    // networks block a bare websocket upgrade, and websocket-only would then
    // retry forever with a console error per attempt.
    transports: ['websocket', 'polling'],
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
