/**
 * browserstack.config.ts — BrowserStack Web Automate & App Automate Configuration
 */
import 'dotenv/config';

export const browserstackConfig = {
  username: process.env.BROWSERSTACK_USERNAME || '',
  accessKey: process.env.BROWSERSTACK_ACCESS_KEY || '',

  /** BrowserStack Web Automate — Desktop Browsers */
  webCapabilities: [
    { browserName: 'chrome', browserVersion: 'latest', 'bstack:options': { os: 'Windows', osVersion: '11' } },
    { browserName: 'firefox', browserVersion: 'latest', 'bstack:options': { os: 'Windows', osVersion: '11' } },
    { browserName: 'safari', browserVersion: 'latest', 'bstack:options': { os: 'OS X', osVersion: 'Sonoma' } },
    { browserName: 'edge', browserVersion: 'latest', 'bstack:options': { os: 'Windows', osVersion: '11' } },
  ],

  /** BrowserStack Web Automate — Mobile Browsers */
  mobileBrowserCapabilities: [
    { browserName: 'chrome', 'bstack:options': { deviceName: 'Samsung Galaxy S24', osVersion: '14.0' } },
    { browserName: 'safari', 'bstack:options': { deviceName: 'iPhone 15 Pro', osVersion: '17' } },
    { browserName: 'chrome', 'bstack:options': { deviceName: 'Google Pixel 8', osVersion: '14.0' } },
    { browserName: 'safari', 'bstack:options': { deviceName: 'iPad Air (5th gen)', osVersion: '16' } },
  ],

  /** Common BrowserStack options */
  commonOptions: {
    projectName: 'Toptal SDET Assessment',
    buildName: `Build-${new Date().toISOString().split('T')[0]}`,
    debug: true,
    networkLogs: true,
    consoleLogs: 'info',
    video: true,
  },

  /** Hub URL for connecting Playwright/WebdriverIO to BrowserStack */
  get hubUrl(): string {
    return `https://${this.username}:${this.accessKey}@hub-cloud.browserstack.com/wd/hub`;
  },

  /** Validate that credentials are configured */
  get isConfigured(): boolean {
    return Boolean(this.username && this.accessKey);
  },
};
