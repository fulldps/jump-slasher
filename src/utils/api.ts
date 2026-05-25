const BASE: string =
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SERVER_URL) ||
    window.location.origin;

export interface AuthResult {
    token: string;
    id: number;
    username: string;
}

async function request<T>(path: string, body: object): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Request failed");
    return data as T;
}

export const apiRegister = (username: string, password: string) =>
    request<AuthResult>("/api/register", { username, password });

export const apiLogin = (username: string, password: string) =>
    request<AuthResult>("/api/login", { username, password });

export const apiLeaderboard = async (): Promise<any[]> => {
    const res = await fetch(`${BASE}/api/leaderboard`);
    return res.json();
};

// Сохраняем токен в sessionStorage — живёт только пока открыта вкладка
export const saveSession = (data: AuthResult) => {
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("username", data.username);
    sessionStorage.setItem("playerId", String(data.id));
};

export const getToken = (): string | null => sessionStorage.getItem("token");
export const getUsername = (): string | null => sessionStorage.getItem("username");
export const clearSession = () => sessionStorage.clear();
