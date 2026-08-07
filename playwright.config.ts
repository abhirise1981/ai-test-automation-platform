import { defineConfig, devices } from '@playwright/test';
import { environmentConfig } from './config/envConfig';

/**
 * playwright.config.ts — Playwright Runner Configuration
 *
 * Environment data has been extracted to config/envConfig.ts to ensure
 * minimal changes and maximum scalability across hundreds of pages.
 */

// Determine projects based on EXECUTION_TARGET
const target = process.env.EXECUTION_TARGET || 'local';
let projectsConfig: any[] = [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
];

if (target === 'cross-browser') {
  projectsConfig = [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ];
} else if (target === 'mobile-web') {
  projectsConfig = [
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
    { name: 'tablet', use: { ...devices['iPad (gen 7)'] } },
  ];
} else if (target === 'browserstack') {
  const bsConfig = require('./config/browserstack.config').browserstackConfig;
  projectsConfig = bsConfig.webCapabilities.map((cap: any) => ({
    name: `${cap.browserName}@${cap.browserVersion}-${cap['bstack:options'].os}`,
    use: {
      browserName: cap.browserName,
      channel: cap.browserName,
    },
  }));
} else if (target === 'aws') {
  projectsConfig = [{ name: 'aws-chrome', use: { ...devices['Desktop Chrome'] } }];
}

export default defineConfig({
  testDir: './tests',
  testIgnore: '**/mobile/**',
  retries: process.env.CI ? 1 : 0,
  timeout: 60000,
  expect: { timeout: 15000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    [
      'monocart-reporter',
      {
        name: 'Toptal Assessment Rich Report',
        outputFile: './test-results/report.html',
      },
    ],
  ],
  workers: process.env.CI ? 2 : 4,
  use: {
    baseURL: environmentConfig.baseUrl,
    headless: true,
    navigationTimeout: 45000,
    actionTimeout: 20000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    testIdAttribute: 'data-qa',
  },
  projects: projectsConfig,
});
