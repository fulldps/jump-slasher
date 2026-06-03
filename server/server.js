require("dotenv").config();
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

const { register, login, requireAuth, verifyToken } = require("./auth");
const {
    createMatch,
    saveMatchResults,
    getLeaderboard,
    getPlayerStats,
} = require("./stats");

const app = express();
app.use(cors());
app.use(express.json());

// Статика теперь в server/public/ — путь всегда корректен через __dirname
app.use(express.static(path.join(__dirname, "public")));

const httpServer = createServer(app);

const allowedOrigins = process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(",")
    : ["http://localhost:8080", "http://localhost:5173"];

const io = new Server(httpServer, {
    cors: { origin: allowedOrigins, methods: ["GET", "POST"] },
});

// ── REST API ──────────────────────────────────────────────────────────────────

app.post("/api/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        const player = await register(username, password);
        res.json(player);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post("/api/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await login(username, password);
        res.json(result);
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
});

app.get("/api/leaderboard", async (_req, res) => {
    try {
        const rows = await getLeaderboard(10);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/stats/:playerId", requireAuth, async (req, res) => {
    try {
        const stats = await getPlayerStats(Number(req.params.playerId));
        if (!stats) return res.status(404).json({ error: "Player not found" });
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// SPA fallback — все остальные GET отдают index.html
app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── ИГРОВОЕ СОСТОЯНИЕ ─────────────────────────────────────────────────────────

const MAX_HP = 100;
const ATTACK_DAMAGE = 20;
const HIT_RANGE = 60;
const HIT_COOLDOWN = 400;

const players = new Map();
let currentMatchId = null;
let matchPlayerCount = 0;

// Живой скорборд — список всех игроков (включая гостей), отсортированный по килам.
// Шлём его всем при входе, после убийства и при выходе игрока.
function broadcastScoreboard() {
    const rows = Array.from(players.values())
        .map((p) => ({
            id: p.id,
            name: p.username,
            kills: p.kills,
            deaths: p.deaths,
        }))
        .sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);
    io.emit("scoreboard", rows);
}

// ── SOCKET.IO ─────────────────────────────────────────────────────────────────

io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    let playerDbId = null;
    let playerUsername = "Guest";

    const token = socket.handshake.auth?.token;
    if (token) {
        try {
            const decoded = verifyToken(token);
            playerDbId = decoded.id;
            playerUsername = decoded.username;
        } catch {
            // невалидный токен — гость
        }
    }

    socket.on("playerJoin", (data) => {
        // Имя для отображения: у авторизованных — из токена, у гостей — то,
        // что прислал клиент (иначе все гости были бы безликими "Guest").
        const displayName = playerDbId
            ? playerUsername
            : (data.name || "Guest");

        players.set(socket.id, {
            id: socket.id,
            dbId: playerDbId,
            username: displayName,
            x: data.x ?? 100,
            y: data.y ?? 300,
            flipX: data.flipX ?? false,
            anim: data.anim ?? "idle",
            hp: MAX_HP,
            kills: 0,
            deaths: 0,
            lastHitTime: 0,
        });

        if (players.size === 1 && currentMatchId === null) {
            createMatch(1).then((id) => {
                currentMatchId = id;
                matchPlayerCount = 1;
                console.log("Match started:", id);
            });
        } else {
            matchPlayerCount = Math.max(matchPlayerCount, players.size);
        }

        socket.broadcast.emit("playerJoin", { ...players.get(socket.id) });
        socket.emit("currentPlayers", Array.from(players.values()));
        broadcastScoreboard();
        console.log(`Online: ${players.size}`);
    });

    socket.on("playerMove", (data) => {
        const player = players.get(socket.id);
        if (!player) return;
        player.x = data.x;
        player.y = data.y;
        player.flipX = data.flipX;
        player.anim = data.anim;
        socket.broadcast.emit("playerMoved", { id: socket.id, ...data });
    });

    socket.on("playerAttack", () => {
        socket.broadcast.emit("playerAttacked", { id: socket.id });
    });

    socket.on("playerHit", ({ targetId }) => {
        const attacker = players.get(socket.id);
        const target = players.get(targetId);
        if (!attacker || !target) return;

        const now = Date.now();
        if (now - attacker.lastHitTime < HIT_COOLDOWN) return;

        const dx = Math.abs(attacker.x - target.x);
        const dy = Math.abs(attacker.y - target.y);
        if (dx > HIT_RANGE || dy > HIT_RANGE / 2) return;

        attacker.lastHitTime = now;
        target.hp = Math.max(0, target.hp - ATTACK_DAMAGE);

        io.emit("playerDamaged", {
            targetId,
            attackerId: socket.id,
            hp: target.hp,
            maxHp: MAX_HP,
        });

        if (target.hp <= 0) {
            attacker.kills += 1;
            target.deaths += 1;
            io.emit("playerDied", { id: targetId });
            broadcastScoreboard();

            setTimeout(() => {
                if (!players.has(targetId)) return;
                target.hp = MAX_HP;
                target.x = 100;
                target.y = 300;
                io.emit("playerRespawned", {
                    id: targetId,
                    x: target.x,
                    y: target.y,
                    hp: MAX_HP,
                    maxHp: MAX_HP,
                });
            }, 3000);
        }
    });

    socket.on("disconnect", async () => {
        const player = players.get(socket.id);
        players.delete(socket.id);
        socket.broadcast.emit("playerDisconnected", socket.id);
        broadcastScoreboard();
        console.log("Disconnected:", socket.id, `| Online: ${players.size}`);

        if (players.size === 0 && currentMatchId !== null && player) {
            const allParticipants = [];
            if (player.dbId) {
                allParticipants.push({
                    playerId: player.dbId,
                    kills: player.kills,
                    deaths: player.deaths,
                    won: false,
                });
            }
            if (allParticipants.length) {
                await saveMatchResults(currentMatchId, allParticipants);
                console.log("Match saved:", currentMatchId);
            }
            currentMatchId = null;
            matchPlayerCount = 0;
        }
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`Server on port ${PORT}`));
