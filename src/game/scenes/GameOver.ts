import { Scene } from "phaser";

export class GameOver extends Scene {
    constructor() { super("GameOver"); }

    create(): void {
        this.add.text(512, 384, "Game Over", {
            fontFamily: "Arial Black",
            fontSize: "64px",
            color: "#ffffff",
            align: "center",
        }).setOrigin(0.5);

        this.input.once("pointerdown", () => this.scene.start("MainMenu"));
    }
}
