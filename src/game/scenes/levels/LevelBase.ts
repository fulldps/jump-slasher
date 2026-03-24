import { Scene } from "phaser";

export abstract class LevelBase extends Scene {
    player: Phaser.Physics.Arcade.Sprite;
    platforms: Phaser.Physics.Arcade.StaticGroup;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;

    private currentBg?: Phaser.GameObjects.Image; // Текущий фон

    constructor(key: string) {
        super(key);
    }

    // === ЖИЗНЕННЫЙ ЦИКЛ ===

    protected createBase(): void {
        // Подписываемся на resize ОДИН раз при старте уровня
        this.scale.on("resize", this.handleResize, this);
    }

    shutdown(): void {
        // Отписываемся при уходе со сцены (защита от утечек памяти)
        this.scale.off("resize", this.handleResize, this);
        this.currentBg?.destroy();
        super.shutdown();
    }

    // === УПРАВЛЕНИЕ ФОНОМ ===

    /**
     * Устанавливает или меняет фон
     * @param textureKey - ключ текстуры
     * @param fade - длительность перехода в мс (0 = мгновенно)
     */
    protected setBackground(textureKey: string, fade: number = 0): void {
        // Если фон уже есть и переход не нужен — просто меняем текстуру
        if (this.currentBg && fade === 0) {
            this.currentBg.setTexture(textureKey);
            return;
        }

        // Создаём новый фон
        const newBg = this.add.image(0, 0, textureKey);
        newBg.setOrigin(0, 0);
        newBg.setDisplaySize(this.scale.width, this.scale.height);
        newBg.setScrollFactor(0); // Фон не двигается за камерой
        newBg.setDepth(-10); // Всегда позади всего

        // Логика перехода
        if (this.currentBg && fade > 0) {
            // Плавная смена (Cross-fade)
            newBg.setAlpha(0);

            this.tweens.add({
                targets: newBg,
                alpha: 1,
                duration: fade,
                ease: "Linear",
            });

            this.tweens.add({
                targets: this.currentBg,
                alpha: 0,
                duration: fade,
                ease: "Linear",
                onComplete: () => this.currentBg?.destroy(),
            });
        } else if (this.currentBg) {
            // Мгновенная замена
            this.currentBg.destroy();
        }

        this.currentBg = newBg;
    }

    /** Обновляет размер фона при изменении окна */
    private handleResize(gameSize: Phaser.Structs.Size): void {
        this.currentBg?.setDisplaySize(gameSize.width, gameSize.height);
    }

    // === ОБЩИЙ КОД ДЛЯ ВСЕХ УРОВНЕЙ ===

    protected setupPlayer(x: number, y: number) {
        this.player = this.physics.add.sprite(x, y, "player");
        this.player.setCollideWorldBounds(false);
        this.player.setBounce(0.2);
        this.player.setDepth(1);
    }

    protected setupControls() {
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }
    }

    protected createAnimations() {
        this.anims.create({
            key: "run",
            frames: this.anims.generateFrameNames("player", {
                start: 12,
                end: 15,
            }),
            frameRate: 10,
            repeat: -1,
        });
        this.anims.create({
            key: "idle",
            frames: [{ key: "player", frame: 1 }],
            frameRate: 20,
        });
        this.anims.create({
            key: "jump",
            frames: [{ key: "player", frame: 4 }],
            frameRate: 20,
        });
    }

    protected handelPlayerMovements() {
        if (!this.cursors || !this.player) return;

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
            this.player.anims.play("run", true);
            this.player.setFlipX(true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
            this.player.anims.play("run", true);
            this.player.setFlipX(false);
        } else if (this.cursors.up.isDown) {
            this.player.setVelocityY(-350);
        } else {
            this.player.setVelocityX(0);
            this.player.anims.play("idle", true);
        }
        if (this.cursors.up.isDown && this.player.body?.blocked.down) {
            this.player.setVelocityY(-350);
        }
    }

    // === АБСТРАКТНЫЕ МЕТОДЫ ===

    protected abstract buildLevel(): void;

    update() {
        this.handelPlayerMovements();
    }
}
