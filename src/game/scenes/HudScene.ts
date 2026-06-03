import { Scene } from "phaser";

interface ScoreRow {
    id: string;
    name: string;
    kills: number;
    deaths: number;
}

const FONT = "'Press Start 2P', monospace";

/**
 * HudScene — оверлей поверх WorldScene. Отдельная сцена нужна потому, что
 * камера WorldScene имеет zoom 1.8 (масштабирует даже scrollFactor(0)-объекты),
 * а HUD должен оставаться в углу и неискажённым. Сцена рисует живой скорборд
 * (кто сколько убил) — включая гостей. Данные приходят из WorldScene через
 * setScoreboard(), которая слушает событие "scoreboard" с сервера.
 */
export class HudScene extends Scene {
    constructor() {
        super("HudScene");
    }

    private readonly PANEL_W = 320;
    private readonly PAD = 24;
    private readonly ROW_H = 26;
    private readonly HEADER_H = 46;

    private bg!: Phaser.GameObjects.Rectangle;
    private rowTexts: Phaser.GameObjects.Text[] = [];

    // Последние полученные данные — на случай, если событие пришло до create().
    private latest: ScoreRow[] = [];
    private selfId = "";

    create(): void {
        const x = this.scale.width - this.PANEL_W - this.PAD;
        const y = this.PAD;

        this.bg = this.add
            .rectangle(x, y, this.PANEL_W, this.HEADER_H, 0x0d0d1a, 0.72)
            .setOrigin(0, 0)
            .setStrokeStyle(2, 0x7c3aed)
            .setDepth(0);

        this.add
            .text(x + 14, y + 14, "SCOREBOARD", {
                fontFamily: FONT,
                fontSize: "13px",
                color: "#a78bfa",
            })
            .setDepth(1);

        this.render();
    }

    public setScoreboard(rows: ScoreRow[], selfId: string): void {
        this.latest = rows;
        this.selfId = selfId;
        if (this.bg) this.render();
    }

    private render(): void {
        if (!this.bg) return;

        this.rowTexts.forEach((t) => t.destroy());
        this.rowTexts = [];

        const sorted = [...this.latest].sort(
            (a, b) => b.kills - a.kills || a.deaths - b.deaths,
        );

        const x = this.scale.width - this.PANEL_W - this.PAD;
        const y = this.PAD;
        const startY = y + this.HEADER_H;

        sorted.forEach((r, i) => {
            const isSelf = r.id === this.selfId;
            const rowY = startY + i * this.ROW_H;
            const shortName =
                r.name.length > 11 ? r.name.slice(0, 11) : r.name;

            const nameText = this.add
                .text(x + 14, rowY, `${i + 1}. ${shortName}`, {
                    fontFamily: FONT,
                    fontSize: "10px",
                    color: isSelf ? "#22c55e" : "#e2d9f3",
                })
                .setDepth(1);

            const kdText = this.add
                .text(x + this.PANEL_W - 14, rowY, `${r.kills}/${r.deaths}`, {
                    fontFamily: FONT,
                    fontSize: "10px",
                    color: isSelf ? "#22c55e" : "#fbbf24",
                })
                .setOrigin(1, 0)
                .setDepth(1);

            this.rowTexts.push(nameText, kdText);
        });

        // Подгоняем высоту фона под число строк.
        const bodyH = Math.max(1, sorted.length) * this.ROW_H + 10;
        this.bg.setSize(this.PANEL_W, this.HEADER_H + bodyH);
    }
}
