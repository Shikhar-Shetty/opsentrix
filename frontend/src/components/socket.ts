import { io } from "socket.io-client";

export const socket = io("http://localhost:4000", {
    autoConnect: false,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
})