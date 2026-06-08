// ─────────────────────────────────────────────────────────────────────────────
// Единый контракт Socket.IO между клиентом и сервером.
// Источник истины для протокола: типизируется ОДИН раз, используется обеими
// сторонами. Если поменять payload здесь — компилятор подсветит рассинхрон
// и на клиенте, и на сервере (через JSDoc-импорты в server.js).
//
// Файл type-only: никакого рантайм-кода, на сборку клиента он не попадает
// (import type стирается esbuild'ом), сервер его не require'ит.
// ─────────────────────────────────────────────────────────────────────────────

/** Ключи анимаций персонажа (совпадают с ключами в Player.createAnimations). */
export type AnimKey =
    | "idle"
    | "run"
    | "jump"
    | "fall"
    | "attack"
    | "block"
    | "dead";

/** Полное состояние игрока, как сервер отдаёт его при входе/синхронизации. */
export interface PlayerSnapshot {
    id: string;
    username: string;
    x: number;
    y: number;
    flipX: boolean;
    anim: string;
    hp: number;
    kills: number;
    deaths: number;
}

/** Строка живого скорборда (включая гостей). */
export interface ScoreRow {
    id: string;
    name: string;
    kills: number;
    deaths: number;
}

// ── client → server ──────────────────────────────────────────────────────────

export interface JoinPayload {
    x: number;
    y: number;
    flipX: boolean;
    anim: string;
    name: string;
}

export interface MovePayload {
    x: number;
    y: number;
    flipX: boolean;
    anim: string;
}

export interface HitPayload {
    targetId: string;
}

// ── server → client ──────────────────────────────────────────────────────────

export interface MovedPayload extends MovePayload {
    id: string;
}

export interface AttackedPayload {
    id: string;
}

export interface DamagedPayload {
    targetId: string;
    attackerId: string;
    hp: number;
    maxHp: number;
}

export interface DiedPayload {
    id: string;
}

export interface RespawnedPayload {
    id: string;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
}

export interface BlockedPayload {
    targetId: string;
    attackerId: string;
}

// ── карты событий для типизации сокета (socket.io generics) ───────────────────

export interface ClientToServerEvents {
    playerJoin: (data: JoinPayload) => void;
    playerMove: (data: MovePayload) => void;
    playerAttack: () => void;
    playerHit: (data: HitPayload) => void;
}

export interface ServerToClientEvents {
    currentPlayers: (players: PlayerSnapshot[]) => void;
    playerJoin: (data: PlayerSnapshot) => void;
    playerMoved: (data: MovedPayload) => void;
    playerAttacked: (data: AttackedPayload) => void;
    playerDamaged: (data: DamagedPayload) => void;
    playerDied: (data: DiedPayload) => void;
    playerRespawned: (data: RespawnedPayload) => void;
    playerBlocked: (data: BlockedPayload) => void;
    playerDisconnected: (id: string) => void;
    scoreboard: (rows: ScoreRow[]) => void;
}
