import { Scene } from "phaser";

export class Preloader extends Scene {
    constructor() {
        super("Preloader");
    }

    preload() {
        this.load.setPath("assets");

        // Фон
        this.load.image("bg_1", "background/bg_1.png");
        this.load.image("bg_2", "background/bg_2.png");
        this.load.image("bg_3", "background/bg_3.png");
        this.load.image("bg_4", "background/bg_4.png");

        // Игрок
        this.load.spritesheet("player", "character/char_blue.png", {
            frameWidth: 56,
            frameHeight: 56,
        });

        // ТАЙЛМАП
        console.log("🔄 Загрузка тайлмапа...");

        this.load.image("maintilemap", "terra-tilemap.png");
        this.load.tilemapTiledJSON("map", "terramap.json");

        // Отслеживаем прогресс
        this.load.on("progress", (value: number) => {
            console.log(`📊 Прогресс загрузки: ${Math.round(value * 100)}%`);
        });

        this.load.on("complete", () => {
            console.log("Все ассеты загружены!");
        });

        this.load.on("error", (file: any) => {
            console.error("Ошибка загрузки:", file.src);
        });
    }

    create() {
        if (!this.cache.tilemap.exists("map")) {
            console.error("No tilemap in cache");
            return;
        }

        if (!this.textures.exists("maintilemap")) {
            console.error("No texture in cache");
            return;
        }

        console.log("🎮 Preloader завершен, переход на Game...");
        this.scene.start("Game");
    }
}
