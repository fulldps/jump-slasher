import { LevelBase } from "./LevelBase";

export class Level1 extends LevelBase {
    constructor() {
        super("Level1");
    }

    create() {
        // Фон
        this.add.image(512, 384, "background");

        // Платформы
        this.platforms = this.physics.add.staticGroup();

        this.buildLevel(); // ← Выносим построение уровня в отдельный метод

        // Игрок
        this.setupPlayer(100, 600);

        // Коллизии
        this.physics.add.collider(this.player, this.platforms);

        // Управление и анимации (из базового класса)
        this.setupControls();
        this.createAnimations();
    }

    protected buildLevel() {
        // Земля
        // this.platform =
        // Платформы
        this.platforms.create(300, 600, "platform");
        this.platforms.create(700, 500, "platform");
        this.platforms.create(200, 400, "platform");
        this.platforms.create(600, 300, "platform");
    }

    // Пример: переход на следующий уровень
    goToNextLevel() {
        this.scene.start("Level2");
    }
}
