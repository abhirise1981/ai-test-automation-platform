import { test, expect } from '@playwright/test';
import { testConfig } from '../../config/testConfig';

/**
 * API SECURITY TEST SUITE
 * ------------------------------------------------------------------
 * Target: automationexercise.com public REST API (documented at
 * https://automationexercise.com/api_list)
 *
 * Scope (OWASP API Security Top 10 aligned, mapped per test):
 *  - API2:2023 Broken Authentication       -> invalid credential handling
 *  - API3:2023 Broken Object Property Auth -> missing required fields
 *  - API4:2023 Unrestricted Resource Use   -> basic rate-limit probe
 *  - API7:2023 Security Misconfiguration   -> HTTP method enforcement,
 *                                             security response headers
 *  - Injection                             -> SQLi / script payloads in
 *                                             search & login fields
 *
 * This suite targets a public sandbox API and validates the API's own
 * documented negative-path behaviour (wrong method, missing fields,
 * bad creds) - it does not attempt exploitation beyond that.
 */

const apiBase = 'https://automationexercise.com/api';

test.describe('API Security - Authentication & Authorization', () => {

  test('SEC-01: Login with invalid credentials must not leak account existence', async ({ request }) => {
    const response = await request.post(`${apiBase}/verifyLogin`, {
      form: {
        email: 'does-not-exist@example.com',
        password: 'WrongPassword123!'
      }
    });

    const body = await response.json();
    expect(response.status()).toBe(200); // AutomationExercise wraps status in body
    expect(body.responseCode).toBe(404);
    expect(body.message.toLowerCase()).toContain('not found');
    expect(body.message.toLowerCase()).not.toContain('password incorrect');
  });

  test('SEC-02: Login without email/password must be rejected (missing auth params)', async ({ request }) => {
    const response = await request.post(`${apiBase}/verifyLogin`, { form: {} });
    const body = await response.json();
    expect(body.responseCode).toBe(400);
    expect(body.message.toLowerCase()).toContain('missing');
  });

  test('SEC-03: SQL-injection style payload in login field is safely rejected, not 500', async ({ request }) => {
    const payloads = [
      `' OR '1'='1`,
      `admin'--`,
      `'; DROP TABLE users; --`
    ];

    for (const payload of payloads) {
      const response = await request.post(`${apiBase}/verifyLogin`, {
        form: { email: payload, password: payload }
      });
      expect(response.status(), `payload: ${payload}`).toBeLessThan(500);
      const body = await response.json();
      expect(body.responseCode).not.toBe(200); // must never authenticate
    }
  });

  test('SEC-04: Reflected script payload in search does not come back unescaped', async ({ request }) => {
    const xssPayload = `<script>alert(1)</script>`;
    const response = await request.post(`${apiBase}/searchProduct`, {
      form: { search_product: xssPayload }
    });
    const raw = await response.text();
    expect(raw).not.toContain('<script>alert(1)</script>');
  });
});

test.describe('API Security - Method Enforcement (Security Misconfiguration)', () => {

  test('SEC-05: POST to a GET-only endpoint returns 405-equivalent, not 200', async ({ request }) => {
    const response = await request.post(`${apiBase}/productsList`);
    const body = await response.json();
    expect(body.responseCode).toBe(405);
    expect(body.message.toLowerCase()).toContain('not supported');
  });

  test('SEC-06: DELETE to verifyLogin (unsupported method) is rejected', async ({ request }) => {
    const response = await request.delete(`${apiBase}/verifyLogin`);
    const body = await response.json();
    expect(body.responseCode).toBe(405);
  });

  test('SEC-07: PUT to searchProduct (unsupported method) is rejected', async ({ request }) => {
    const response = await request.put(`${apiBase}/searchProduct`);
    const body = await response.json();
    expect(body.responseCode).toBe(405);
  });
});

test.describe('API Security - Response Header Hygiene', () => {

  test('SEC-08: Homepage response does not leak stack-trace or server banner details', async ({ request }) => {
    const response = await request.get(testConfig.baseUrl);
    const headers = response.headers();

    const riskyHeaders = ['x-powered-by', 'server'];
    for (const h of riskyHeaders) {
      if (headers[h]) {
        console.warn(`[SEC-08][ADVISORY] Header '${h}' exposes: ${headers[h]}`);
      }
    }
    const body = await response.text();
    expect(body.toLowerCase()).not.toContain('stacktrace');
    expect(body.toLowerCase()).not.toContain('traceback (most recent call last)');
  });
});

test.describe('API Security - Basic Rate / Abuse Probe (advisory)', () => {

  test('SEC-09: Burst of rapid requests does not silently crash the API', async ({ request }) => {
    // This is a probe, not a load test (see /load-tests for that).
    // Goal: confirm the API either rate-limits (429) or degrades
    // gracefully (still <500) under a short burst.
    const burst = Array.from({ length: 15 }, () => request.get(`${apiBase}/productsList`));
    const responses = await Promise.all(burst);
    const statuses = responses.map(r => r.status());

    const serverErrors = statuses.filter(s => s >= 500);
    expect(serverErrors.length, `statuses seen: ${statuses.join(',')}`).toBe(0);

    const rateLimited = statuses.filter(s => s === 429).length;
    if (rateLimited === 0) {
      console.warn('[SEC-09][ADVISORY] No 429 observed under 15-request burst - no visible rate limiting on this public endpoint.');
    }
  });
});
