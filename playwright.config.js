import { defineConfig } from '@playwright/test';

// Browser smoke tests for the rendered UI. In CI the workflow installs the
// matching Chromium via `npx playwright install --with-deps chromium`.
// Locally, set PLAYWRIGHT_CHROMIUM_PATH to reuse an existing Chromium
// (e.g. PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium npx playwright test).
export default defineConfig({
  testDir: 'tests',
  testMatch: /smoke\.spec\.js/,
  timeout: 30_000,
  use: {
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } }
      : {}),
  },
});
