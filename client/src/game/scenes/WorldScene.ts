import { WorldSceneBase } from "./WorldSceneBase";
import { RemoteHpBar } from "../objects/RemoteHpBar";
import { HudScene } from "./HudScene";
import { getUsername } from "../../utils/api";
import socket from "../../utils/socket";
import type {
    PlayerSnapshot,
    MovedPayload,
    DamagedPayload,
    RespawnedPayload,
    BlockedPayload,
    ScoreRow,
} from "@jump-slasher/shared/events";

const MAX_HP = 100;

// Один снапшот позиции, пришедший с сервера, с локальным временем приёма.
interface Snapshot {
    t: number;
    x: number;
    y: number;
}

interface RemotePlayer {
    sprite: Phaser.GameObjects.Sprite;
    hpBar: RemoteHpBar;
    hp: number;
    // x/y — текущая ОТРИСОВАННАЯ позиция (её же читает хит-детект).
    x: number;
    y: number;
    // Буфер последних снапшотов сервера. Рендерим не самую свежую позицию,
    // а состояние на (now - INTERP_DELAY) — линейно интерполируя между двумя
    // снапшотами вокруг этого момента. Так движение всегда равномерное,
    // даже при неравных интервалах пакетов (рывки уходят).
    buffer: Snapshot[];
}

export class WorldScene extends WorldSceneBase {
    constructor() {
        super("WorldScene");
    }

    private otherPlayers: Map<string, RemotePlayer> = new Map();
    private lastEmitTime = 0;
    private readonly EMIT_INTERVAL = 50;

    // Задержка рендера (мс): отрисовываем чужих игроков на INTERP_DELAY в прошлом,
    // чтобы между двумя серверными снапшотами всегда было что интерполировать.
    // ~2 интервала отправки (2×50мс) — буфер переживает один потерянный/опоздавший пакет.
    private readonly INTERP_DELAY = 100;
    // Дальше этого расстояния не интерполируем, а телепортируем (респавн/лаг-спайк).
    private readonly SNAP_DISTANCE = 200;

    private hitTargetsThisSwing: Set<string> = new Set();
    private wasAttacking = false;

    // ── HELPERS ──────────────────────────────────────────────

    private addOtherPlayer(data: {
        id: string;
        x: number;
        y: number;
        flipX?: boolean;
        anim?: string;
        username?: string;
        name?: string;
        hp?: number;
    }): void {
        if (this.otherPlayers.has(data.id)) return;

        const sprite = this.add.sprite(data.x, data.y, "player");
        sprite.setFlipX(data.flipX ?? false);
        sprite.anims.play(data.anim ?? "idle", true);
        sprite.setDepth(1).setAlpha(0.9);

        // Сервер шлёт username (авторизованные) или name (гости)
        const displayName = data.username ?? data.name ?? "Guest";
        const hpBar = new RemoteHpBar(
            this,
            data.x,
            data.y,
            displayName,
            MAX_HP,
        );
        hpBar.setHp(data.hp ?? MAX_HP, MAX_HP);

        this.otherPlayers.set(data.id, {
            sprite,
            hpBar,
            hp: data.hp ?? MAX_HP,
            x: data.x,
            y: data.y,
            buffer: [{ t: this.time.now, x: data.x, y: data.y }],
        });
    }

    private removeOtherPlayer(id: string): void {
        const r = this.otherPlayers.get(id);
        if (!r) return;
        r.sprite.destroy();
        r.hpBar.destroy();
        this.otherPlayers.delete(id);
    }

    // ── HIT DETECTION ────────────────────────────────────────

    private checkAttackHits(): void {
        const hitbox = this.player.getAttackHitbox();

        if (!hitbox) {
            if (this.wasAttacking) {
                this.hitTargetsThisSwing.clear();
                this.wasAttacking = false;
            }
            return;
        }

        this.wasAttacking = true;
        const hb = hitbox.body as Phaser.Physics.Arcade.Body;
        const hbCX = hb.x + hb.width / 2;
        const hbCY = hb.y + hb.height / 2;

        this.otherPlayers.forEach((remote, id) => {
            if (this.hitTargetsThisSwing.has(id)) return;
            if (remote.hp <= 0) return;
            const dx = Math.abs(hbCX - remote.x);
            const dy = Math.abs(hbCY - remote.y);
            if (dx < 33 && dy < 35) {
                this.hitTargetsThisSwing.add(id);
                socket.emit("playerHit", { targetId: id });
            }
        });
    }

