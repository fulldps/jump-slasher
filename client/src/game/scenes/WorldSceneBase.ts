import { Scene } from "phaser";
import { Player } from "../objects/Player";
import { InputManager } from "../input/InputManager";

export abstract class WorldSceneBase extends Scene {
    player!: Player;
    platforms!: Phaser.Physics.Arcade.StaticGroup;
    protected inputManager!: InputManager;

    private parallaxLayers: Phaser.GameObjects.TileSprite[] = [];

    constructor(key: string) {
        super(key);
    }

    protected createBase(): void {
        this.inputManager = new InputManager(this);
    }

    protected setParallaxBackground(layerKeys: string[]): void {
        const scrollFactors = [0.0, 0.2, 0.5, 0.8];
        layerKeys.forEach((key, index) => {
            const layer = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, key);
            layer.setOrigin(0, 0);
            layer.setScrollFactor(0);
            layer.setDepth(-10 + index);
            layer.setData("parallaxSpeed", scrollFactors[index] ?? 0);
            this.parallaxLayers.push(layer);
        });
    }

    protected setupPlayer(x: number, y: number): void {
        this.player = new Player(this, x, y);
    }

    update(_time: number, _delta: number): void {
        if (this.player && this.inputManager) {
            const direction = this.inputManager.getDirection();
            this.player.processInput(direction);
            this.player.update();
        }

        if (this.cameras.main) {
            this.parallaxLayers.forEach((layer, index) => {
                const speed = [0.0, 0.2, 0.5, 0.8][index] ?? 0;
                layer.tilePositionX = this.cameras.main.scrollX * speed;
            });
        }
    }

    // Scene имеет shutdown — переопределяем корректно
    shutdown(): void {
        this.parallaxLayers.forEach((l) => l.destroy());
        this.parallaxLayers = [];
        this.inputManager?.destroy();
    }
}
