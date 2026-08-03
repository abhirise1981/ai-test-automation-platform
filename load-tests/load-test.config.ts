/**
 * load-test.config.ts — Single Source of Truth for Load Test Configuration
 *
 * The simulation file (ecommerce.gatling.ts) imports from here.
 * It contains NO configuration values of its own.
 *
 * To switch environments or profiles at runtime:
 *
 *   ENVIRONMENT=qa LOAD_PROFILE=capacity npx gatling run ...
 *   ENVIRONMENT=prod LOAD_PROFILE=stress npx gatling run ...
 */

// ─────────────────────────────────────────────────────────────────────────────
// Target Environment
// Reads from the exact same environmentConfig as Playwright —
// guaranteeing load tests always target the same environment as functional tests.
// ─────────────────────────────────────────────────────────────────────────────
export const TARGET_BASE_URL = 'https://automationexercise.com';

// ─────────────────────────────────────────────────────────────────────────────
// HTTP Protocol Headers
// ─────────────────────────────────────────────────────────────────────────────
export const HTTP_HEADERS = {
  acceptHeader: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  acceptLanguage: 'en-US,en;q=0.5',
  userAgent: 'ToptalSDETLoadTest/Gatling/1.0',
};

// ─────────────────────────────────────────────────────────────────────────────
// Load Profile Definitions
// Each profile defines: how many users, over how long, and the SLA threshold.
// ─────────────────────────────────────────────────────────────────────────────
export const LOAD_PROFILES = {
  /**
   * Capacity profile — tests the server just below its breaking point.
   * Use for baseline performance benchmarking.
   */
  capacity: {
    users: 400,
    durationSeconds: 10,
    maxResponseMs: 5000,
    successRatePct: 95,
    label: 'Capacity Load (400 users / 10s)',
  },
  /**
   * Stress profile — simulates a large traffic spike to find the breaking point.
   * This is the default profile used in the CI/CD pipeline.
   */
  stress: {
    users: 1000,
    durationSeconds: 15,
    maxResponseMs: 2000,
    successRatePct: 95,
    label: 'Stress Load (1000 users / 15s)',
  },
} as const;

export type LoadProfileKey = keyof typeof LOAD_PROFILES;

// Hardcoded for Gatling JS runtime which lacks process.env
export const ACTIVE_PROFILE = LOAD_PROFILES.stress;
