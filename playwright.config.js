import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/platform",

  fullyParallel: false,

  workers: 1,

  // Cold Laravel session restoration can queue on the Windows development server.

  timeout: 90000,

  expect: { timeout: 15000 },

  use: {
    actionTimeout: 15000,
    baseURL: "http://127.0.0.1:8443",

    browserName: "chromium",

    channel: "msedge",
  },

  webServer: [
    {
      command: "php artisan serve --host=127.0.0.1 --port=8000",

      cwd: "./backend",

      url: "http://127.0.0.1:8000/up",

      reuseExistingServer: true,
    },

    {
      command: "pnpm dev --host 127.0.0.1",

      url: "http://127.0.0.1:8443",

      reuseExistingServer: true,
    },
  ],
})
