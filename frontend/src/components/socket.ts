import { io } from "socket.io-client";

export const socket = io("https://opsentrix.onrender.com", {
    autoConnect: false,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
})