import { Scene } from "phaser";
import { apiLogin, apiRegister, saveSession, getUsername } from "../../utils/api";

export class MainMenu extends Scene {
    constructor() { super("MainMenu"); }

    create(): void {
        // Если уже залогинен — показываем кнопку "Играть"
        const username = getUsername();
        if (username) {
            this.showPlayScreen(username);
            return;
        }

        this.showAuthForm();
    }

    private showPlayScreen(username: string): void {
        const w = this.scale.width;
        const h = this.scale.height;

        this.add.text(w / 2, h / 2 - 60, `Привет, ${username}!`, {
            fontSize: "28px", color: "#ffffff",
            stroke: "#000000", strokeThickness: 4,
        }).setOrigin(0.5);

        const playBtn = this.add.text(w / 2, h / 2 + 20, "[ ИГРАТЬ ]", {
            fontSize: "32px", color: "#ffdd00",
            stroke: "#000000", strokeThickness: 4,
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        playBtn.on("pointerover", () => playBtn.setColor("#ffffff"));
        playBtn.on("pointerout",  () => playBtn.setColor("#ffdd00"));
        playBtn.on("pointerdown", () => this.scene.start("WorldScene"));
    }

    private showAuthForm(): void {
        const w = this.scale.width;
        const h = this.scale.height;

        // Заголовок
        this.add.text(w / 2, h / 2 - 160, "JUMP SLASHER", {
            fontSize: "42px", color: "#ffffff",
            stroke: "#000000", strokeThickness: 6,
        }).setOrigin(0.5);

        // DOM-элементы поверх canvas — самый простой способ сделать форму
        const container = document.createElement("div");
        container.id = "auth-form";
        container.style.cssText = `
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            display: flex; flex-direction: column; gap: 10px;
            align-items: center;
            background: rgba(0,0,0,0.7);
            padding: 24px 32px; border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.15);
        `;

        const inputStyle = `
            padding: 8px 12px; font-size: 16px; border-radius: 4px;
            border: 1px solid #555; background: #222; color: #fff;
            width: 200px; outline: none;
        `;
        const btnStyle = `
            padding: 8px 24px; font-size: 16px; cursor: pointer;
            border-radius: 4px; border: none; font-weight: bold;
            width: 220px;
        `;

        const usernameInput = document.createElement("input");
        usernameInput.placeholder = "Имя игрока";
        usernameInput.style.cssText = inputStyle;

        const passwordInput = document.createElement("input");
        passwordInput.type = "password";
        passwordInput.placeholder = "Пароль";
        passwordInput.style.cssText = inputStyle;

        const loginBtn = document.createElement("button");
        loginBtn.textContent = "Войти";
        loginBtn.style.cssText = btnStyle + "background: #2563eb; color: #fff; margin-top: 6px;";

        const registerBtn = document.createElement("button");
        registerBtn.textContent = "Регистрация";
        registerBtn.style.cssText = btnStyle + "background: #444; color: #ccc;";

        const errorText = document.createElement("p");
        errorText.style.cssText = "color: #ff5555; font-size: 13px; margin: 0; min-height: 18px;";

        container.append(usernameInput, passwordInput, loginBtn, registerBtn, errorText);

        // Родительский элемент canvas
        const parent = document.getElementById("game-container") ?? document.body;
        parent.style.position = "relative";
        parent.appendChild(container);

        const cleanup = () => container.remove();

        const handle = async (action: "login" | "register") => {
            const u = usernameInput.value.trim();
            const p = passwordInput.value;
            errorText.textContent = "";
            try {
                const fn = action === "login" ? apiLogin : apiRegister;
                const result = await fn(u, p);
                saveSession(result);
                cleanup();
                this.scene.restart();
            } catch (err: any) {
                errorText.textContent = err.message;
            }
        };

        loginBtn.addEventListener("click", () => handle("login"));
        registerBtn.addEventListener("click", () => handle("register"));

        // Убираем форму при уходе со сцены
        this.events.once("shutdown", cleanup);
        this.events.once("destroy",  cleanup);
    }
}
