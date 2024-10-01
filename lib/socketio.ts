// lib/socketio.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = async (): Promise<Socket> => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
      path: '/api/socketio',
    });

    return new Promise((resolve) => {
      socket!.on('connect', () => {
        console.log('Socket connected');
        resolve(socket!);
      });
    });
  }
  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};