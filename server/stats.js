const pool = require("./db");

// Записывает итоги матча: обновляет глобальную статистику и match_participants.
// Вызывается когда матч завершён (все игроки отключились или истёк таймер).
async function saveMatchResults(matchId, participants) {
    // participants: [{ playerId, kills, deaths, won }]
    if (!participants.length) return;

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        for (const p of participants) {
            // Итоги конкретного матча
            await client.query(
                `INSERT INTO match_participants (match_id, player_id, kills, deaths, won)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (match_id, player_id) DO UPDATE
                 SET kills = $3, deaths = $4, won = $5`,
                [matchId, p.playerId, p.kills, p.deaths, p.won],
            );

            // Накопительная глобальная статистика
            await client.query(
                `UPDATE player_stats
                 SET kills  = kills  + $2,
                     deaths = deaths + $3,
                     wins   = wins   + $4
                 WHERE player_id = $1`,
                [p.playerId, p.kills, p.deaths, p.won ? 1 : 0],
            );
        }

        // Закрываем матч
        await client.query(
            "UPDATE matches SET ended_at = NOW() WHERE id = $1",
            [matchId],
        );

        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("saveMatchResults error:", err.message);
    } finally {
        client.release();
    }
}

// Создаём запись матча в начале, возвращаем matchId
async function createMatch(playerCount) {
    const { rows } = await pool.query(
        "INSERT INTO matches (player_count) VALUES ($1) RETURNING id",
        [playerCount],
    );
    return rows[0].id;
}

// Топ-10 для leaderboard
async function getLeaderboard(limit = 10) {
    const { rows } = await pool.query(
        "SELECT username, kills, deaths, wins, kd_ratio FROM leaderboard LIMIT $1",
        [limit],
    );
    return rows;
}

// Статистика конкретного игрока
async function getPlayerStats(playerId) {
    const { rows } = await pool.query(
        `SELECT p.username, s.kills, s.deaths, s.wins,
                CASE WHEN s.deaths = 0 THEN s.kills::FLOAT
                     ELSE ROUND((s.kills::NUMERIC / s.deaths), 2)
                END AS kd_ratio
         FROM players p
         JOIN player_stats s ON s.player_id = p.id
         WHERE p.id = $1`,
        [playerId],
    );
    return rows[0] ?? null;
}

module.exports = { createMatch, saveMatchResults, getLeaderboard, getPlayerStats };
