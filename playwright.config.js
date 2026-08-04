import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end suite: the real built frontend against a real Django backend.
 *
 * Two servers start automatically:
 *  - Django on 8001 with settings_ci (sqlite, throttling off, seeded data) -
 *    port 8001 so a normal dev backend on 8000 is never touched.
 *  - `vite preview` on 4173 serving a production build whose API base points
 *    at that Django instance.
 *
 * In CI, E2E_PYTHON=python (deps installed globally); locally it defaults to
 * the backend virtualenv.
 */
const PYTHON =
  process.env.E2E_PYTHON ||
  (process.platform === "win32" ? "venv\\Scripts\\python.exe" : "venv/bin/python");

const DJANGO = `--settings=scholarship_backend.settings_ci`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: `${PYTHON} manage.py migrate --noinput ${DJANGO} && ${PYTHON} manage.py seed_e2e ${DJANGO} && ${PYTHON} manage.py runserver 8001 --noreload ${DJANGO}`,
      cwd: "../backend",
      url: "http://127.0.0.1:8001/api/scholarships/",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      // --host 127.0.0.1: Node 22 resolves `localhost` to ::1, so without an
      // explicit host vite listens on IPv6 only and the readiness probe
      // (127.0.0.1) never connects.
      command:
        "npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        VITE_BACKEND_URL: "http://127.0.0.1:8001/api",
      },
    },
  ],
});
