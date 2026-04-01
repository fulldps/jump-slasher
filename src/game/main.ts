import { Boot } from "./scenes/Boot";
import { Preloader } from "./scenes/Preloader";
import { MainMenu } from "./scenes/MainMenu";
import { Game } from "./scenes/Game";
import { Level1 } from "./scenes/levels/Level1";
import { GameOver } from "./scenes/GameOver";
import { AUTO, Game as PhaserGame } from "phaser";

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1920, // Базовое разрешение (дизайн)
    height: 1080, // Укажи конкретное число!
    parent: "game-container",
    backgroundColor: "#000000",
    pixelArt: true,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 400 },
            debug: true,
        },
    },
    scale: {
        mode: Phaser.Scale.FIT, // Игра меняет размер (для UI)
        autoCenter: Phaser.Scale.CENTER_BOTH, // Центрирует
    },
    scene: [Boot, Preloader, MainMenu, Game, Level1, GameOver],
};

const StartGame = (parent: string) => {
    return new PhaserGame({ ...config, parent });
};

export default StartGame;
