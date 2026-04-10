export class InputManager {
    protected keys: { [key: string]: Phaser.Types.Input.Keyboard.Key };

    constructor(scene: Phaser.Scene) {
        if (scene.input.keyboard) {
            this.keys = scene.input.keyboard.addKeys({
                up: Phaser.Input.Keyboard.KeyCodes.W,
                down: Phaser.Input.Keyboard.KeyCodes.S,
                left: Phaser.Input.Keyboard.KeyCodes.A,
                right: Phaser.Input.Keyboard.KeyCodes.D,
                attack: Phaser.Input.Keyboard.KeyCodes.J,
                block: Phaser.Input.Keyboard.KeyCodes.K,
            });
        }
    }

    public getDirection(): {
        x: number;
        y: number;
        jump: boolean;
        attack: boolean;
        block: boolean;
    } {
        let x: number = 0;
        let y: number = 0;

        if (this.keys?.left.isDown) x = -1;
        else if (this.keys?.right.isDown) x = 1;

        if (this.keys?.up.isDown) y = -1;
        else if (this.keys?.down.isDown) y = 1;

        return {
            x: x,
            y: y,
            jump: this.keys?.up.isDown ?? false,
            attack: Phaser.Input.Keyboard.JustDown(this.keys?.attack) ?? false,
            block: this.keys?.block.isDown ?? false,
        };
    }

    public destroy(): void {
        if (this.keys) {
            Object.values(this.keys).forEach((key) => {
                key?.removeAllListeners();
            });
        }
    }
}