import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    target: "es2020",
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        /**
         * Split vendor code out of the app bundle so an app change does not
         * invalidate React and the router in every returning visitor's cache.
         */
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react-router")) return "vendor-router";
          if (id.includes("react-icons")) return "vendor-icons";
          if (id.includes("react-dom") || id.includes("scheduler")) return "vendor-react";
          return "vendor";
        },
      },
    },
    chunkSizeWarningLimit: 400,
  },
  server: { port: 5173 },
  preview: { port: 4173 },
});
