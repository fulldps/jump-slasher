import { Scene } from "phaser";
import {
    apiLogin,
    apiRegister,
    saveSession,
    getUsername,
    clearSession,
} from "../../utils/api";

const C = {
    bg: 0x0d0d1a,
    bgCard: 0x111128,
    purple: 0x7c3aed,
    purpleDark: 0x4c1d95,
    purpleDeep: 0x1e1b4b,
    white: 0xffffff,
    green: 0x22c55e,
    lavender: 0xa78bfa,
};

// Шрифт подключается один раз
const FONT = "'Press Start 2P', monospace";
const FONT_LINK =
    "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";

// HTML-форма — строка, вставляется через this.add.dom
// this.add.dom(x, y) масштабируется вместе с canvas автоматически
const FORM_HTML = `
<style>
  #js-form * { box-sizing: border-box; image-rendering: pixelated; }
  #js-form { display:flex; flex-direction:column; gap:14px; width:300px; }
  .px-inp {
    font-family:'Press Start 2P',monospace; font-size:10px; letter-spacing:1px;
    background:#0a0a18; border:2px solid #4c1d95; color:#e2d9f3;
    padding:11px 11px 11px 32px; width:100%; outline:none;
  }
  .px-inp:focus { border-color:#7c3aed; background:#0d0d28; }
  .px-inp::placeholder { color:#3b2f6e; }
  .inp-wrap { position:relative; }
  .inp-icon { position:absolute; left:9px; top:50%; transform:translateY(-50%); font-size:13px; pointer-events:none; }
  #js-btn-main {
    font-family:'Press Start 2P',monospace; font-size:11px; letter-spacing:1px;
    background:#7c3aed; border:none; color:#fff;
    padding:14px 0; width:100%; cursor:pointer;
    box-shadow:0 5px 0 #4c1d95;
  }
  #js-btn-main:active { transform:translateY(5px); box-shadow:0 0 0 #4c1d95; }
  #js-btn-guest {
    font-family:'Press Start 2P',monospace; font-size:8px;
    background:transparent; border:2px solid #3b2f6e; color:#6d5fa0;
    padding:10px 0; width:100%; cursor:pointer;
  }
  #js-btn-guest:hover { border-color:#7c3aed; color:#a78bfa; }
  #js-err { font-family:'Press Start 2P',monospace; font-size:8px; min-height:14px; text-align:center; color:#f87171; }
</style>
<div id="js-form">
  <div class="inp-wrap">
    <span class="inp-icon">👤</span>
    <input class="px-inp" id="js-u" placeholder="PLAYER NAME" maxlength="16" autocomplete="off"/>
  </div>
  <div class="inp-wrap">
    <span class="inp-icon">🔒</span>
    <input class="px-inp" id="js-p" type="password" placeholder="PASSWORD" autocomplete="off"/>
  </div>
  <div id="js-err"></div>
  <button id="js-btn-main">▶ PLAY NOW</button>
  <button id="js-btn-guest">[ GUEST MODE ]</button>
</div>
`;

export class MainMenu extends Scene {
    constructor() {
        super("MainMenu");
    }

    private domEl?: Phaser.GameObjects.DOMElement;
    private mode: "login" | "register" = "login";

    create(): void {
        const w = this.scale.width;
        const h = this.scale.height;

        // Подключаем шрифт
        if (!document.getElementById("ps2p-font")) {
            const link = document.createElement("link");
            link.id = "ps2p-font";
            link.rel = "stylesheet";
            link.href = FONT_LINK;
            document.head.appendChild(link);
        }

        this.add.rectangle(w / 2, h / 2, w, h, C.bg);
        this.createStars(w, h);
        this.createMarchingBorder(w, h);
        this.createTitle(w, h);

        const username = getUsername();
        if (username) {
            this.createPlayScreen(w, h, username);
        } else {
            this.createCard(w, h);
            this.createForm(w, h);
        }

        this.createOnlineBadge(w, h);
    }

    // ── ЗВЁЗДЫ ──────────────────────────────────────────────

    private createStars(w: number, h: number): void {
        const g = this.add.graphics();
        const stars = Array.from({ length: 80 }, () => ({
            x: Phaser.Math.Between(0, w),
            y: Phaser.Math.Between(0, h),
            size: Math.random() < 0.3 ? 2 : 1,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.015 + 0.005,
        }));

        this.time.addEvent({
            delay: 50,
            loop: true,
            callback: () => {
                g.clear();
                stars.forEach((s) => {
                    s.phase += s.speed;
                    g.fillStyle(
                        C.lavender,
                        0.2 + Math.abs(Math.sin(s.phase)) * 0.8,
                    );
                    g.fillRect(
                        Math.floor(s.x),
                        Math.floor(s.y),
                        s.size,
                        s.size,
                    );
                });
            },
        });
    }

