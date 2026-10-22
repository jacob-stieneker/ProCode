import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests-desktop',
  timeout: 120000,
  expect: { timeout: 20000 },
  workers: 1,
  reporter: 'list',
  outputDir: 'test-results-desktop',
});
