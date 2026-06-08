export class InputManager {
    // Record<string, any> — обходим проблему с типом Key в старых @types/phaser
    private keys: Record<string, Phaser.Input.Keyboard.Key> = {};

    constructor(scene: Phaser.Scene) {
        if (scene.input.keyboard) {
            this.keys = scene.input.keyboard.addKeys({
                up:     Phaser.Input.Keyboard.KeyCodes.W,
                left:   Phaser.Input.Keyboard.KeyCodes.A,
                right:  Phaser.Input.Keyboard.KeyCodes.D,
                attack: Phaser.Input.Keyboard.KeyCodes.J,
                block:  Phaser.Input.Keyboard.KeyCodes.K,
            }) as Record<string, Phaser.Input.Keyboard.Key>;
        }
    }

    public getDirection(): { x: number; jump: boolean; attack: boolean; block: boolean } {
        let x = 0;
        if (this.keys.left?.isDown)  x = -1;
        else if (this.keys.right?.isDown) x = 1;

        return {
            x,
            jump:   this.keys.up?.isDown   ?? false,
            attack: this.keys.attack ? Phaser.Input.Keyboard.JustDown(this.keys.attack) : false,
            block:  this.keys.block?.isDown ?? false,
        };
    }

    public destroy(): void {
        Object.values(this.keys).forEach((key) => key?.removeAllListeners());
    }
}
