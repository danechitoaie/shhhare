import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    return {
        plugins: [vue()],
        base: "",
        publicDir: "static",
        build: {
            chunkSizeWarningLimit: 4096,
            sourcemap: mode !== "production",
            rollupOptions: {
                input: "src/main.ts",
                output: {
                    entryFileNames: "[name].js",
                    chunkFileNames: "[name]-[hash].js",
                    assetFileNames: "[name][extname]",
                },
            },
            outDir: "../shhhare/static/doc",
        },
        server: {
            proxy: {
                "/api/": {
                    target: "http://127.0.0.1:8000",
                    changeOrigin: true,
                },
                "/doc/schema.json": {
                    target: "http://127.0.0.1:8000",
                    changeOrigin: true,
                },
            },
        },
    };
});
