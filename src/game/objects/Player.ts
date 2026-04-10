type PlayerState =
    | "idle"
    | "run"
    | "jump"
    | "attack"
    | "block"
    | "fall"
    | "hurt"
    | "dead";

const forbidden = {
    fall: ["jump"],
    attack: ["run"],
    hurt: ["run", "jump", "attack"],
    dead: ["idle", "run", "fall", "jump", "attack", "block", "hurt"],
};

export class Player extends Phaser.Physics.Arcade.Sprite {
    private speed: number = 120;
    private jumpForce: number = -260;
    private attackDamage: number = 20;
    private attackDuration: number = 200;
    private attackCooldownTime: number = 500;

    private state: PlayerState = "idle";

    private attackHitbox?: Phaser.Physics.Arcade.Rectangle;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, "player");

        scene.physics.world.enable(this);
        this.body?.setSize(26, 40); // 3. Настраиваем хитбокс
        this.body?.setOffset(15, 16);
        scene.add.existing(this);

        this.setupPhysics();
        this.createAnimations();
    }

    private setupPhysics() {
        this.setCollideWorldBounds(true);
        this.setDepth(2);
    }

    public createAnimations() {
        if (!this.anims.exists("run")) {
            this.anims.create({
                key: "run",
                frames: this.anims.generateFrameNumbers("player", {
                    start: 16,
                    end: 23,
                }),
                frameRate: 10,
                repeat: -1,
            });
        }

        if (!this.anims.exists("idle")) {
            this.anims.create({
                key: "idle",
                frames: this.anims.generateFrameNumbers("player", {
                    start: 0,
                    end: 5,
                }),
                frameRate: 7,
                repeat: -1,
            });
        }

        if (!this.anims.exists("jump")) {
            this.anims.create({
                key: "jump",
                frames: this.anims.generateFrameNumbers("player", {
                    start: 24,
                    end: 31,
                }),
                frameRate: 10,
                repeat: 0,
            });
        }

        if (!this.anims.exists("block")) {
            this.anims.create({
                key: "block",
                frames: [{ key: "player", frame: 9 }],
                frameRate: 1,
                repeat: -1,
            });
        }

        if (!this.anims.exists("attack")) {
            this.anims.create({
                key: "attack",
                frames: this.anims.generateFrameNumbers("player", {
                    start: 8,
                    end: 13,
                }),
                frameRate: 10,
                repeat: -1,
            });
        }
    }

    public setState(newState: PlayerState): void {
        if (this.state === newState) {
            return;
        }
        if (forbidden[newState] && forbidden[newState].includes(this.state)) {
            return;
        }

        this.state = newState;
        this.anims.play(newState, true);
    }

    public processInput(direction: {
        x: number;
        y: number;
        jump: boolean;
        attack: boolean;
        block: boolean;
    }): void {
        if (direction.attack) {
            this.handleAttack(direction);
        } else if (direction.jump && this.body?.blocked.down) {
            this.setState("jump");
            this.setVelocityY(this.jumpForce);
        } else if (direction.x !== 0) {
            this.setState("run");
            if (direction.x < 0) {
                this.setVelocityX(-this.speed);
                this.setFlipX(true);
            } else {
                this.setVelocityX(this.speed);
                this.setFlipX(false);
            }
        } else if (this.body?.blocked.down) {
            this.setState("idle");
            this.setVelocityX(0);
        }
    }

    private handleAttack(direction: { attack: boolean }) {
        if (direction.attack) {
            this.setState("attack");
            console.log("attack");
            this.setVelocityX(0);
            this.anims.play("attack", true);
        }
    }

    private handleBlock(direction: { block: boolean }) {
        if (direction.block) {
            this.setState("block");
            console.log("block");
            this.setVelocityX(0);
            this.anims.play("block", true);
        }
    }

    private handleDead(direction: { dead: boolean }) {}
}
