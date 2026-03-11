import { Scene } from "phaser";
import { EventBus } from "../EventBus";

export class MainMenu extends Scene {
    constructor() {
        super("MainMenu");
    }

    create() {
        // Пример текста, чтобы вы видели, что сцена работает (можно удалить)
        this.add
            .text(512, 384, "Main Menu", {
                fontFamily: "Arial Black",
                fontSize: 38,
                color: "#ffffff",
                align: "center",
            })
            .setOrigin(0.5);

        EventBus.emit("current-scene-ready", this);
    }

    changeScene() {
        this.scene.start("Game");
    }
}
