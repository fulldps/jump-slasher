<script setup lang="ts">
import Phaser from "phaser";
import { ref } from "vue";
import PhaserGame from "./PhaserGame.vue";

// Ссылка на компонент игры для доступа к сценам из Vue
const phaserRef = ref();

// Текущая сцена (для реактивности интерфейса)
const currentSceneKey = ref("");

// Обработчик события смены сцены
const onCurrentSceneReady = (scene: Phaser.Scene) => {
    currentSceneKey.value = scene.scene.key;
};
</script>

<template>
    <PhaserGame ref="phaserRef" @current-active-scene="onCurrentSceneReady" />

    <div class="ui-layer">
        <p>Current Scene: {{ currentSceneKey }}</p>
    </div>
</template>

<style scoped>
.ui-layer {
    position: absolute;
    top: 0;
    left: 0;
    padding: 10px;
    color: white;
    pointer-events: none; /* Чтобы клики проходили сквозь текст в игру */
}
</style>
