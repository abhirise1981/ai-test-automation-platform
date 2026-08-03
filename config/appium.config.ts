/**
 * appium.config.ts — Appium Desired Capabilities Configuration
 *
 * Defines capabilities for Android (UiAutomator2) and iOS (XCUITest) testing.
 * All values are overridable via environment variables for CI/CD flexibility.
 */
import 'dotenv/config';

export const appiumConfig = {
  /** Appium server URL (local or remote) */
  serverUrl: process.env.APPIUM_SERVER_URL || 'http://localhost:4723',

  /** Default implicit wait timeout in milliseconds */
  implicitWait: 10000,

  /** Default command timeout in milliseconds */
  commandTimeout: 60000,

  /** Android capabilities */
  android: {
    platformName: 'Android' as const,
    'appium:automationName': 'UiAutomator2',
    'appium:app': process.env.ANDROID_APP_PATH || './apps/app-debug.apk',
    'appium:deviceName': process.env.ANDROID_DEVICE || 'Pixel_7_API_34',
    'appium:platformVersion': process.env.ANDROID_VERSION || '14',
    'appium:noReset': false,
    'appium:fullReset': false,
    'appium:autoGrantPermissions': true,
    'appium:newCommandTimeout': 300,
  },

  /** iOS capabilities */
  ios: {
    platformName: 'iOS' as const,
    'appium:automationName': 'XCUITest',
    'appium:app': process.env.IOS_APP_PATH || './apps/App.ipa',
    'appium:deviceName': process.env.IOS_DEVICE || 'iPhone 15 Pro',
    'appium:platformVersion': process.env.IOS_VERSION || '17.4',
    'appium:noReset': false,
    'appium:fullReset': false,
    'appium:autoAcceptAlerts': true,
  },

  /** BrowserStack App Automate capabilities */
  browserstack: {
    'bstack:options': {
      userName: process.env.BROWSERSTACK_USERNAME || '',
      accessKey: process.env.BROWSERSTACK_ACCESS_KEY || '',
      projectName: 'Toptal SDET Assessment',
      buildName: `Mobile-${new Date().toISOString().split('T')[0]}`,
      sessionName: 'Automated Mobile Test',
      debug: true,
      networkLogs: true,
      appiumVersion: '2.6.0',
    },
    androidDevices: [
      { deviceName: 'Samsung Galaxy S24', platformVersion: '14.0' },
      { deviceName: 'Google Pixel 8', platformVersion: '14.0' },
      { deviceName: 'Samsung Galaxy A54', platformVersion: '13.0' },
    ],
    iosDevices: [
      { deviceName: 'iPhone 15 Pro', platformVersion: '17' },
      { deviceName: 'iPhone 14', platformVersion: '16' },
      { deviceName: 'iPad Air (5th gen)', platformVersion: '16' },
    ],
  },

  /** AWS Device Farm capabilities */
  awsDeviceFarm: {
    projectArn: process.env.AWS_DEVICE_FARM_PROJECT_ARN || '',
    devicePoolArn: process.env.AWS_DEVICE_POOL_ARN || '',
    region: process.env.AWS_REGION || 'us-west-2',
  },
};
