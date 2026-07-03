import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const env = {
  port: Number(process.env.PORT ?? 5173),
  basePath: process.env.BASE_PATH ?? "/",
};

export default defineConfig({
  base: env.basePath,

  plugins: [
    react(),
    tailwindcss({ optimize: false }),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
        ]
      : []),
  ],

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },

  root: path.resolve(import.meta.dirname),

  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },

  server: {
    port: env.port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
  },

  preview: {
    port: env.port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
