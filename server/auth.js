const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_production";
const JWT_EXPIRES = "7d";

// Регистрация: создаём игрока + пустую строку статистики в одной транзакции
async function register(username, password) {
    if (!username || username.length < 3 || username.length > 32) {
        throw new Error("Username must be 3–32 characters");
    }
    if (!password || password.length < 6) {
        throw new Error("Password must be at least 6 characters");
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const { rows } = await client.query(
            "INSERT INTO players (username, password_hash) VALUES ($1, $2) RETURNING id, username",
            [username.trim(), hash],
        );
        const player = rows[0];

        await client.query(
            "INSERT INTO player_stats (player_id) VALUES ($1)",
            [player.id],
        );

        await client.query("COMMIT");
        return { id: player.id, username: player.username };
    } catch (err) {
        await client.query("ROLLBACK");
        // Уникальное ограничение на username
        if (err.code === "23505") throw new Error("Username already taken");
        throw err;
    } finally {
        client.release();
    }
}

// Логин: проверяем пароль, возвращаем JWT
async function login(username, password) {
    const { rows } = await pool.query(
        "SELECT id, username, password_hash FROM players WHERE username = $1",
        [username.trim()],
    );
    if (!rows.length) throw new Error("Invalid credentials");

    const player = rows[0];
    const match = await bcrypt.compare(password, player.password_hash);
    if (!match) throw new Error("Invalid credentials");

    const token = jwt.sign(
        { id: player.id, username: player.username },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES },
    );

    return { token, id: player.id, username: player.username };
}

// Middleware для Express: проверяет Bearer-токен в заголовке
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No token" });
    }
    try {
        req.player = jwt.verify(header.slice(7), JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: "Invalid token" });
    }
}

// Верификация JWT без Express (для Socket.IO handshake)
function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

module.exports = { register, login, requireAuth, verifyToken };
