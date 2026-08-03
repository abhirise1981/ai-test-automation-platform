/**
 * aws.config.ts — AWS Device Farm Configuration
 */
import 'dotenv/config';

export const awsConfig = {
  region: process.env.AWS_REGION || 'us-west-2',
  projectArn: process.env.AWS_DEVICE_FARM_PROJECT_ARN || '',
  devicePoolArn: process.env.AWS_DEVICE_POOL_ARN || '',

  /** Default device pool for Android testing */
  androidDevicePool: {
    name: 'Android Top Devices',
    rules: [
      { attribute: 'PLATFORM', operator: 'EQUALS', value: '"ANDROID"' },
      { attribute: 'OS_VERSION', operator: 'GREATER_THAN_OR_EQUALS', value: '"12"' },
    ],
  },

  /** Default device pool for iOS testing */
  iosDevicePool: {
    name: 'iOS Top Devices',
    rules: [
      { attribute: 'PLATFORM', operator: 'EQUALS', value: '"IOS"' },
      { attribute: 'OS_VERSION', operator: 'GREATER_THAN_OR_EQUALS', value: '"16"' },
    ],
  },

  /** Test execution configuration */
  executionConfig: {
    jobTimeoutMinutes: 30,
    accountsCleanup: true,
    appPackagesCleanup: true,
    videoCapture: true,
  },

  get isConfigured(): boolean {
    return Boolean(this.projectArn && this.devicePoolArn);
  },
};
