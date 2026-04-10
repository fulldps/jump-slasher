import { Scene } from "phaser";
import { Player } from "../objects/Player";
import { InputManager } from "../input/InputManager";

export abstract class WorldSceneBase extends Scene {
    player: Player;
    platforms: Phaser.Physics.Arcade.StaticGroup;
    protected inputManager: InputManager;

    private parallaxLayers: Phaser.GameObjects.TileSprite[] = []; // Текущий фон

    constructor(key: string) {
        super(key);
    }

    // === ЖИЗНЕННЫЙ ЦИКЛ ===

    protected createBase(): void {
        this.inputManager = new InputManager(this);
    }

    // === PARALLAX BACKGROUND  ===

    protected setParallaxBackground(layerKeys: string[]): void {
        const scrollFactors = [0.0, 0.2, 0.5, 0.8];

        layerKeys.forEach((key, index) => {
            const layer = this.add.tileSprite(
                0,
                0,
                this.scale.width,
                this.scale.height,
                key,
            );
            layer.setOrigin(0, 0);
            layer.setScrollFactor(0);
            layer.setDepth(-10 + index);

            layer.setData("parallaxSpeed", scrollFactors[index] || 0);

            this.parallaxLayers.push(layer);
        });
    }

    // === ОБЩИЙ КОД ДЛЯ ВСЕХ УРОВНЕЙ ===
    protected setupControls() {}

    protected setupPlayer(x: number, y: number) {
        this.player = new Player(this, x, y);
        this.setupControls();
    }

    // === АБСТРАКТНЫЕ МЕТОДЫ ===
    // protected abstract buildLevel(): void {}

    update() {
        if (this.player && this.inputManager) {
            const direction = this.inputManager.getDirection();
            this.player.processInput(direction);
            // this.player.update(time, delta);
        }

        if (this.cameras.main) {
            this.parallaxLayers.forEach((layer, index) => {
                const speed = [0.0, 0.2, 0.5, 0.8][index] || 0;
                layer.tilePositionX = this.cameras.main.scrollX * speed;
            });
        }
    }

    shutdown(): void {
        this.parallaxLayers.forEach((layer) => {
            layer.destroy();
        });
        this.parallaxLayers = [];
        this.inputManager?.destroy();
        super.shutdown();
    }
}
