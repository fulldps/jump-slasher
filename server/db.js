const { Pool } = require("pg");

// Pool переиспользует соединения — не создаём новое на каждый запрос.
// DATABASE_URL задаётся в .env или env переменных хостинга (Render/Railway дают автоматически).
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // На Render/Railway SSL обязателен для внешних подключений
    ssl: process.env.DATABASE_URL?.includes("localhost")
        ? false
        : { rejectUnauthorized: false },
});

pool.on("error", (err) => {
    console.error("PostgreSQL pool error:", err.message);
});

module.exports = pool;
