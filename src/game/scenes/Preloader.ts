import { Scene } from "phaser";

export class Preloader extends Scene {
    constructor() {
        super("Preloader");
    }

    preload() {
        this.load.setPath("assets");

        // Фон
        this.load.image("background", "bg.png"); // ✅ исправил опечатку

        // Игрок
        this.load.spritesheet("player", "characters.png", {
            frameWidth: 32,
            frameHeight: 32,
        });

        // Платформы
        this.load.image("ground", "ground.png");
        this.load.spritesheet("platform", "platform.png", {
            frameWidth: 32,
            frameHeight: 32,
        });
    }

    create() {
        this.scene.start("Game"); // Game → Level1
    }
}
