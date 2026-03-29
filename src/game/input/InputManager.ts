export class InputManager {
    protected keys: { [key: string]: Phaser.Types.Input.Keyboard.Key };

    constructor(scene: Phaser.Scene) {
        if (scene.input.keyboard) {
            this.keys = scene.input.keyboard.addKeys({
                up: Phaser.Input.Keyboard.KeyCodes.W,
                down: Phaser.Input.Keyboard.KeyCodes.S,
                left: Phaser.Input.Keyboard.KeyCodes.A,
                right: Phaser.Input.Keyboard.KeyCodes.D,
            });
        }
    }

    public getDirection(): { x: number; y: number; jump: boolean } {
        let x: number = 0;

        if (this.keys.left.isDown) x = -1;
        else if (this.keys.right.isDown) x = 1;

        return { x, y: 0, jump: this.keys.up.isDown };
    }

    public destroy(): void {
        return;
    }
}

