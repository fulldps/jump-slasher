import io from "socket.io-client";
import { getToken } from "./api";

const SERVER_URL: string =
    (typeof import.meta !== "undefined" &&
        (import.meta as any).env?.VITE_SERVER_URL) ||
    window.location.origin;

// autoConnect: false — не подключаемся при импорте модуля.
// Подключение происходит явно в WorldScene через socket.connect()
// Это значит MainMenu работает без бэкенда.
const socket = io(SERVER_URL, {
    autoConnect: false,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    auth: { token: getToken() ?? "" },
});

socket.on("connect_error", (err) => {
    console.warn("Socket connection error:", err.message);
});

export default socket;
