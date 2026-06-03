type PlayerState =
    | "idle"
    | "run"
    | "jump"
    | "attack"
    | "block"
    | "fall"
    | "hurt"
    | "dead";

const MAX_HP = 100;

// Состояния, которые нельзя перебить обычной локомоцией (idle/run/jump/fall).
// Удар/урон/смерть выходят из них только через явный forceState / recoverState.
const LOCKED_STATES: ReadonlySet<PlayerState> = new Set<PlayerState>([
    "attack",
    "hurt",
    "dead",
]);

export class Player extends Phaser.Physics.Arcade.Sprite {
    private speed         = 120;
    private jumpForce     = -260;
    private canAttack     = true;
    private isAttacking   = false;
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
    // Спрайт-лист char_blue: 8 колонок × 7 рядов (56 кадров).
    //   ряд 0 (0-7)   — idle
    //   ряд 1 (8-15)  — attack (кадр 9 = block)
    //   ряд 2 (16-23) — run
    //   ряд 3 (24-31) — jump
    //   ряд 6 (48-55) — лежащий персонаж (смерть)

    public createAnimations(): void {
        const defs = [
            { key: "idle",   start: 0,  end: 5,  frameRate: 7,  repeat: -1 },
            { key: "run",    start: 16, end: 23, frameRate: 10, repeat: -1 },
            { key: "jump",   start: 24, end: 31, frameRate: 10, repeat: 0  },
            // fall — держим хвост анимации прыжка (воздушная поза), пока игрок снижается
            { key: "fall",   start: 30, end: 31, frameRate: 4,  repeat: -1 },
            { key: "attack", start: 8,  end: 13, frameRate: 18, repeat: 0  },
            { key: "dead",   start: 48, end: 51, frameRate: 8,  repeat: 0  },
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

    private isLocked(): boolean {
        return LOCKED_STATES.has(this._playerState);
    }

    private playStateAnim(state: PlayerState): void {
        // Проигрываем только существующую анимацию; для состояний без своей
        // анимации (hurt) просто оставляем текущий кадр + визуальный эффект.
        if (this.anims.exists(state)) this.anims.play(state, true);
    }

    /** Обычный переход локомоции: не может перебить удар/урон/смерть. */
    public setPlayerState(next: PlayerState): void {
        if (this._playerState === next) return;
        if (this.isLocked()) return;
        this._playerState = next;
        this.playStateAnim(next);
    }

    /** Принудительный переход (удар/урон/смерть/респавн) — игнорирует блокировку. */
    private forceState(next: PlayerState): void {
        this._playerState = next;
        this.playStateAnim(next);
    }

    /** Пересчитать состояние локомоции из физики (после удара/урона). */
    private recoverState(): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (!body.blocked.down) {
            this.forceState(body.velocity.y > 10 ? "fall" : "jump");
        } else {
            this.forceState(Math.abs(body.velocity.x) > 1 ? "run" : "idle");
        }
    }

    // ── УРОН / СМЕРТЬ / РЕСПАВН ──────────────────────────────

    public takeDamage(hp: number): void {
        this._hp = Math.max(0, hp);
        this.redrawHpFill();

        if (this._hp <= 0) {
            this.die();
            return;
        }

        // Урон прерывает удар и кратко блокирует управление (hitstun)
        this.cancelAttack();
        this.forceState("hurt");
        this.scene.tweens.add({
            targets: this,
            alpha: 0.3,
            duration: 80,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                this.setAlpha(1);
                if (this._playerState === "hurt") this.recoverState();
            },
        });
    }

    private die(): void {
        this.cancelAttack();
        this.forceState("dead");
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
        this.cancelAttack();
        this.canAttack = true;
        this._hp = hp;
        this._playerState = "idle";
        this.setPosition(x, y);
        this.setVelocity(0, 0);
        this.setAlpha(1);
        this.setVisible(true);
        this.anims.play("idle", true);
        this.redrawHpFill();
        this.hpBarBg.setVisible(true);
        this.hpBarFill.setVisible(true);
    }

