import { Scene } from "phaser";
import { EventBus } from "../EventBus";

export class Game extends Scene {
    constructor() {
        super("Game");
    }

    init() {
        // Проверка: если тайлмап не в кэше — запускаем Preloader
        if (!this.cache.tilemap.exists("map")) {
            console.warn("Ассеты не загружены, запускаем Preloader...");
            this.scene.start("Preloader");
            return;
        }
    }

    create() {
        console.log("Game.create() — ассеты готовы, запускаем Level1");
        this.scene.start("WorldScene");
        EventBus.emit("current-scene-ready", this);
    }
}
