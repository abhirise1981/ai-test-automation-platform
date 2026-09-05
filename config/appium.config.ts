/**
 * Appium W3C Capabilities Configuration (Interview-Ready & Production-Ready)
 */
export const appiumConfig = {
  // 1. Connection Endpoint
  url: process.env.APPIUM_URL || 'http://127.0.0.1:4723',

  // 2. Android Capabilities (UiAutomator2)
  android: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': 'Pixel_7',
    'appium:platformVersion': '14.0',
    'appium:app': './apps/app-debug.apk',
    'appium:noReset': false,
    'appium:autoGrantPermissions': true,
  },

  // 3. iOS Capabilities (XCUITest)
  ios: {
    platformName: 'iOS',
    'appium:automationName': 'XCUITest',
    'appium:deviceName': 'iPhone 15 Pro',
    'appium:platformVersion': '17.0',
    'appium:app': './apps/app.ipa',
    'appium:noReset': false,
    'appium:autoAcceptAlerts': true,
  },

  // 4. Cloud Execution (BrowserStack W3C Options)
  browserstack: {
    'bstack:options': {
      userName: process.env.BROWSERSTACK_USER,
      accessKey: process.env.BROWSERSTACK_KEY,
      projectName: 'Mobile POS Automation',
      appiumVersion: '2.0.0',
    },
  },
};

