/**
 * RemoteHpBar — полоска HP + имя над чужим игроком.
 * Живёт рядом с RemotePlayer-записью в WorldScene.
 * Не привязана к физике — просто следует за спрайтом каждый кадр.
 */
export class RemoteHpBar {
    private readonly BAR_WIDTH = 26;
    private readonly BAR_HEIGHT = 3;
    private readonly BAR_OFFSET_Y = -26;
    private readonly NAME_OFFSET_Y = -34;

    private bg: Phaser.GameObjects.Rectangle;
    private fill: Phaser.GameObjects.Rectangle;
    private nameTag: Phaser.GameObjects.Text;

    private maxHp: number;
    private currentHp: number;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        name: string,
        maxHp: number,
    ) {
        this.maxHp = maxHp;
        this.currentHp = maxHp;

        this.bg = scene.add
            .rectangle(
                x,
                y + this.BAR_OFFSET_Y,
                this.BAR_WIDTH,
                this.BAR_HEIGHT,
                0x333333,
            )
            .setDepth(5)
            .setOrigin(0.5, 0.5);

        this.fill = scene.add
            .rectangle(
                x - this.BAR_WIDTH / 2,
                y + this.BAR_OFFSET_Y,
                this.BAR_WIDTH,
                this.BAR_HEIGHT,
                0x44ff44,
            )
            .setDepth(6)
            .setOrigin(0, 0.5);

        this.nameTag = scene.add
            .text(x, y + this.NAME_OFFSET_Y, name, {
                fontSize: "7px",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 2,
            })
            .setOrigin(0.5, 1)
            .setDepth(7);
    }

    public setHp(hp: number, maxHp?: number): void {
        if (maxHp !== undefined) this.maxHp = maxHp;
        this.currentHp = Math.max(0, hp);

        const ratio = this.currentHp / this.maxHp;
        const fillW = this.BAR_WIDTH * ratio;
        this.fill.setSize(fillW, this.BAR_HEIGHT);

        let color: number;
        if (ratio > 0.5) color = 0x44ff44;
        else if (ratio > 0.25) color = 0xffcc00;
        else color = 0xff3333;
        this.fill.setFillStyle(color);
    }

    public moveTo(x: number, y: number): void {
        this.bg.setPosition(x, y + this.BAR_OFFSET_Y);
        this.fill.setPosition(x - this.BAR_WIDTH / 2, y + this.BAR_OFFSET_Y);
        this.nameTag.setPosition(x, y + this.NAME_OFFSET_Y);
    }

    public setVisible(v: boolean): void {
        this.bg.setVisible(v);
        this.fill.setVisible(v);
        this.nameTag.setVisible(v);
    }

    public destroy(): void {
        this.bg.destroy();
        this.fill.destroy();
        this.nameTag.destroy();
    }
}
