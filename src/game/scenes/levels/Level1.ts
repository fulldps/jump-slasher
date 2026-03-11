import { Scene } from "phaser";
import { EventBus } from "../../EventBus";

export class Level1 extends Scene {
    player: Phaser.Physics.Arcade.Sprite;
    platforms: Phaser.Physics.Arcade.StaticGroup;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor() {
        super("Level1");
    }

    create() {
        // Фон
        this.add.image(512, 384, "background");

        // == Platforms ==
        this.platforms = this.physics.add.staticGroup();

        // Ground
        this.platforms.create(512, 740, "ground").setScale(2, 1).refreshBody;

        // Platforms
        this.platforms.create(300, 600, "platform");
        this.platforms.create(700, 500, "platform");
        this.platforms.create(200, 400, "platform");
        this.platforms.create(600, 300, "platform");

        // Player
        this.player = this.physics.add.sprite(100, 600, "player");
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.2);

        // Collisions
        this.physics.add.collider(this.player, this.platforms);
    }
}
