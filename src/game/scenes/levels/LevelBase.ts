import { Scene } from "phaser";
import { Player } from "../../objects/Player";
import { InputManager } from "../../input/InputManager";

export abstract class LevelBase extends Scene {
    player: Player;
    platforms: Phaser.Physics.Arcade.StaticGroup;
    protected inputManager: InputManager;

    private currentBg?: Phaser.GameObjects.Image; // Текущий фон

    constructor(key: string) {
        super(key);
    }

    // === ЖИЗНЕННЫЙ ЦИКЛ ===

    protected createBase(): void {
        // Подписываемся на resize ОДИН раз при старте уровня
        this.scale.on("resize", this.handleResize, this);
        this.inputManager = new InputManager(this);
    }

    // === УПРАВЛЕНИЕ ФОНОМ ===

    // Устанавливает или меняет фон
    // @param textureKey - ключ текстуры
    // @param fade - длительность перехода в мс (0 = мгновенно)
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

    // Обновляет размер фона при изменении окна
    private handleResize(gameSize: Phaser.Structs.Size): void {
        this.currentBg?.setDisplaySize(gameSize.width, gameSize.height);
    }

    // === ОБЩИЙ КОД ДЛЯ ВСЕХ УРОВНЕЙ ===
    protected setupControls() {}

    protected setupPlayer(x: number, y: number) {
        this.player = new Player(this, x, y);
        this.player.setScale(2).refreshBody();
        this.setupControls();
    }

    // === АБСТРАКТНЫЕ МЕТОДЫ ===
    // protected abstract buildLevel(): void {}

    update() {
        if (this.player && this.inputManager) {
            const direction = this.inputManager.getDirection();
            this.player.processInput(direction);
        }
    }

    shutdown(): void {
        // Отписываемся при уходе со сцены (защита от утечек памяти)
        this.scale.off("resize", this.handleResize, this);
        this.currentBg?.destroy();
        this.inputManager.destroy();
        super.shutdown();
    }
}
