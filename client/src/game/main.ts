import { Preloader } from "./scenes/Preloader";
import { MainMenu } from "./scenes/MainMenu";
import { WorldScene } from "./scenes/WorldScene";
import { HudScene } from "./scenes/HudScene";
import { AUTO, Game as PhaserGame } from "phaser";

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1920,
    height: 1080,
    parent: "game-container",
    backgroundColor: "#000000",
    pixelArt: true,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { x: 0, y: 400 }, // x обязателен в типах Phaser
            debug: false,
        },
    },
    dom: { createContainer: true } as any,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [Preloader, MainMenu, WorldScene, HudScene],
};

const StartGame = (parent: string) => new PhaserGame({ ...config, parent });

export default StartGame;
