"use client";
import { io } from "socket.io-client";
const SOCKET_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
export const socket = io(SOCKET_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    timeout: 10000,
});
//# sourceMappingURL=socket.js.map