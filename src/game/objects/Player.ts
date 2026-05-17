type PlayerState =
    | "idle"
    | "run"
    | "jump"
    | "attack"
    | "block"
    | "fall"
    | "hurt"
    | "dead";

const forbidden: Partial<Record<PlayerState, PlayerState[]>> = {
    fall: ["jump"],
    attack: ["run"],
    hurt: ["run", "jump", "attack"],
    dead: ["idle", "run", "fall", "jump", "attack", "block", "hurt"],
};

export class Player extends Phaser.Physics.Arcade.Sprite {
    private speed: number = 120;
    private jumpForce: number = -260;
    private attackTimer: number = 0;
    private canAttack: boolean = true;
    private attackDamage: number = 20;
    private attackDuration: number = 200;
    private attackCooldownTime: number = 500;

    private state: PlayerState = "idle";

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, "player");

        scene.physics.world.enable(this);
        this.body?.setSize(26, 40);
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
        const anims: {
            key: string;
            start: number;
            end: number;
            frameRate: number;
            repeat: number;
        }[] = [
            { key: "run", start: 16, end: 23, frameRate: 10, repeat: -1 },
            { key: "idle", start: 0, end: 5, frameRate: 7, repeat: -1 },
            { key: "jump", start: 24, end: 31, frameRate: 10, repeat: 0 },
            { key: "attack", start: 8, end: 13, frameRate: 10, repeat: -1 },
        ];

        for (const anim of anims) {
            if (!this.anims.exists(anim.key)) {
                this.anims.create({
                    key: anim.key,
                    frames: this.anims.generateFrameNumbers("player", {
                        start: anim.start,
                        end: anim.end,
                    }),
                    frameRate: anim.frameRate,
                    repeat: anim.repeat,
                });
            }
        }

        if (!this.anims.exists("block")) {
            this.anims.create({
                key: "block",
                frames: [{ key: "player", frame: 9 }],
                frameRate: 1,
                repeat: -1,
            });
        }
    }

    public setState(newState: PlayerState): void {
        if (this.state === newState) return;
        if (forbidden[newState]?.includes(this.state)) return;

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
        if (
            this.state === "attack" ||
            this.state === "hurt" ||
            this.state === "dead"
        )
            return;

        if (direction.attack && this.canAttack) {
            this.startAttack();
        } else if (direction.block) {
            this.handleBlock();
        } else if (direction.jump && this.body?.blocked.down) {
            this.setState("jump");
            this.setVelocityY(this.jumpForce);
        } else if (direction.x !== 0) {
            this.setState("run");
            this.setVelocityX(direction.x * this.speed);
            this.setFlipX(direction.x < 0);
        } else {
            this.setVelocityX(0);
            if (this.body?.blocked.down) {
                this.setState("idle");
            }
        }
    }

    private startAttack(): void {
        this.setState("attack");
        this.setVelocityX(0);
        this.attackTimer = 0;
        this.canAttack = false;
    }

    private handleBlock(): void {
        this.setState("block");
        this.setVelocityX(0);
    }

    private handleJump(): void {
        if ((this.body as Phaser.Physics.Arcade.Body).velocity.y > 0) {
            this.setState("fall");
        }
    }

    private handleFall(): void {
        if (this.body?.blocked.down) {
            const vx = (this.body as Phaser.Physics.Arcade.Body).velocity.x;
            this.setState(vx !== 0 ? "run" : "idle");
        }
    }

    private handleAttackUpdate(delta: number): void {
        this.attackTimer += delta;

        if (this.attackTimer >= this.attackDuration) {
            this.setState("idle");

            // cooldown ��। ᫥���饩 �⠪��
            this.scene.time.delayedCall(this.attackCooldownTime, () => {
                this.canAttack = true;
            });
        }
    }

    public update(delta: number): void {
        switch (this.state) {
            case "jump":
                this.handleJump();
                break;
            case "attack":
                this.handleAttackUpdate(delta);
                break;
            case "fall":
                this.handleFall();
                break;
        }
    }
}
