import { WorldSceneBase } from "./WorldSceneBase";
import { RemoteHpBar } from "../objects/RemoteHpBar";
import { getUsername } from "../../utils/api";
import socket from "../../utils/socket";

const MAX_HP = 100;

interface RemotePlayer {
    sprite: Phaser.GameObjects.Sprite;
    hpBar: RemoteHpBar;
    hp: number;
    x: number;
    y: number;
}

export class WorldScene extends WorldSceneBase {
    constructor() { super("WorldScene"); }

    private otherPlayers: Map<string, RemotePlayer> = new Map();
    private lastEmitTime = 0;
    private readonly EMIT_INTERVAL = 50;

    private hitTargetsThisSwing: Set<string> = new Set();
    private wasAttacking = false;

    // ── HELPERS ──────────────────────────────────────────────

    private addOtherPlayer(data: {
        id: string; x: number; y: number;
        flipX?: boolean; anim?: string; username?: string; name?: string; hp?: number;
    }): void {
        if (this.otherPlayers.has(data.id)) return;

        const sprite = this.add.sprite(data.x, data.y, "player");
        sprite.setFlipX(data.flipX ?? false);
        sprite.anims.play(data.anim ?? "idle", true);
        sprite.setDepth(1).setAlpha(0.9);

        // Сервер шлёт username (авторизованные) или name (гости)
        const displayName = data.username ?? data.name ?? "Guest";
        const hpBar = new RemoteHpBar(this, data.x, data.y, displayName, MAX_HP);
        hpBar.setHp(data.hp ?? MAX_HP, MAX_HP);

        this.otherPlayers.set(data.id, {
            sprite, hpBar,
            hp: data.hp ?? MAX_HP,
            x: data.x, y: data.y,
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
        const hbCX = hb.x + hb.width  / 2;
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

    // ── LIFECYCLE ────────────────────────────────────────────

    create(): void {
        this.createBase();

        const map = this.make.tilemap({ key: "map" });
        if (!map) { console.error("Map not created"); return; }

        const tileset = map.addTilesetImage("terra-tilemap-basic", "maintilemap", 16, 16);
        if (!tileset) { console.error("Tileset not created"); return; }

        const groundLayer = map.createLayer("ground", tileset, 0, 0);
        groundLayer?.setCollisionByExclusion([-1], true);

        this.setParallaxBackground(["bg_1", "bg_2", "bg_3", "bg_4"]);
        this.setupPlayer(100, 300);

        if (groundLayer) {
            this.physics.add.collider(this.player as any, groundLayer);
        }

        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setZoom(1.8);
        this.cameras.main.setRoundPixels(true);
        this.cameras.main.startFollow(this.player, true, 0.2, 0.3);

        this.player.on("attacked", () => socket.emit("playerAttack"));

        // ── SOCKET EVENTS ──

        const displayName = getUsername() ?? "Guest";

        socket.emit("playerJoin", {
            x: this.player.x, y: this.player.y,
            flipX: false, anim: "idle",
            name: displayName,
        });

        socket.on("currentPlayers", (players: any[]) => {
            players.forEach((p) => { if (p.id !== socket.id) this.addOtherPlayer(p); });
        });

        socket.on("playerJoin", (data: any) => {
            if (data.id !== socket.id) this.addOtherPlayer(data);
        });

        socket.on("playerDisconnected", (id: string) => this.removeOtherPlayer(id));

        socket.on("playerMoved", (data: any) => {
            const r = this.otherPlayers.get(data.id);
            if (!r) return;
            r.sprite.setPosition(data.x, data.y).setFlipX(data.flipX ?? false);
            r.hpBar.moveTo(data.x, data.y);
            r.x = data.x; r.y = data.y;
            if (data.anim && r.sprite.anims.currentAnim?.key !== data.anim) {
                r.sprite.anims.play(data.anim, true);
            }
        });

        socket.on("playerAttacked", (data: { id: string }) => {
            const r = this.otherPlayers.get(data.id);
            if (r) r.sprite.anims.play("attack", true);
        });

        socket.on("playerDamaged", (data: { targetId: string; hp: number; maxHp: number }) => {
            if (data.targetId === socket.id) {
                this.player.takeDamage(data.hp);
            } else {
                const r = this.otherPlayers.get(data.targetId);
                if (!r) return;
                r.hp = data.hp;
                r.hpBar.setHp(data.hp, data.maxHp);
                this.tweens.add({
                    targets: r.sprite, alpha: 0.2, duration: 80, yoyo: true, repeat: 2,
                    onComplete: () => r.sprite.setAlpha(0.9),
                });
            }
        });

        socket.on("playerDied", (data: { id: string }) => {
            if (data.id === socket.id) return;
            const r = this.otherPlayers.get(data.id);
            if (!r) return;
            r.hp = 0; r.hpBar.setHp(0);
            this.tweens.add({
                targets: r.sprite, alpha: 0, duration: 600,
                onComplete: () => { r.sprite.setVisible(false); r.hpBar.setVisible(false); },
            });
        });

        socket.on("playerRespawned", (data: { id: string; x: number; y: number; hp: number; maxHp: number }) => {
            if (data.id === socket.id) {
                this.player.respawn(data.x, data.y, data.hp);
            } else {
                const r = this.otherPlayers.get(data.id);
                if (!r) return;
                r.hp = data.hp; r.x = data.x; r.y = data.y;
                r.sprite.setPosition(data.x, data.y).setAlpha(0.9).setVisible(true);
                r.hpBar.setHp(data.hp, data.maxHp);
                r.hpBar.moveTo(data.x, data.y);
                r.hpBar.setVisible(true);
            }
        });
    }

    update(time: number, delta: number): void {
        super.update(time, delta);
        this.checkAttackHits();

        if (time - this.lastEmitTime > this.EMIT_INTERVAL) {
            this.lastEmitTime = time;
            socket.emit("playerMove", {
                x: this.player.x, y: this.player.y,
                flipX: this.player.flipX,
                anim: this.player.anims.currentAnim?.key ?? "idle",
            });
        }
    }

    shutdown(): void {
        socket.off("currentPlayers");
        socket.off("playerJoin");
        socket.off("playerDisconnected");
        socket.off("playerMoved");
        socket.off("playerAttacked");
        socket.off("playerDamaged");
        socket.off("playerDied");
        socket.off("playerRespawned");
        this.otherPlayers.forEach((_, id) => this.removeOtherPlayer(id));
        super.shutdown();
    }
}
