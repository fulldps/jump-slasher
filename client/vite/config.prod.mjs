import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
    base: "./",
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("../src", import.meta.url)),
        },
    },
    logLevel: "info",
    build: {
        // Бандл кладём прямо в server/public — сервер раздаёт статику оттуда
        // (server.js: express.static(__dirname/public) + SPA-fallback).
        // Путь относительно корня vite (папки client/).
        outDir: "../server/public",
        emptyOutDir: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ["phaser"],
                },
            },
        },
        minify: "terser",
        terserOptions: {
            compress: { passes: 2 },
            mangle: true,
            format: { comments: false },
        },
    },
});
