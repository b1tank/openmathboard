// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8080',
    viewport: { width: 1024, height: 768 },
    headless: true,
  },
  webServer: {
    command: 'npx serve . -l 8080',
    port: 8080,
    reuseExistingServer: !process.env.CI,
  },
});
