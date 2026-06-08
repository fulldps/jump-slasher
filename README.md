# Jump Slasher

Многопользовательский пиксельный платформер-файтинг.
Клиент — Phaser 3 + TypeScript (Vite), сервер — Express + Socket.IO + PostgreSQL.

## Структура (npm workspaces)

```
client/   игровой клиент (Phaser, Vite)
server/   сервер (Express, Socket.IO, PostgreSQL)
shared/   общий контракт Socket.IO-событий (типы, один источник истины)
```

## Запуск

```bash
npm install          # ставит все workspaces разом
npm run migrate      # создаёт таблицы в БД (нужен server/.env)
npm run dev          # сервер + клиент одновременно
```

Клиент: `http://localhost:8080`, сервер: `http://localhost:3000`.

## Команды

| Команда | Что делает |
|---------|------------|
| `npm run dev` | Клиент и сервер в dev-режиме |
| `npm run dev:client` / `npm run dev:server` | По отдельности |
| `npm run build` | Сборка клиента в `server/public` |
| `npm start` | Прод-сервер (раздаёт собранный клиент) |
| `npm run typecheck` | Проверка типов клиента и сервера против контракта |
| `npm run migrate` | Применить схему БД |

## Окружение

- `server/.env` — см. `server/.env.example` (`DATABASE_URL`, `JWT_SECRET`, `PORT`, `CLIENT_ORIGIN`).
- `client/.env.development` / `client/.env.production` — `VITE_SERVER_URL` (в проде пусто = тот же домен).

## Деплой

Один веб-сервис: `npm install && npm run build` собирает клиент в `server/public`,
`npm start` поднимает сервер, который раздаёт и API, и статику.
Конфиг для Render — в `render.yaml`.

## Управление

`A` / `D` — движение, `W` — прыжок, `J` — удар, `K` — блок.
