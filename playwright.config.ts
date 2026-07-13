import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  retries: process.env.CI ? 2 : 0, // Automatically retries failed tests in CI to handle flakiness
  timeout: 60000,
  expect: { timeout: 10000 },
  reporter: [
    ['list'], 
    ['monocart-reporter', {  
        name: "Toptal Assessment Rich Report",
        outputFile: './test-results/report.html'
    }]
  ],
  use: {
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure', // Automatically records video of the test, but only saves it if it fails!
    testIdAttribute: 'data-qa'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ]
});
