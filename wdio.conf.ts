import { appiumConfig } from './config/appium.config';

const target = process.env.MOBILE_TARGET || 'local';

let capabilities: any[] = [];
let services: any[] = [];
let host = 'localhost';
let port = 4723;
const path = '/';
let user = '';
let key = '';

if (target === 'browserstack') {
  user = appiumConfig.browserstack['bstack:options'].userName;
  key = appiumConfig.browserstack['bstack:options'].accessKey;
  services = ['browserstack'];

  capabilities = [
    {
      ...appiumConfig.android,
      'bstack:options': { ...appiumConfig.browserstack['bstack:options'] },
    },
    {
      ...appiumConfig.ios,
      'bstack:options': { ...appiumConfig.browserstack['bstack:options'] },
    },
  ];
} else if (target === 'aws') {
  host = '127.0.0.1';
  port = 4723;
  capabilities = [appiumConfig.android];
} else {
  services = ['appium'];
  capabilities = [appiumConfig.android];
}

export const config = {
  runner: 'local',
  user,
  key,
  hostname: host,
  port,
  path,
  specs: ['./tests/mobile/**/*.spec.ts'],
  exclude: [],
  maxInstances: 1,
  capabilities,
  logLevel: 'info',
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  services,
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },
};
