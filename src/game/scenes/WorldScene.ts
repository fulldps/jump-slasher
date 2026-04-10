import { WorldSceneBase } from "./WorldSceneBase";

export class WorldScene extends WorldSceneBase {
    constructor() {
        super("WorldScene");
    }

    create() {
        // 1. Инициализация базы (подписка на resize и т.д.)
        this.createBase();
        this.physics.world.createDebugGraphic();

        // 2. Установка фона (адаптивный, с поддержкой смены)
        // Второй параметр (1000) — время плавного появления в мс. Поставь 0, если нужно мгновенно.
        this.setParallaxBackground(["bg_1", "bg_2", "bg_3", "bg_4"]);

        // 3. Загрузка тайлмапа
        const map = this.make.tilemap({ key: "map" });
        if (!map) {
            console.error("Map not created");
            return;
        }

        const tileset = map.addTilesetImage(
            "terra-tilemap-basic",
            "maintilemap",
            16,
            16,
        );
        if (!tileset) {
            console.error("Tileset not created");
            console.log(map.tilesets);
            return;
        }

        // Создаём слой "ground" (имя должно совпадать с тем, что в Tiled)
        const groundLayer = map.createLayer("ground", tileset, 0, 0);
        groundLayer?.setCollisionByExclusion([-1], true); // -1 = пустые тайлы не коллизия

        if (!groundLayer) {
            console.error("groundLayer not created");
            console.log(map.layers.map((l) => l.name));
        }

        // 4. Игрок и физика
        this.setupPlayer(100, 300); // Позиция старта из базового класса

        if (groundLayer) {
            this.physics.add.collider(this.player, groundLayer, () => {});
        }

        // 5. Настройка камеры (следует за игроком)
        this.physics.world.setBounds(
            0,
            0,
            map.widthInPixels,
            map.heightInPixels,
        );
        this.cameras.main.setBounds(
            0,
            0,
            map.widthInPixels,
            map.heightInPixels,
        );

        this.cameras.main.setZoom(1.8);
        this.cameras.main.setRoundPixels(true);
        this.cameras.main.startFollow(this.player, true, 0.2, 0.3);
    }

    update(): void {
        super.update();
        if (this.player && this.inputManager) {
            const direction = this.inputManager.getDirection();
        }
    }
}
