/**
 * envConfig.ts
 *
 * SINGLE SOURCE OF TRUTH for all environment configurations.
 * This separates environment data from the Playwright runner setup, allowing
 * seamless scaling for hundreds of pages or configurations.
 */

export type Environment = 'qadev' | 'qa' | 'np' | 'prod';
export const env = (process.env.ENVIRONMENT as Environment) || 'prod';

// 1. Default fallback URLs (usually points to Production or a stable mock)
const defaultEnv = {
  baseUrl: 'https://tutorialsninja.com/demo/',
  geocodingBaseUrl: 'https://nominatim.openstreetmap.org',
  restMockBaseUrl: 'https://jsonplaceholder.typicode.com',
  authTestBaseUrl: 'https://postman-echo.com'
};

// 2. Environment-specific overrides (only specify what differs from defaultEnv)
export const environments: Record<Environment, Partial<typeof defaultEnv>> = {
  qadev: {
    // e.g., baseUrl: 'https://qadev.tutorialsninja.com/demo/'
  },
  qa: {
    // e.g., baseUrl: 'https://qa.tutorialsninja.com/demo/'
  },
  np: {
    // e.g., baseUrl: 'https://np.tutorialsninja.com/demo/'
  },
  prod: {
    // Uses all defaults
  }
};

// 3. Resolve the final configuration using a priority merge:
// Defaults < Environment Specific < Runtime Environment Variables
const activeConfig = {
  ...defaultEnv,
  ...environments[env]
};

export const environmentConfig = {
  environment: env,
  baseUrl:          process.env.BASE_URL          || activeConfig.baseUrl,
  geocodingBaseUrl: process.env.GEOCODING_API_URL || activeConfig.geocodingBaseUrl,
  restMockBaseUrl:  process.env.REST_MOCK_API_URL || activeConfig.restMockBaseUrl,
  authTestBaseUrl:  process.env.AUTH_TEST_API_URL || activeConfig.authTestBaseUrl
};