    // ── МАРШИРУЮЩАЯ ГРАНИЦА ──────────────────────────────────

    private createMarchingBorder(w: number, h: number): void {
        const g = this.add.graphics().setDepth(10);
        let offset = 0;
        this.time.addEvent({
            delay: 60,
            loop: true,
            callback: () => {
                g.clear();
                g.fillStyle(C.purple, 1);
                for (let x = -16 + offset; x < w; x += 16) {
                    g.fillRect(Math.floor(x), h - 6, 8, 6);
                }
                offset = (offset + 1) % 16;
            },
        });
    }

    // ── ЗАГОЛОВОК ────────────────────────────────────────────

    private createTitle(w: number, h: number): void {
        // Пиксельные тени — три копии со сдвигом
        this.add
            .text(w / 2 + 8, h / 2 - 230 + 8, "JUMP\nSLASHER", {
                fontFamily: FONT,
                fontSize: "38px",
                color: "#1e1b4b",
                align: "center",
            })
            .setOrigin(0.5);

        this.add
            .text(w / 2 + 4, h / 2 - 230 + 4, "JUMP\nSLASHER", {
                fontFamily: FONT,
                fontSize: "38px",
                color: "#4c1d95",
                align: "center",
            })
            .setOrigin(0.5);

        const title = this.add
            .text(w / 2, h / 2 - 230, "JUMP\nSLASHER", {
                fontFamily: FONT,
                fontSize: "38px",
                color: "#ffffff",
                align: "center",
            })
            .setOrigin(0.5);

        this.tweens.add({
            targets: title,
            y: h / 2 - 238,
            duration: 2500,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });

        const sub = this.add
            .text(w / 2, h / 2 - 118, "► PIXEL EDITION ◄", {
                fontFamily: FONT,
                fontSize: "11px",
                color: "#7c3aed",
            })
            .setOrigin(0.5);

        this.time.addEvent({
            delay: 600,
            loop: true,
            callback: () => sub.setVisible(!sub.visible),
        });
    }

    // ── КАРТОЧКА (фон под формой) ────────────────────────────

    private createCard(w: number, h: number): void {
        const cx = w / 2;
        const cy = h / 2 + 70;

        // Тень
        this.add.rectangle(cx + 8, cy + 8, 360, 350, C.purpleDark).setDepth(1);
        // Тело
        this.add
            .rectangle(cx, cy, 360, 350, C.bgCard)
            .setStrokeStyle(3, C.purple)
            .setDepth(2);
        // Шапка
        this.add.rectangle(cx, cy - 175 + 22, 357, 36, C.purple).setDepth(3);

        // Табы в шапке
        const tabLogin = this.add
            .text(cx - 70, cy - 175 + 22, "▶ LOGIN", {
                fontFamily: FONT,
                fontSize: "9px",
                color: "#ffffff",
            })
            .setOrigin(0.5)
            .setDepth(4)
            .setInteractive({ useHandCursor: true });

        const tabReg = this.add
            .text(cx + 70, cy - 175 + 22, "REGISTER", {
                fontFamily: FONT,
                fontSize: "9px",
                color: "rgba(255,255,255,0.4)",
            })
            .setOrigin(0.5)
            .setDepth(4)
            .setInteractive({ useHandCursor: true });

        tabLogin.on("pointerdown", () => {
            this.mode = "login";
            tabLogin.setStyle({ color: "#ffffff" });
            tabReg.setStyle({ color: "rgba(255,255,255,0.4)" });
            const btn = this.domEl?.getChildByID(
                "js-btn-main",
            ) as HTMLButtonElement | null;
            if (btn) btn.textContent = "▶ PLAY NOW";
        });

        tabReg.on("pointerdown", () => {
            this.mode = "register";
            tabLogin.setStyle({ color: "rgba(255,255,255,0.4)" });
            tabReg.setStyle({ color: "#ffffff" });
            const btn = this.domEl?.getChildByID(
                "js-btn-main",
            ) as HTMLButtonElement | null;
            if (btn) btn.textContent = "▶ CREATE ACCOUNT";
        });

        // Текст ошибки поверх карточки
        const errText = this.add
            .text(cx, cy + 50, "", {
                fontFamily: FONT,
                fontSize: "8px",
                color: "#f87171",
                align: "center",
                wordWrap: { width: 320 },
            })
            .setOrigin(0.5)
            .setDepth(6);

        // Сохраняем errText чтобы достучаться из обработчиков формы
        (this as any)._errText = errText;
    }

    // ── DOM-ФОРМА через this.add.dom ─────────────────────────

