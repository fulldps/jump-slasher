import { Boot } from "./scenes/Boot";
import { Preloader } from "./scenes/Preloader";
import { MainMenu } from "./scenes/MainMenu";
import { Game } from "./scenes/Game";
import { Level1 } from "./scenes/levels/Level1";
import { GameOver } from "./scenes/GameOver";
import { AUTO, Game as PhaserGame } from "phaser";

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1440, // Базовое разрешение (дизайн)
    height: 768, // Укажи конкретное число!
    parent: "game-container",
    backgroundColor: "#000000",
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 500 },
            debug: true,
        },
    },
    scale: {
        mode: Phaser.Scale.FIT, // Масштабирует с сохранением пропорций
        autoCenter: Phaser.Scale.CENTER_BOTH, // Центрирует
        // Альтернативы:
        // mode: Phaser.Scale.RESIZE,     // Игра меняет размер (для UI)
        // mode: Phaser.Scale.ENVELOP,    // Заполняет экран (может обрезать)
    },
    scene: [Boot, Preloader, MainMenu, Game, Level1, GameOver],
};

const StartGame = (parent: string) => {
    return new PhaserGame({ ...config, parent });
};

export default StartGame;
