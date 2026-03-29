import { Scene } from "phaser";

export class Preloader extends Scene {
    constructor() {
        super("Preloader");
    }

    preload() {
        this.load.setPath("assets");

        console.log("🔄 Загрузка ассетов...");

        // Фон
        this.load.image("background", "/background/background_layer_1.png");

        // Игрок
        this.load.spritesheet("player", "character/char_blue.png", {
            frameWidth: 56,
            frameHeight: 56,
        });

        // ТАЙЛМАП
        console.log("🔄 Загрузка тайлмапа...");
        this.load.image("maintilemap", "main-tilemap.png");
        this.load.tilemapTiledJSON("map", "maintilemap.json");

        // Отслеживаем прогресс
        this.load.on("progress", (value: number) => {
            console.log(`📊 Прогресс загрузки: ${Math.round(value * 100)}%`);
        });

        this.load.on("complete", () => {
            console.log("✅ Все ассеты загружены!");
        });

        this.load.on("error", (file: any) => {
            console.error("❌ Ошибка загрузки:", file.src);
        });
    }

    create() {
        console.log("🎮 Preloader завершен, переход на Game...");
        this.scene.start("Game");
    }
}
