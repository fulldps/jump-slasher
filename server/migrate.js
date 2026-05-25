/**
 * Запуск: node migrate.js
 * Применяет миграции один раз. Безопасно перезапускать — все блоки идемпотентны.
 */
const pool = require("./db");

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Таблица игроков — аккаунты
        await client.query(`
            CREATE TABLE IF NOT EXISTS players (
                id         SERIAL PRIMARY KEY,
                username   VARCHAR(32) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        // Статистика 1:1 с players
        // ON DELETE CASCADE — удаляем игрока → удаляем статистику
        await client.query(`
            CREATE TABLE IF NOT EXISTS player_stats (
                player_id  INT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
                kills      INT NOT NULL DEFAULT 0,
                deaths     INT NOT NULL DEFAULT 0,
                wins       INT NOT NULL DEFAULT 0
            )
        `);

        // История матчей
        await client.query(`
            CREATE TABLE IF NOT EXISTS matches (
                id           SERIAL PRIMARY KEY,
                started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                ended_at     TIMESTAMPTZ,
                player_count SMALLINT NOT NULL DEFAULT 0
            )
        `);

        // Участники матча — итоги каждого игрока в конкретном матче
        await client.query(`
            CREATE TABLE IF NOT EXISTS match_participants (
                match_id   INT REFERENCES matches(id) ON DELETE CASCADE,
                player_id  INT REFERENCES players(id) ON DELETE CASCADE,
                kills      INT NOT NULL DEFAULT 0,
                deaths     INT NOT NULL DEFAULT 0,
                won        BOOLEAN NOT NULL DEFAULT FALSE,
                PRIMARY KEY (match_id, player_id)
            )
        `);

        // VIEW для leaderboard — топ по kills, вычисляем K/D на лету
        // CREATE OR REPLACE VIEW безопасно при повторном запуске
        await client.query(`
            CREATE OR REPLACE VIEW leaderboard AS
            SELECT
                p.id,
                p.username,
                s.kills,
                s.deaths,
                s.wins,
                CASE WHEN s.deaths = 0 THEN s.kills::FLOAT
                     ELSE ROUND((s.kills::NUMERIC / s.deaths), 2)
                END AS kd_ratio
            FROM players p
            JOIN player_stats s ON s.player_id = p.id
            ORDER BY s.kills DESC
        `);

        await client.query("COMMIT");
        console.log("Migration complete");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Migration failed:", err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
