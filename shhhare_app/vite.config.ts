/// <reference types="vitest/config" />
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";

const BACKEND = "http://127.0.0.1:8000";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    return {
        plugins: [
            tanstackRouter({
                target: "react",
                autoCodeSplitting: false,
                quoteStyle: "double",
            }),
            react(),
            babel({ presets: [reactCompilerPreset()] }),
            tailwindcss(),
        ],
        base: "",
        publicDir: false,
        build: {
            chunkSizeWarningLimit: 4096,
            sourcemap: mode !== "production",
            rolldownOptions: {
                input: "src/main.tsx",
                output: {
                    entryFileNames: "[name].js",
                    assetFileNames: (assetInfo) => {
                        if (Array.isArray(assetInfo.names)) {
                            const isCss = assetInfo.names.some((n) => n.endsWith(".css"));
                            if (isCss) {
                                return "[name].css";
                            }

                            const isWoff2 = assetInfo.names.some((n) => n.endsWith(".woff2"));
                            if (isWoff2) {
                                return "[name].woff2";
                            }
                        }

                        return "assets/[name]-[hash][extname]";
                    },
                },
            },
            outDir: "../shhhare/static/app",
        },
        worker: {
            format: "es",
        },
        resolve: {
            alias: {
                "@": path.resolve(import.meta.dirname, "./src"),
            },
        },
        server: {
            proxy: {
                "/api/": { target: BACKEND, changeOrigin: true },
                "/doc/": { target: BACKEND, changeOrigin: true },
                "/favicon.svg": { target: BACKEND, changeOrigin: true },
            },
        },
        test: {
            environment: "node",
            include: ["src/**/*.test.ts"],
        },
    };
});
