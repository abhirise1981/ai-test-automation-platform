import { defineConfig, devices } from '@playwright/test';
import { environmentConfig } from './config/envConfig';

/**
 * playwright.config.ts — Playwright Runner Configuration
 *
 * Environment data has been extracted to config/envConfig.ts to ensure
 * minimal changes and maximum scalability across hundreds of pages.
 */

export default defineConfig({
  testDir: './tests',

  // Retry failed tests automatically in CI to handle network flakiness
  retries: process.env.CI ? 2 : 0,

  // Global test timeout and assertion timeout
  timeout: 60000,
  expect: { timeout: 10000 },

  // Reporter: list output in terminal + rich HTML report with traces and video
  reporter: [
    ['list'],
    ['monocart-reporter', {
      name: 'Toptal Assessment Rich Report',
      outputFile: './test-results/report.html'
    }]
  ],

  // Add workers for parallel execution
  workers: process.env.CI ? 2 : 4,

  use: {
    // baseURL is sourced from the active environment — the ONLY place it is defined.
    baseURL: environmentConfig.baseUrl,

    headless: true,
    trace: 'on-first-retry',           // Capture trace on retry for debugging
    screenshot: 'only-on-failure',     // Screenshot only on test failure
    video: 'on',        // Record video but only keep it on failure
    testIdAttribute: 'data-qa'         // Playwright's getByTestId uses data-qa
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ]
});