    // ── INPUT ────────────────────────────────────────────────

    public processInput(dir: { x: number; y: number; jump: boolean; attack: boolean; block: boolean }): void {
        // Урон и смерть полностью блокируют управление.
        if (this._playerState === "hurt" || this._playerState === "dead") return;

        const body = this.body as Phaser.Physics.Arcade.Body;
        const onGround = body.blocked.down;

        // ── Удар: из любого состояния, на земле и в воздухе, как только вызван ──
        if (dir.attack && this.canAttack && !this.isAttacking) {
            this.startAttack();
        }

        // ── Горизонтальное движение: доступно всегда, в т.ч. во время удара
        //    и в воздухе (сохраняем воздушный импульс, если клавиш нет) ──
        if (dir.x !== 0) {
            this.setVelocityX(dir.x * this.speed);
            this.setFlipX(dir.x < 0);
        } else if (onGround) {
            this.setVelocityX(0);
        }

        // ── Прыжок: только с земли и не во время удара ──
        if (dir.jump && onGround && !this.isAttacking) {
            this.doJump();
        }

        // ── Визуальное состояние локомоции (не перебивает активный удар) ──
        if (!this.isAttacking) {
            this.updateLocomotionState(onGround, dir.x);
        }
    }

    private updateLocomotionState(onGround: boolean, dirX: number): void {
        const body = this.body as Phaser.Physics.Arcade.Body;

        // Подъём (включая кадр самого прыжка) — jump; снижение в воздухе — fall.
        if (body.velocity.y < -10) { this.setPlayerState("jump"); return; }
        if (!onGround)             { this.setPlayerState(body.velocity.y > 10 ? "fall" : "jump"); return; }

        this.setPlayerState(dirX !== 0 ? "run" : "idle");
    }

    private doJump(): void {
        this.setVelocityY(this.jumpForce);
        this.setPlayerState("jump");
    }

    // ── АТАКА ────────────────────────────────────────────────

    private startAttack(): void {
        this.isAttacking = true;
        this.canAttack = false;

        // Принудительно входим в атаку из любого состояния и сразу анимируем.
        this.forceState("attack");

        // Хитбокс активен только часть анимации удара.
        this.spawnAttackHitbox();
        this.scene.time.delayedCall(this.attackDuration, () => {
            this.attackHitbox?.destroy();
            this.attackHitbox = undefined;
        });

        // Конец удара привязан к завершению анимации — после него
        // состояние пересчитывается из физики (земля/воздух/движение).
        this.once(
            Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + "attack",
            this.endAttack,
            this,
        );

        // Кулдаун до следующего удара.
        this.scene.time.delayedCall(this.attackCooldownTime, () => {
            this.canAttack = true;
        });

        this.emit("attacked");
    }

    private endAttack(): void {
        if (this._playerState !== "attack") return;
        this.isAttacking = false;
        this.recoverState();
    }

    /** Прерывает текущий удар (например, при получении урона). */
    private cancelAttack(): void {
        this.isAttacking = false;
        this.off(
            Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + "attack",
            this.endAttack,
            this,
        );
        this.attackHitbox?.destroy();
        this.attackHitbox = undefined;
    }

    private spawnAttackHitbox(): void {
        const zone = new Phaser.GameObjects.Zone(this.scene, this.x, this.y, 40, 30);
        this.attackHitbox = zone;
        this.scene.add.existing(zone);
        this.scene.physics.world.enable(zone);
        (zone.body as Phaser.Physics.Arcade.Body).moves = false;
        this.syncAttackHitbox();
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
        if (this.attackHitbox) this.syncAttackHitbox();
        this.syncHpBarPosition();
    }

    public destroy(fromScene?: boolean): void {
        this.cancelAttack();
        this.hpBarBg?.destroy();
        this.hpBarFill?.destroy();
        super.destroy(fromScene);
    }
}
