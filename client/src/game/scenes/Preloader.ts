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

        // Тайлмап
        this.load.image("maintilemap", "terra-tilemap.png");
        this.load.tilemapTiledJSON("map", "terramap.json");

        // ── Экран загрузки (пиксель-арт стиль) ──

        const w = this.scale.width;
        const h = this.scale.height;

        // Тёмный фон
        this.add.rectangle(w / 2, h / 2, w, h, 0x0d0d1a);

        // Заголовок
        this.add
            .text(w / 2, h / 2 - 60, "JUMP SLASHER", {
                fontFamily: "'Press Start 2P', monospace",
                fontSize: "28px",
                color: "#ffffff",
                stroke: "#4c1d95",
                strokeThickness: 6,
            })
            .setOrigin(0.5);

        // Надпись LOADING
        const loadingText = this.add
            .text(w / 2, h / 2 + 10, "LOADING...", {
                fontFamily: "'Press Start 2P', monospace",
                fontSize: "11px",
                color: "#7c3aed",
            })
            .setOrigin(0.5);

        // Мигание
        this.time.addEvent({
            delay: 400,
            loop: true,
            callback: () => loadingText.setVisible(!loadingText.visible),
        });

        // Прогресс-бар (пиксельный)
        this.add
            .rectangle(w / 2, h / 2 + 60, 300, 16, 0x1e1b4b)
            .setStrokeStyle(2, 0x7c3aed);
        const barFill = this.add
            .rectangle(w / 2 - 149, h / 2 + 60, 2, 12, 0x7c3aed)
            .setOrigin(0, 0.5);

        // Процент
        const pctText = this.add
            .text(w / 2, h / 2 + 88, "0%", {
                fontFamily: "'Press Start 2P', monospace",
                fontSize: "9px",
                color: "#4b5563",
            })
            .setOrigin(0.5);

        this.load.on("progress", (value: number) => {
            barFill.setSize(Math.max(2, 298 * value), 12);
            pctText.setText(`${Math.round(value * 100)}%`);
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

        // Переходим в MainMenu, а не сразу в WorldScene
        this.scene.start("MainMenu");
    }
}
