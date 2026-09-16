import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
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
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Responsive-web mobile emulation (viewport/UA/touch) inside Playwright's
    // own browser stack. Complements the cross-framework Selenium mobile
    // harness in /mobile-selenium (see docs/MOBILE_TESTING.md for the
    // distinction and why both exist).
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] }, testMatch: /tests\/ui\/.*\.spec\.ts/ },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] }, testMatch: /tests\/ui\/.*\.spec\.ts/ }
  ]
});
