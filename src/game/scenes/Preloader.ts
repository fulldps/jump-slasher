import { Scene } from "phaser";

export class Preloader extends Scene {
    constructor() {
        super("Preloader");
    }

    init() {
        // Инициализация (например, создание графики для полосы загрузки)
    }

    preload() {
        // Загружайте ассеты здесь:
        // this.load.setPath("assets");
        // this.load.image("myImage", "image.png");
        this.load.image("backfround", "bg.png");
        this.load.setPath("assets");
        this.load.spritesheet("player", "characters.png", {
            frameWidth: 32,
            frameHeight: 32,
        });
    }

    create() {
        // Когда всё загружено, переходим в меню
        this.scene.start("Game");
    }
}
