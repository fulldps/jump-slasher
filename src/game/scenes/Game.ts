import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import PhaserGame from "../../PhaserGame.vue";

export class Game extends Scene {
    player: Phaser.Physics.Arcade.Sprite;
    // enemy: Phaser.Physics.Arcade.Sprite;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor() {
        super("Game");
    }

    create() {
        // Здесь будет ваша игровая логика
        this.cameras.main.setBackgroundColor(0x0a3861);
        this.add.image(512, 370, "background");

        // this.keyA = this.input.keyboard.addKey(
        //     Phaser.Input.Keyboard.KeyCodes.A,
        // );

        this.player = this.physics.add.sprite(512, 384, "player");
        // this.enemy = this.physics.add.sprite(412, 384, "enemy");

        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.2);

        this.anims.create({
            key: "run",
            frames: this.anims.generateFrameNumbers("player", {
                start: 12,
                end: 15,
            }),
            frameRate: 10,
            repeat: -1,
        });

        this.anims.create({
            key: "idle",
            frames: [{ key: "player", frame: 1 }],
            frameRate: 20,
        });

        this.anims.create({
            key: "jump",
            frames: [{ key: "player", frame: 4 }],
            frameRate: 20,
        });

        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }

        // this.enemy.setCollideWorldBounds(true);
        // this.enemy.setBounce(0.2);

        EventBus.emit("current-scene-ready", this);
    }

    update() {
        if (!this.cursors || !this.player) return;

        if (!this.player.body?.blocked.down) {
            this.player.anims.play("jump", true);
        } else {
            if (this.cursors.left.isDown) {
                this.player.setVelocityX(-160);
                this.player.anims.play("run", true);
                this.player.setFlipX(true);
            } else if (this.cursors.right.isDown) {
                this.player.setVelocityX(160);
                this.player.anims.play("run", true);
                this.player.setFlipX(false);
            } else if (this.cursors.up.isDown) {
                this.player.setVelocityY(-350);
            } else {
                this.player.setVelocityX(0);
                this.player.anims.play("idle", true);
            }
        }

        // if (!this.enemy.body?.blocked.down) {
        //     this.enemy.anims.play("jump", true);
        // } else {
        //     if (this.keyA.isDown) {
        //         this.enemy.setVelocityX(-160);
        //     }
        // }
    }

    changeScene() {
        this.scene.start("GameOver");
    }
}

const config = {
    type: Phaser.AUTO,
    background: "/bg.png",
};

const game = new Phaser.Game(config);
