import { Scene } from "phaser";
import { EventBus } from "../EventBus";

export class GameOver extends Scene {
    constructor() {
        super("GameOver");
    }

    create() {
        // Временный текст (можно удалить)
        this.add
            .text(512, 384, "Game Over", {
                fontFamily: "Arial Black",
                fontSize: 64,
                color: "#ffffff",
                align: "center",
            })
            .setOrigin(0.5);

        EventBus.emit("current-scene-ready", this);
    }

    changeScene() {
        this.scene.start("MainMenu");
    }
}
