import { LevelBase } from "./LevelBase";

export class Level1 extends LevelBase {
    constructor() {
        super("Level1");
    }

    create() {
        // 1. Инициализация базы (подписка на resize и т.д.)
        this.createBase();

        // 2. Установка фона (адаптивный, с поддержкой смены)
        // Второй параметр (1000) — время плавного появления в мс. Поставь 0, если нужно мгновенно.
        this.setBackground("background", 1000);

        // 3. Загрузка тайлмапа
        const map = this.make.tilemap({ key: "map" });
        const tileset = map.addTilesetImage("tiles", "maintilemap", 24, 24);

        // Создаём слой "ground" (имя должно совпадать с тем, что в Tiled)
        const groundLayer = map.createLayer("ground", tileset, 0, 0);
        groundLayer?.setCollisionByExclusion([-1]); // -1 = пустые тайлы не коллизия

        // 4. Игрок и физика
        this.setupPlayer(100, 600); // Позиция старта из базового класса

        if (groundLayer) {
            this.physics.add.collider(this.player, groundLayer);
        }

        // 5. Управление и анимации

        // 6. Настройка камеры (следует за игроком)
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setDeadzone(100, 100);
    }

    protected buildLevel() {
        // Если нужно добавить специфичные для уровня объекты (не тайлмап), пиши сюда
    }

    goToNextLevel() {
        this.scene.start("Level2");
    }
}