    private createForm(w: number, h: number): void {
        // this.add.dom(x, y, ...) — x,y в координатах Phaser
        // DOM-элемент масштабируется вместе с canvas через transform
        this.domEl = this.add
            .dom(w / 2, h / 2 + 80)
            .createFromHTML(FORM_HTML)
            .setDepth(5);

        const errText: Phaser.GameObjects.Text = (this as any)._errText;

        const setErr = (msg: string, ok = false) => {
            errText.setStyle({ color: ok ? "#4ade80" : "#f87171" });
            errText.setText(msg);
        };

        // Кнопка входа/регистрации
        this.domEl.addListener("click");
        this.domEl.on("click", async (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            if (target.id === "js-btn-main") {
                const u = (
                    this.domEl!.getChildByID("js-u") as HTMLInputElement
                ).value.trim();
                const p = (this.domEl!.getChildByID("js-p") as HTMLInputElement)
                    .value;

                if (!u) {
                    setErr("▸ ENTER YOUR NAME");
                    return;
                }
                if (p.length < 6) {
                    setErr("▸ PASSWORD MIN 6 CHARS");
                    return;
                }

                setErr(
                    this.mode === "login" ? "▸ CONNECTING..." : "▸ CREATING...",
                    true,
                );

                try {
                    const fn = this.mode === "login" ? apiLogin : apiRegister;
                    const result = await fn(u, p);
                    saveSession(result);
                    this.scene.restart();
                } catch (err: any) {
                    setErr(`▸ ${(err.message as string).toUpperCase()}`);
                }
            }

            if (target.id === "js-btn-guest") {
                setErr("▸ GUEST — NO STATS SAVED", false);
                this.time.delayedCall(1000, () =>
                    this.scene.start("WorldScene"),
                );
            }
        });
    }

    // ── ЭКРАН ДЛЯ ЗАЛОГИНЕННОГО ──────────────────────────────

    private createPlayScreen(w: number, h: number, username: string): void {
        const cx = w / 2;
        const cy = h / 2 + 50;

        this.add.rectangle(cx + 8, cy + 8, 360, 200, C.purpleDark).setDepth(1);
        this.add
            .rectangle(cx, cy, 360, 200, C.bgCard)
            .setStrokeStyle(3, C.purple)
            .setDepth(2);

        this.add
            .text(cx, cy - 55, `▶ ${username.toUpperCase()}`, {
                fontFamily: FONT,
                fontSize: "14px",
                color: "#a78bfa",
            })
            .setOrigin(0.5)
            .setDepth(3);

        this.add
            .text(cx, cy - 22, "READY TO FIGHT", {
                fontFamily: FONT,
                fontSize: "9px",
                color: "#4b5563",
            })
            .setOrigin(0.5)
            .setDepth(3);

        const playBtn = this.add
            .text(cx, cy + 22, "[ PLAY NOW ]", {
                fontFamily: FONT,
                fontSize: "16px",
                color: "#ffffff",
                backgroundColor: "#7c3aed",
                padding: { x: 20, y: 12 },
            })
            .setOrigin(0.5)
            .setDepth(3)
            .setInteractive({ useHandCursor: true });

        this.time.addEvent({
            delay: 500,
            loop: true,
            callback: () => playBtn.setVisible(!playBtn.visible),
        });

        playBtn.on("pointerdown", () => this.scene.start("WorldScene"));

        const logoutBtn = this.add
            .text(cx, cy + 78, "LOGOUT", {
                fontFamily: FONT,
                fontSize: "8px",
                color: "#3b2f6e",
            })
            .setOrigin(0.5)
            .setDepth(3)
            .setInteractive({ useHandCursor: true });

        logoutBtn.on("pointerover", () =>
            logoutBtn.setStyle({ color: "#f87171" }),
        );
        logoutBtn.on("pointerout", () =>
            logoutBtn.setStyle({ color: "#3b2f6e" }),
        );
        logoutBtn.on("pointerdown", () => {
            clearSession();
            this.scene.restart();
        });
    }

    // ── ОНЛАЙН БЕЙДЖ ────────────────────────────────────────

    private createOnlineBadge(w: number, h: number): void {
        const dot = this.add
            .rectangle(w / 2 - 80, h - 30, 6, 6, C.green)
            .setDepth(10);
        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => dot.setVisible(!dot.visible),
        });

        this.add
            .text(w / 2 - 68, h - 30, "SERVER ONLINE", {
                fontFamily: FONT,
                fontSize: "8px",
                color: "#4b5563",
            })
            .setOrigin(0, 0.5)
            .setDepth(10);
    }

    shutdown(): void {
        this.domEl?.destroy();
    }
}
