import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

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
            tailwindcss(),
        ],
        base: "",
        publicDir: "static",
        build: {
            chunkSizeWarningLimit: 4096,
            sourcemap: mode !== "production",
            rollupOptions: {
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

                        return "[name]-[hash][extname]";
                    },
                },
            },
            outDir: "../shhhare/static/app",
        },
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
        server: {
            proxy: {
                "/api/": {
                    target: "http://127.0.0.1:8000",
                    changeOrigin: true,
                },
            },
        },
    };
});
