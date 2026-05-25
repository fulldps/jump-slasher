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
        outDir: "dist",
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
