import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    react({
      jsxRuntime: 'automatic',
      // React 19 specific configuration
      jsxImportSource: 'react',
      babel: {
        plugins: [],
        presets: [],
      },
    }),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
    // Ensure React 19 compatibility
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    // Force React 19 compatibility in Vite's dependency optimization
    include: [
      "react",
      "react-dom",
      "@tanstack/react-query",
      "wouter",
    ],
    exclude: ["@replit/vite-plugin-cartographer"],
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Ensure proper React 19 bundling
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
        },
      },
    },
  },
  server: {
    port: 5000,
    hmr: {
      port: 5174,
      overlay: true,
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
