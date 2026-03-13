import { Scene } from "phaser";
import { EventBus } from "../EventBus";

export class Game extends Scene {
    player: Phaser.Physics.Arcade.Sprite;
    // enemy: Phaser.Physics.Arcade.Sprite;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor() {
        super("Game");
    }

    create() {
        this.scene.start("Level1");

        EventBus.emit("current-scene-ready", this);
    }
}
