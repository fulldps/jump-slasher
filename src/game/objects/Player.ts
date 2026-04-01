type PlayerState = "idle" | "run" | "jump" | "attack" | "block";

export class Player extends Phaser.Physics.Arcade.Sprite {
    private speed: number = 120;
    private jumpForce: number = -460;
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

    public processInput(direction: {
        x: number;
        y: number;
        jump: boolean;
        attack: boolean;
        block: boolean;
    }): void {
        if (direction.block && !this.isAttacking) {
            this.startBlock();
        } else {
            this.stopBlock();

            if (!this.isAttacking) {
                this.handleMovement(direction);
            }

            if (direction.attack && this.canAttack) {
                this.startAttack();
            }
        }

        if (this.isAttacking) {
            this.handleAttack(direction);
        }
    }

    private startAttack() {}
    private stopAttack() {}
    private startBlock() {}
    private stopBlock() {}

    private handleMovement(direction: { x: number; y: number; jump: boolean }) {
        // horizontal movement
        if (direction.x === -1) {
            this.setVelocityX(-this.speed);
            if (this.body?.blocked.down) {
                this.anims.play("run", true);
            }
            this.setFlipX(true);
        } else if (direction.x === 1) {
            this.setVelocityX(this.speed);
            if (this.body?.blocked.down) {
                this.anims.play("run", true);
            }
            this.setFlipX(false);
        } else {
            this.setVelocityX(0);
        }

        // jump
        if (direction.jump && this.body?.blocked.down && this.canJump) {
            this.setVelocityY(this.jumpForce);
            this.anims.play("jump", true);
            this.canJump = false;
            return;
        }

        if (!this.body?.blocked.down) {
            this.canJump = false;
            this.anims.play("jump", true);
        } else {
            this.canJump = true;
            if (direction.x !== 0) {
                this.anims.play("run", true);
            } else {
                this.anims.play("idle", true);
            }
        }
    }

    private handleAttack(direction: { attack: boolean }) {
        if (direction.attack) {
            this.anims.play("attack", true);
        }
    }
}