    // ── INTERPOLATION ────────────────────────────────────────
    // Snapshot interpolation: рендерим состояние на (now - INTERP_DELAY),
    // линейно интерполируя между двумя снапшотами вокруг этого момента.
    // Движение получается равномерным (постоянная скорость между пакетами),
    // без рывков экспоненциального сглаживания и без зависимости от FPS.

    private interpolateOtherPlayers(now: number): void {
        const renderTime = now - this.INTERP_DELAY;

        this.otherPlayers.forEach((r) => {
            const buf = r.buffer;

            // Выбрасываем устаревшие снапшоты, но оставляем тот, что прямо
            // перед renderTime (нужен как нижняя граница интерполяции).
            while (buf.length >= 2 && buf[1].t <= renderTime) buf.shift();

            let x: number;
            let y: number;

            if (buf.length >= 2 && buf[0].t <= renderTime) {
                const s0 = buf[0];
                const s1 = buf[1];
                const span = s1.t - s0.t;
                const k =
                    span > 0
                        ? Phaser.Math.Clamp((renderTime - s0.t) / span, 0, 1)
                        : 1;
                x = s0.x + (s1.x - s0.x) * k;
                y = s0.y + (s1.y - s0.y) * k;
            } else {
                // Голод буфера (пакеты опоздали) — держим последнюю известную позицию.
                const last = buf[buf.length - 1];
                x = last.x;
                y = last.y;
            }

            r.x = x;
            r.y = y;
            r.sprite.setPosition(x, y);
            r.hpBar.moveTo(x, y);
        });
    }

    // ── LIFECYCLE ────────────────────────────────────────────

