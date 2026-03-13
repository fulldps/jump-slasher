import { Scene } from "phaser";

export abstract class LevelBase extends Scene {
    player: Phaser.Physics.Arcade.Sprite;
    platforms: Phaser.Physics.Arcade.StaticGroup;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor(key: string) {
        super(key);
    }

    // Общий код для всех уровней

    protected setupPlayer(x: number, y: number) {
        this.player = this.physics.add.sprite(x, y, "player");
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.2); // Сила отскока персонажа
        this.player.setDepth(1); // Глубина объекта на сцене
    }

    protected setupControls() {
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }
    }

    protected createAnimations() {
        this.anims.create({
            key: "run",
            frames: this.anims.generateFrameNames("player", {
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
    }

    protected handelPlayerMovements() {
        if (!this.cursors || !this.player) return;

        // if (!this.player.body?.blocked.down) {
        //     this.player.anims.play("jump", true);
        // } else {
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
        if (this.cursors.up.isDown && this.player.body?.blocked.down) {
            this.player.setVelocityY(-350);
        }
        // }
    }

    protected abstract buildLevel(): void;
    update() {
        this.handelPlayerMovements();
    }
}
