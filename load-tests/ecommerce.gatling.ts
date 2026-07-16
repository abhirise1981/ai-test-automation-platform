import { simulation, scenario, rampUsers, global } from "@gatling.io/core";
import { http, status } from "@gatling.io/http";
import { TARGET_BASE_URL, HTTP_HEADERS, ACTIVE_PROFILE } from "./load-test.config";

/**
 * ecommerce.gatling.ts — Simulation Execution File
 *
 * This file contains ONLY simulation logic (what to do and how to inject users).
 * It contains ZERO configuration values — all config comes from load-test.config.ts.
 *
 * This mirrors the same separation used in the Playwright test suite:
 *   playwright.config.ts → framework & environment config
 *   testConfig.ts        → test data
 *   *.spec.ts            → assertions only
 *
 * Similarly here:
 *   load-test.config.ts     → all load test config (URLs, profiles, SLAs)
 *   ecommerce.gatling.ts    → simulation logic only
 */

// ── HTTP Protocol ─────────────────────────────────────────────────────────────
const httpProtocol = http
  .baseUrl(TARGET_BASE_URL)
  .acceptHeader(HTTP_HEADERS.acceptHeader)
  .acceptLanguageHeader(HTTP_HEADERS.acceptLanguage)
  .userAgentHeader(HTTP_HEADERS.userAgent);

// ── Scenario ──────────────────────────────────────────────────────────────────
const homepageScenario = scenario(`Toptal Load Test — ${ACTIVE_PROFILE.label}`)
  .exec(
    http('GET Homepage')
      .get('/')
      .check(status().is(200))
  );

// ── Simulation Setup ──────────────────────────────────────────────────────────
export default simulation((setUp) => {
  setUp(
    homepageScenario.injectOpen(
      rampUsers(ACTIVE_PROFILE.users).during(ACTIVE_PROFILE.durationSeconds)
    )
  )
  .protocols(httpProtocol)
  // CI/CD gates — pipeline fails if either SLA is breached
  .assertions(
    global().successfulRequests().percent().gte(ACTIVE_PROFILE.successRatePct),
    global().responseTime().max().lt(ACTIVE_PROFILE.maxResponseMs)
  );
});
