type PlayerState =
    | "idle"
    | "run"
    | "jump"
    | "attack"
    | "block"
    | "fall"
    | "hurt"
    | "dead";

const FORBIDDEN: Partial<Record<PlayerState, PlayerState[]>> = {
    fall:   ["jump"],
    attack: ["run"],
    hurt:   ["run", "jump", "attack"],
    dead:   ["idle", "run", "fall", "jump", "attack", "block", "hurt"],
};

const MAX_HP = 100;

export class Player extends Phaser.Physics.Arcade.Sprite {
    private speed         = 120;
    private jumpForce     = -260;
    private canAttack     = true;
    private readonly attackDamage       = 20;
    private readonly attackDuration     = 200;
    private readonly attackCooldownTime = 500;

    // Переименовано: не конфликтует с Phaser.GameObjects.Sprite#setState
    private _playerState: PlayerState = "idle";
    private _hp = MAX_HP;

    private hpBarBg!:   Phaser.GameObjects.Rectangle;
    private hpBarFill!: Phaser.GameObjects.Rectangle;

    private attackHitbox?: Phaser.GameObjects.Zone;

    private readonly BAR_WIDTH    = 26;
    private readonly BAR_HEIGHT   = 3;
    private readonly BAR_OFFSET_Y = -26;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, "player");

        scene.add.existing(this);
        scene.physics.world.enable(this);

        (this.body as Phaser.Physics.Arcade.Body).setSize(26, 40);
        (this.body as Phaser.Physics.Arcade.Body).setOffset(15, 16);

        this.setCollideWorldBounds(true);
        this.setDepth(2);

        this.createAnimations();
        this.createHpBar();
    }

    // ── HP BAR ──────────────────────────────────────────────

    private createHpBar(): void {
        this.hpBarBg = this.scene.add
            .rectangle(this.x, this.y + this.BAR_OFFSET_Y, this.BAR_WIDTH, this.BAR_HEIGHT, 0x333333)
            .setDepth(5)
            .setOrigin(0.5, 0.5);

        this.hpBarFill = this.scene.add
            .rectangle(this.x - this.BAR_WIDTH / 2, this.y + this.BAR_OFFSET_Y, this.BAR_WIDTH, this.BAR_HEIGHT, 0x44ff44)
            .setDepth(6)
            .setOrigin(0, 0.5);
    }

    private syncHpBarPosition(): void {
        const bx = this.x;
        const by = this.y + this.BAR_OFFSET_Y;
        this.hpBarBg.setPosition(bx, by);
        this.hpBarFill.setPosition(bx - this.BAR_WIDTH / 2, by);
    }

    private redrawHpFill(): void {
        const ratio  = Math.max(0, this._hp / MAX_HP);
        this.hpBarFill.setSize(this.BAR_WIDTH * ratio, this.BAR_HEIGHT);
        const color  = ratio > 0.5 ? 0x44ff44 : ratio > 0.25 ? 0xffcc00 : 0xff3333;
        this.hpBarFill.setFillStyle(color);
    }

    // ── АНИМАЦИИ ────────────────────────────────────────────

    public createAnimations(): void {
        const defs = [
            { key: "idle",   start: 0,  end: 5,  frameRate: 7,  repeat: -1 },
            { key: "run",    start: 16, end: 23, frameRate: 10, repeat: -1 },
            { key: "jump",   start: 24, end: 31, frameRate: 10, repeat: 0  },
            { key: "attack", start: 8,  end: 13, frameRate: 10, repeat: 0  },
        ] as const;

        defs.forEach(({ key, start, end, frameRate, repeat }) => {
            if (!this.anims.exists(key)) {
                this.anims.create({
                    key,
                    frames: this.anims.generateFrameNumbers("player", { start, end }),
                    frameRate,
                    repeat,
                });
            }
        });

        if (!this.anims.exists("block")) {
            this.anims.create({
                key: "block",
                frames: [{ key: "player", frame: 9 }],
                frameRate: 1,
                repeat: -1,
            });
        }
    }

    // ── STATE MACHINE ────────────────────────────────────────
    // Используем _playerState вместо state, чтобы не конфликтовать с Phaser

    public getPlayerState(): PlayerState { return this._playerState; }
    public getHp(): number               { return this._hp; }

    public setPlayerState(next: PlayerState): void {
        if (this._playerState === next) return;
        const blocked = FORBIDDEN[next];
        if (blocked && blocked.includes(this._playerState)) return;
        this._playerState = next;
        this.anims.play(next, true);
    }

    // ── УРОН / СМЕРТЬ / РЕСПАВН ──────────────────────────────

    public takeDamage(hp: number): void {
        this._hp = Math.max(0, hp);
        this.redrawHpFill();

        if (this._hp <= 0) {
            this.die();
        } else {
            this.setPlayerState("hurt");
            this.scene.tweens.add({
                targets: this,
                alpha: 0.3,
                duration: 80,
                yoyo: true,
                repeat: 2,
                onComplete: () => {
                    this.setAlpha(1);
                    if (this._playerState === "hurt") this.setPlayerState("idle");
                },
            });
        }
    }

    private die(): void {
        this._playerState = "dead";
        this.setVelocity(0, 0);
        this.scene.tweens.add({
            targets: [this, this.hpBarBg, this.hpBarFill],
            alpha: 0,
            duration: 600,
            onComplete: () => {
                this.setVisible(false);
                this.hpBarBg.setVisible(false);
                this.hpBarFill.setVisible(false);
            },
        });
    }

    public respawn(x: number, y: number, hp: number): void {
        this._hp = hp;
        this._playerState = "idle";
        this.setPosition(x, y);
        this.setAlpha(1);
        this.setVisible(true);
        this.anims.play("idle", true);
        this.redrawHpFill();
        this.hpBarBg.setVisible(true);
        this.hpBarFill.setVisible(true);
    }

    // ── INPUT ────────────────────────────────────────────────

    public processInput(dir: { x: number; y: number; jump: boolean; attack: boolean; block: boolean }): void {
        const st = this._playerState;
        if (st === "hurt" || st === "dead" || st === "attack") return;

        if (dir.attack && this.canAttack) { this.startAttack(); return; }

        const onGround = (this.body as Phaser.Physics.Arcade.Body).blocked.down;

        if (dir.jump && onGround) { this.doJump(); return; }

        if (dir.x !== 0) {
            this.setPlayerState("run");
            this.setVelocityX(dir.x * this.speed);
            this.setFlipX(dir.x < 0);
            return;
        }

        if (onGround) {
            this.setPlayerState("idle");
            this.setVelocityX(0);
        }
    }

    private doJump(): void {
        this.setPlayerState("jump");
        this.setVelocityY(this.jumpForce);
    }

    private startAttack(): void {
        this.setPlayerState("attack");
        this.setVelocityX(0);
        this.canAttack = false;

        const zone = new Phaser.GameObjects.Zone(this.scene, this.x, this.y, 40, 30);
        this.attackHitbox = zone;
        this.scene.add.existing(zone);
        this.scene.physics.world.enable(zone);
        (zone.body as Phaser.Physics.Arcade.Body).moves = false;
        this.syncAttackHitbox();

        this.scene.time.delayedCall(this.attackDuration, () => {
            this.attackHitbox?.destroy();
            this.attackHitbox = undefined;
            this.scene.time.delayedCall(this.attackCooldownTime, () => {
                this.canAttack = true;
                if (this._playerState === "attack") this.setPlayerState("idle");
            });
        });

        this.emit("attacked");
    }

    private syncAttackHitbox(): void {
        if (!this.attackHitbox) return;
        const offsetX = this.flipX ? -38 : 38;
        (this.attackHitbox.body as Phaser.Physics.Arcade.Body).reset(this.x + offsetX, this.y);
    }

    public getAttackHitbox(): Phaser.GameObjects.Zone | undefined { return this.attackHitbox; }
    public getAttackDamage(): number { return this.attackDamage; }

    // ── UPDATE ───────────────────────────────────────────────

    public update(_time?: number, _delta?: number): void {
        const body = this.body as Phaser.Physics.Arcade.Body;

        if (this._playerState === "jump" && body.velocity.y > 0) this.setPlayerState("fall");
        if (this._playerState === "fall" && body.blocked.down) {
            this.setPlayerState(body.velocity.x !== 0 ? "run" : "idle");
        }

        if (this.attackHitbox) this.syncAttackHitbox();
        this.syncHpBarPosition();
    }

    public destroy(fromScene?: boolean): void {
        this.hpBarBg?.destroy();
        this.hpBarFill?.destroy();
        super.destroy(fromScene);
    }
}
