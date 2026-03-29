import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { Player } from "../objects/Player";

export class Game extends Scene {
    player: Player;
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
