import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Separate from vite.config.js so test-only settings can never leak into the
 * production build. Unit and component tests run in jsdom; anything under
 * e2e/ belongs to Playwright and is excluded here.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test/setup.js"],
    include: ["src/**/*.test.{js,jsx}"],
    exclude: ["e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{js,jsx}"],
      exclude: ["src/test/**", "src/**/*.test.{js,jsx}", "src/assets/**"],
    },
  },
});
