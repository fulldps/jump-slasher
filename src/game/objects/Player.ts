export class Player extends Phaser.Physics.Arcade.Sprite {
    private speed: number = 160;
    private jumpForce: number = -350;

    constructor(scene: Phaser.Scene, x?: number, y?: number) {
        super(scene, x, y, "player");
        scene.add.existing(this);
        this.setupPhysics();
        this.createAnimations();
    }

    private setupPhysics() {
        this.setCollideWorldBounds(true);
        this.setBounce(0.2);
        this.setDepth(2);
    }

    public createAnimations() {
        this.anims.create({
            key: "run",
            frames: this.anims.generateFrameNumbers("player", {
                start: 16,
                end: 22,
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
            frames: [{ key: "player", frame: 13 }],
            frameRate: 20,
        });
    }

    public processInput(direction: {
        x: number;
        y: number;
        jump: boolean;
    }): void {
        if (direction.x === -1) {
            this.setVelocityX(-160);
        } else if (direction.x === 1) {
            this.setVelocityX(160);
        }
    }
}
