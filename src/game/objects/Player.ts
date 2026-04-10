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
    private attackTimer: number = 0;
    private canAttack: boolean = true;
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
        if (
            this.state === "attack" ||
            this.state === "hurt" ||
            this.state === "dead"
        ) {
            return;
        } else {
            if (direction.attack && this.canAttack) this.startAttack();
            else if (direction.jump && this.body?.blocked.down)
                this.handleJump();
            else if (direction.x !== 0) this.setState("run")
                this.handleJump();
            else if (direction.jump && this.body?.blocked.down)
                this.handleJump();
        }
    }

//TODO handleRun()
    //
    private startAttack() {
        this.setState("attack");
        this.setVelocityX(0);
        this.attackTimer = 0;
        this.canAttack = false;
    }

    private handleAttack() {
        this.setState("attack");
        console.log("attack");
        this.setVelocityX(0);
        this.anims.play("attack", true);
    }

    private handleBlock() {
        this.setState("block");
        console.log("block");
        this.setVelocityX(0);
        this.anims.play("block", true);
    }

    private handleJump(): void {
        if ((this.body as Phaser.Physics.Arcade.Body).velocity.y > 0) {
            this.setState("fall");
        }
    }

    private handleFall(): void {
        if (this.body?.blocked.down) {
            if ((this.body as Phaser.Physics.Arcade.Body).velocity.x !== 0) {
                this.setState("run");
            } else {
                this.setState("idle");
            }
        }
    }

    private handleHurt(): void {}

    private handleDead() {}
    public update(delta: number) {
        switch (this.state) {
            case "jump":
                this.handleJump();
                break;
            case "attack":
                this.handleAttack(delta);
                break;
            case "dead":
                this.handleDead();
                break;
            case "block":
                this.handleBlock();
                break;
            case "hurt":
                this.handleHurt(delta);
                break;
            case "fall":
                this.handleFall();
                break;
        }
    }
}
