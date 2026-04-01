import { Scene } from "phaser";

export class Boot extends Scene {
    constructor() {
        super("Boot");
    }

    preload() {
        // Здесь можно загрузить ассеты для самого прелоадера (например, полосу загрузки)
    }

    create() {
        this.scene.start("Preloader");
    }
}