    create(): void {
        // Подключаемся к серверу только при входе в игровую сцену
        socket.connect();

        // HUD-оверлей со скорбордом — отдельная сцена поверх игровой
        // (её камера без zoom, чтобы счёт оставался в углу и не искажался).
        this.scene.launch("HudScene");

        this.createBase();

        const map = this.make.tilemap({ key: "map" });
        if (!map) {
            console.error("Map not created");
            return;
        }

        const tileset = map.addTilesetImage(
            "terra-tilemap-basic",
            "maintilemap",
            16,
            16,
        );
        if (!tileset) {
            console.error("Tileset not created");
            return;
        }

        const groundLayer = map.createLayer("ground", tileset, 0, 0);
        groundLayer?.setCollisionByExclusion([-1], true);

        this.setParallaxBackground(["bg_1", "bg_2", "bg_3", "bg_4"]);
        this.setupPlayer(100, 300);

        if (groundLayer) {
            this.physics.add.collider(this.player as any, groundLayer);
        }

        this.physics.world.setBounds(
            0,
            0,
            map.widthInPixels,
            map.heightInPixels,
        );
        this.cameras.main.setBounds(
            0,
            0,
            map.widthInPixels,
            map.heightInPixels,
        );
        this.cameras.main.setZoom(1.8);
        this.cameras.main.setRoundPixels(true);
        this.cameras.main.startFollow(this.player, true, 0.2, 0.3);

        this.player.on("attacked", () => socket.emit("playerAttack"));

        // ── SOCKET EVENTS ──

        const displayName = getUsername() ?? "Guest";

        socket.emit("playerJoin", {
            x: this.player.x,
            y: this.player.y,
            flipX: false,
            anim: "idle",
            name: displayName,
        });

        socket.on("currentPlayers", (players: PlayerSnapshot[]) => {
            players.forEach((p) => {
                if (p.id !== socket.id) this.addOtherPlayer(p);
            });
        });

        socket.on("playerJoin", (data: PlayerSnapshot) => {
            if (data.id !== socket.id) this.addOtherPlayer(data);
        });

        socket.on("playerDisconnected", (id: string) =>
            this.removeOtherPlayer(id),
        );

        socket.on("scoreboard", (rows: ScoreRow[]) => {
            const hud = this.scene.get("HudScene") as HudScene;
            hud?.setScoreboard(rows, socket.id ?? "");
        });

        socket.on("playerMoved", (data: MovedPayload) => {
            const r = this.otherPlayers.get(data.id);
            if (!r) return;

            const last = r.buffer[r.buffer.length - 1];
            const dist = Phaser.Math.Distance.Between(
                last.x,
                last.y,
                data.x,
                data.y,
            );

            if (dist > this.SNAP_DISTANCE) {
                // Большой скачок (телепорт/респавн/лаг-спайк) — сбрасываем буфер
                // и телепортируем, без интерполяции «через всю карту».
                r.buffer = [{ t: this.time.now, x: data.x, y: data.y }];
                r.x = data.x;
                r.y = data.y;
                r.sprite.setPosition(data.x, data.y);
                r.hpBar.moveTo(data.x, data.y);
            } else {
                r.buffer.push({ t: this.time.now, x: data.x, y: data.y });
            }

            // Поворот и анимацию применяем сразу — они не привязаны к задержке рендера.
            r.sprite.setFlipX(data.flipX ?? false);
            if (data.anim && r.sprite.anims.currentAnim?.key !== data.anim) {
                r.sprite.anims.play(data.anim, true);
            }
        });

        socket.on("playerAttacked", (data: { id: string }) => {
            const r = this.otherPlayers.get(data.id);
            if (r) r.sprite.anims.play("attack", true);
        });

        socket.on(
            "playerDamaged",
            (data: DamagedPayload) => {
                if (data.targetId === socket.id) {
                    this.player.takeDamage(data.hp);
                } else {
                    const r = this.otherPlayers.get(data.targetId);
                    if (!r) return;
                    r.hp = data.hp;
                    r.hpBar.setHp(data.hp, data.maxHp);
                    this.tweens.add({
                        targets: r.sprite,
                        alpha: 0.2,
                        duration: 80,
                        yoyo: true,
                        repeat: 2,
                        onComplete: () => r.sprite.setAlpha(0.9),
                    });
                }
            },
        );

        socket.on("playerDied", (data: { id: string }) => {
            if (data.id === socket.id) return;
            const r = this.otherPlayers.get(data.id);
            if (!r) return;
            r.hp = 0;
            r.hpBar.setHp(0);
            this.tweens.add({
                targets: r.sprite,
                alpha: 0,
                duration: 600,
                onComplete: () => {
                    r.sprite.setVisible(false);
                    r.hpBar.setVisible(false);
                },
            });
        });

        socket.on(
            "playerRespawned",
            (data: RespawnedPayload) => {
                if (data.id === socket.id) {
                    this.player.respawn(data.x, data.y, data.hp);
                } else {
                    const r = this.otherPlayers.get(data.id);
                    if (!r) return;
                    r.hp = data.hp;
                    r.x = data.x;
                    r.y = data.y;
                    r.buffer = [{ t: this.time.now, x: data.x, y: data.y }];
                    r.sprite
                        .setPosition(data.x, data.y)
                        .setAlpha(0.9)
                        .setVisible(true);
                    r.hpBar.setHp(data.hp, data.maxHp);
                    r.hpBar.moveTo(data.x, data.y);
                    r.hpBar.setVisible(true);
                }
            },
        );

        // Удар поглощён блоком — урона нет, только визуальная вспышка щита.
        socket.on(
            "playerBlocked",
            (data: BlockedPayload) => {
                const sprite =
                    data.targetId === socket.id
                        ? this.player
                        : this.otherPlayers.get(data.targetId)?.sprite;
                if (sprite) this.flashBlock(sprite);
            },
        );
    }

    /** Короткая голубая вспышка спрайта — фидбэк успешного блока. */
    private flashBlock(sprite: Phaser.GameObjects.Sprite): void {
        sprite.setTint(0x66ccff);
        this.time.delayedCall(140, () => sprite.clearTint());
    }

    update(time: number, delta: number): void {
        super.update(time, delta);
        this.checkAttackHits();
        this.interpolateOtherPlayers(time);

        if (time - this.lastEmitTime > this.EMIT_INTERVAL) {
            this.lastEmitTime = time;
            socket.emit("playerMove", {
                x: this.player.x,
                y: this.player.y,
                flipX: this.player.flipX,
                anim: this.player.anims.currentAnim?.key ?? "idle",
            });
        }
    }

    shutdown(): void {
        socket.off("currentPlayers");
        socket.off("playerJoin");
        socket.off("playerDisconnected");
        socket.off("scoreboard");
        socket.off("playerMoved");
        socket.off("playerAttacked");
        socket.off("playerDamaged");
        socket.off("playerDied");
        socket.off("playerRespawned");
        socket.off("playerBlocked");
        this.otherPlayers.forEach((_, id) => this.removeOtherPlayer(id));
        this.scene.stop("HudScene");
        socket.disconnect();
        super.shutdown();
    }
}
