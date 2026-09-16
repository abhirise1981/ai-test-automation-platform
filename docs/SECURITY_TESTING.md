# Security Testing Approach

## Scope

`tests/security/api-security.spec.ts` runs negative-path security
tests against the AutomationExercise public API (documented at
`/api_list`). This is a **sandbox-appropriate** scope: validating the
API's own documented error behaviour under hostile input, not
attempting real exploitation against a third-party site.

## OWASP API Security Top 10 (2023) mapping

| Test ID | Category | What it checks |
|---|---|---|
| SEC-01 | API2 Broken Authentication | Invalid login doesn't leak whether the account exists vs. password is wrong |
| SEC-02 | API3 Broken Object Property Auth | Missing required auth fields are rejected, not silently accepted |
| SEC-03 | Injection | SQLi-style payloads in login fields never cause a 5xx or successful auth |
| SEC-04 | Injection (XSS) | Reflected search input is not returned as an unescaped executable script tag |
| SEC-05/06/07 | API7 Security Misconfiguration | Unsupported HTTP methods are rejected (405), not silently processed |
| SEC-08 | API7 Security Misconfiguration | No stack traces or raw error dumps leak in responses |
| SEC-09 | API4 Unrestricted Resource Consumption | A short request burst doesn't crash the API (5xx) - advisory-logs if no rate limiting is visible |

## Advisory vs. hard-fail

Header-hygiene and rate-limiting checks (`SEC-08`, `SEC-09`) are
**advisory** - they log a warning rather than fail the whole pipeline,
because a public third-party demo site's header/rate-limit posture is
outside this project's control. Injection and auth-bypass checks
(`SEC-01` through `SEC-07`) are **hard assertions** - those are
API-level correctness issues, not infrastructure posture.

## What a production security suite would add

- Dynamic Application Security Testing (DAST) via OWASP ZAP baseline
  scan as a separate CI stage.
- Authenticated-session tests (RBAC boundary checks, IDOR probes
  against real object IDs) - not meaningful against a public sandbox
  API with no real user-scoped resources.
- Dependency/SCA scanning (`npm audit` / Snyk) as its own gate.
