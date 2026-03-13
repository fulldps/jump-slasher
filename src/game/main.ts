import { Boot } from "./scenes/Boot";
import { Preloader } from "./scenes/Preloader";
import { MainMenu } from "./scenes/MainMenu";
import { Game } from "./scenes/Game";
import { Level1 } from "./scenes/levels/Level1";
// import { Level2 } from "./scenes/levels/Level2"; // раскомментируй, когда создашь
import { GameOver } from "./scenes/GameOver";
import { AUTO, Game as PhaserGame } from "phaser";

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: "game-container",
    backgroundColor: "#000000",
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 500 },
            debug: false, // ← выключи дебаг, когда всё заработает
        },
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        Game, // менеджер → запускает Level1
        Level1,
        // Level2,
        GameOver,
    ],
};

const StartGame = (parent: string) => {
    return new PhaserGame({ ...config, parent });
};

export default StartGame;
