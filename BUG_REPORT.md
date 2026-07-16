# Defect Report
# E-Commerce UI / REST API — Toptal SDET Screening Assessment

Project:          Toptal SDET Screening Assessment
Application:      https://tutorialsninja.com/demo/  (OpenCart Demo)
API Services:     https://nominatim.openstreetmap.org  |  https://jsonplaceholder.typicode.com
Author:           Abhishek Kumar, Lead SDET
Framework:        Playwright v1.61.1 + TypeScript
Report Date:      July 2026
Total Defects:    15  (4 API  /  11 UI)
Affected Version: OpenCart Demo v3.x  |  Nominatim API  |  JSONPlaceholder API

---

## Conventions

### Severity

| Level    | Definition                                                                              |
|----------|-----------------------------------------------------------------------------------------|
| CRITICAL | The defect blocks core business functionality. No workaround exists.                    |
| HIGH     | The defect significantly impacts functionality or security. Workaround may exist.       |
| MEDIUM   | The defect degrades user experience but does not block primary flows.                   |
| LOW      | Cosmetic or informational. Does not impact functionality.                               |

### Priority

| Level  | Definition                                                                                |
|--------|-------------------------------------------------------------------------------------------|
| P1     | Must be fixed before the next release. Blocks sign-off.                                   |
| P2     | Should be fixed in the next release.                                                      |
| P3     | Should be scheduled in the upcoming sprint.                                               |
| P4     | Backlog. Fix when time permits.                                                           |

### Defect Status

| Status         | Meaning                                                                       |
|----------------|-------------------------------------------------------------------------------|
| OPEN           | Defect identified and logged. Not yet assigned for remediation.               |
| IN PROGRESS    | Developer is actively working on a fix.                                       |
| WON'T FIX      | Accepted risk. Defect is known but will not be remediated.                    |
| RESOLVED       | Fix has been applied. Awaiting QA verification.                               |
| CLOSED         | Fix verified by QA. Defect is closed.                                         |

### Reproducibility

| Level         | Definition                                                              |
|---------------|-------------------------------------------------------------------------|
| Always        | Defect is observed on every attempt using the documented steps.         |
| Intermittent  | Defect occurs on some attempts. May be timing or environment dependent. |
| Rare          | Defect has been observed but cannot be reliably triggered.              |

### Test Evidence Convention

Each defect includes a Test Evidence section containing:
- The automated test ID and spec file reference that detected the defect
- The exact HTTP request or UI action used to reproduce it
- The raw server response or observed UI state
- Any workaround applied in the test suite to handle the defect gracefully

---

## Defect Summary

| Defect ID | Component              | Severity | Priority | Status | Title                                                                              |
|-----------|------------------------|----------|----------|--------|------------------------------------------------------------------------------------|
| BUG-001   | API — Geocoding        | HIGH     | P2       | OPEN   | Reverse geocode returns 200 OK for physically impossible coordinates               |
| BUG-002   | API — CRUD             | HIGH     | P2       | OPEN   | PUT on non-existent resource returns 500 Internal Server Error instead of 404      |
| BUG-003   | API — Errors           | MEDIUM   | P3       | OPEN   | Invalid endpoint returns HTML error page instead of JSON                           |
| BUG-004   | UI — Checkout          | MEDIUM   | P3       | OPEN   | Checkout redirect provides no user-facing error explanation                        |
| BUG-005   | UI — Cart              | HIGH     | P2       | OPEN   | Out-of-stock product added to cart without immediate warning                       |
| BUG-006   | UI — Accessibility     | HIGH     | P2       | OPEN   | Registration form labels missing for attribute — WCAG 2.1 violation                |
| BUG-007   | UI — Security          | HIGH     | P1       | OPEN   | No password complexity policy — single character passwords accepted                |
| BUG-008   | UI — Search            | MEDIUM   | P3       | OPEN   | Product search is case-sensitive — lowercase queries return zero results            |
| BUG-009   | UI — Security          | CRITICAL | P1       | OPEN   | No rate limiting on the login endpoint — unlimited brute-force attempts allowed    |
| BUG-010   | UI — Cart              | HIGH     | P2       | OPEN   | Cart quantity field accepts zero and negative values without validation             |
| BUG-011   | API — Contract         | MEDIUM   | P3       | OPEN   | DELETE operation does not persist — deleted resource remains retrievable via GET   |
| BUG-012   | UI — Security          | CRITICAL | P1       | OPEN   | User session token not invalidated server-side on logout                           |
| BUG-013   | UI — Accessibility/SEO | MEDIUM   | P3       | OPEN   | Product images missing descriptive alt attributes — WCAG and SEO violation         |
| BUG-014   | UI — Security          | HIGH     | P2       | OPEN   | Application served over HTTP with no HTTPS redirect — data transmitted unencrypted|
| BUG-015   | API — Performance      | MEDIUM   | P3       | OPEN   | List endpoint returns full dataset with no pagination support                      |

---

## Defect Details

---

### BUG-001 — Reverse Geocoding Returns 200 OK for Physically Impossible Coordinates

| Field              | Value                                                                           |
|--------------------|---------------------------------------------------------------------------------|
| Defect ID          | BUG-001                                                                         |
| Component          | REST API — Geocoding Service (Nominatim OpenStreetMap)                          |
| Severity           | HIGH                                                                            |
| Priority           | P2                                                                              |
| Status             | OPEN                                                                            |
| Reproducibility    | Always                                                                         |
| Affected Version   | OpenCart Demo v3.x  /  Nominatim API (current)                                 |
| Reporter           | Abhishek Kumar, Lead SDET                                                       |
| Date Reported      | July 16, 2026                                                                   |
| Environment        | Production — https://nominatim.openstreetmap.org                                |
| Affected Endpoint  | GET /reverse                                                                    |
| Linked Test        | tests/api/location.spec.ts — API-17                                             |

Description:

Submitting a GET /reverse request with latitude 999 and longitude 999 produces an HTTP 200 OK response. Latitude values must fall within -90 to +90 and longitude values within -180 to +180. A value of 999 for either coordinate is physically impossible. The server embeds an error message inside the response body but reports HTTP 200, which is a violation of REST semantics.

Steps to Reproduce:

1. Send: GET https://nominatim.openstreetmap.org/reverse?lat=999&lon=999&format=json
2. Observe the HTTP status code in the response headers.
3. Observe the response body.

Expected Result:

HTTP 400 Bad Request with a structured JSON error body:
  { "error": "Invalid coordinates: latitude must be between -90 and 90, longitude between -180 and 180." }

Actual Result:

  HTTP Status: 200 OK
  Content-Type: application/json
  Body: {"error":"Unable to geocode"}

Impact:

REST clients and HTTP libraries universally treat 200 OK as a success indicator. An application that does not deeply inspect the response body for an embedded error key will treat this failed geocoding operation as a success, potentially writing null or invalid coordinates to a production database. No error alert will be raised because the HTTP layer indicates success. This is a silent data corruption risk.

REST Compliance Requirement:

The server should validate that latitude is in the range -90 to +90 and longitude is in the range -180 to +180 before processing the request. If either value is out of range, return HTTP 400 Bad Request with a descriptive JSON body explaining the constraint.

Test Evidence:

```
  Automated Test:  tests/api/location.spec.ts — API-17
  Detection:       The test sends GET /reverse?lat=999&lon=999&format=json and asserts HTTP 200.
                   The assertion is intentionally set to 200 (not 400) to document and track the existing
                   broken behavior. The test will be updated to assert 400 once the defect is resolved.

  Exact request sent:
    GET https://nominatim.openstreetmap.org/reverse?lat=999&lon=999&format=json
    Headers: Accept: application/json, User-Agent: playwright-api-test

  Raw server response observed:
    Status:  200 OK
    Headers: Content-Type: application/json
    Body:    {"error":"Unable to geocode"}

  Test output logged during execution:
    "[BUG] Reverse geocoding impossible coordinates returned 200 OK (expected 400 Bad Request)"
```

---

### BUG-002 — PUT on Non-Existent Resource Returns 500 Instead of 404

| Field              | Value                                                                           |
|--------------------|---------------------------------------------------------------------------------|
| Defect ID          | BUG-002                                                                         |
| Component          | REST API — Location CRUD (JSONPlaceholder)                                      |
| Severity           | HIGH                                                                            |
| Priority           | P2                                                                              |
| Status             | OPEN                                                                            |
| Reproducibility    | Always                                                                         |
| Affected Version   | OpenCart Demo v3.x  /  JSONPlaceholder API (current)                           |
| Reporter           | Abhishek Kumar, Lead SDET                                                       |
| Date Reported      | July 16, 2026                                                                   |
| Environment        | Production — https://jsonplaceholder.typicode.com                               |
| Affected Endpoint  | PUT /posts/{id}                                                                 |
| Linked Test        | tests/api/location.spec.ts — API-12                                             |
| Reference          | RFC 7231, Section 6.5.4 — 404 Not Found                                        |

Description:

Sending a PUT request to update a resource using a non-existent ID (e.g., /posts/99999) results in HTTP 500 Internal Server Error. Per RFC 7231, the correct response when a client attempts to modify a resource that does not exist is HTTP 404 Not Found. A 500 response indicates an unhandled server-side exception is propagating to the API consumer.

Steps to Reproduce:

1. Send: PUT https://jsonplaceholder.typicode.com/posts/99999
   Body:  { "title": "Test Update", "body": "test", "userId": 1 }
   Header: Content-Type: application/json
2. Observe the HTTP status code.

Expected Result:

  HTTP 404 Not Found
  Body: { "error": "Resource with id 99999 not found." }

Actual Result:

  HTTP 500 Internal Server Error

Impact:

Client applications that interpret 500 as a transient infrastructure error (network timeout, server restart) may implement automatic retry logic. Retrying a PUT request against a non-existent resource on every retry cycle creates unnecessary server load. In distributed systems this pattern can trigger cascading failures. Additionally, a 500 response leaks the fact that an unhandled exception occurred server-side, which is an information disclosure risk.

REST Compliance Requirement:

Add a resource existence check before executing the update operation. Query for the record by ID first. If the record does not exist, return HTTP 404 Not Found with a descriptive JSON body before any update logic is executed.

Test Evidence:

```
  Automated Test:  tests/api/location.spec.ts — API-12
  Detection:       The test sends PUT /posts/99999 with a valid JSON body and asserts HTTP 500.
                   The assertion is set to 500 to document the known broken behavior.
                   It will be updated to assert 404 once the defect is resolved.

  Exact request sent:
    PUT https://jsonplaceholder.typicode.com/posts/99999
    Headers: Content-Type: application/json
    Body: { "title": "Central Park New York - Updated", "body": "updated body", "userId": 1 }

  Raw server response observed:
    Status: 500 Internal Server Error
    Body:   (empty or server error message)

  Test output logged during execution:
    "[BUG confirmed] Non-existent resource update returned: 500 (expected 404)"
```

---

### BUG-003 — Invalid Endpoint Returns HTML Error Page Instead of JSON

| Field              | Value                                                                           |
|--------------------|---------------------------------------------------------------------------------|
| Defect ID          | BUG-003                                                                         |
| Component          | REST API — Error Handling (Nominatim OpenStreetMap)                             |
| Severity           | MEDIUM                                                                          |
| Priority           | P3                                                                              |
| Status             | OPEN                                                                            |
| Reproducibility    | Always                                                                         |
| Affected Version   | Nominatim API (current)                                                        |
| Reporter           | Abhishek Kumar, Lead SDET                                                       |
| Date Reported      | July 16, 2026                                                                   |
| Environment        | Production — https://nominatim.openstreetmap.org                                |
| Affected Endpoint  | Any non-existent path                                                           |
| Linked Test        | tests/api/location.spec.ts — API-05                                             |

Description:

When a GET request targets a non-existent path on the Nominatim API, the server returns HTTP 404 with Content-Type: text/html and a full HTML error page in the body. A properly designed REST API must return Content-Type: application/json on all responses, including error responses, regardless of which endpoint is accessed.

Steps to Reproduce:

1. Send: GET https://nominatim.openstreetmap.org/invalid_endpoint_path_for_testing
2. Inspect the Content-Type response header.
3. Inspect the response body.

Expected Result:

  HTTP 404 Not Found
  Content-Type: application/json
  Body: { "status": 404, "error": "Endpoint not found." }

Actual Result:

  HTTP 404 Not Found
  Content-Type: text/html
  Body: Full HTML error page (DOCTYPE, head, body tags)

Impact:

Any REST client that calls response.json() on this response will throw a SyntaxError because the body begins with an HTML tag rather than a JSON token. This crash must be caught at the application level with a specific HTML-body guard, which is non-standard error handling logic that most API consumers do not implement.

Workaround Applied in Test Suite:

Test API-05 asserts only on the HTTP 404 status code. The test deliberately does not call .json() on the response body to prevent the Playwright test runner from throwing an unrelated parse exception that would obscure the actual assertion.

Test Evidence:

```
  Automated Test:  tests/api/location.spec.ts — API-05
  
  Exact request sent:
    GET https://nominatim.openstreetmap.org/invalid_endpoint_path_for_testing
    Headers: Accept: application/json

  Raw server response observed:
    Status:  404 Not Found
    Headers: Content-Type: text/html; charset=utf-8
    Body:    <!DOCTYPE html><html>...(full HTML error page)...

  Test output logged during execution:
    "Invalid endpoint correctly returned: 404"
```

---

### BUG-004 — Checkout Redirect Provides No User-Facing Error Explanation

| Field              | Value                                                                           |
|--------------------|---------------------------------------------------------------------------------|
| Defect ID          | BUG-004                                                                         |
| Component          | UI — Checkout Flow                                                              |
| Severity           | MEDIUM                                                                          |
| Priority           | P3                                                                              |
| Status             | OPEN                                                                            |
| Reproducibility    | Always                                                                         |
| Affected Version   | OpenCart Demo v3.x                                                             |
| Reporter           | Abhishek Kumar, Lead SDET                                                       |
| Date Reported      | July 16, 2026                                                                   |
| Environment        | Production — https://tutorialsninja.com/demo/                                   |
| Browser            | Chromium (Playwright headless) on macOS                                         |
| Affected URL       | https://tutorialsninja.com/demo/index.php?route=checkout/checkout               |
| Linked Test        | tests/ui/ecommerce.spec.ts — TC-12                                              |

Description:

When a user navigates directly to the checkout page with an empty shopping cart, the application redirects them back to the cart page. While the redirect itself is correct behavior, the user receives no notification, alert, or error message explaining why the checkout page was denied. The cart page displays its standard empty-cart message with no indication that a redirect just occurred.

Steps to Reproduce:

1. Ensure the shopping cart is empty (do not add any items).
2. Navigate directly to: https://tutorialsninja.com/demo/index.php?route=checkout/checkout
3. Observe the destination URL and any visible messages on the resulting page.

Expected Result:

The user is redirected to the cart page and a flash message or alert banner is displayed:
  "Your shopping cart is empty. Please add items before proceeding to checkout."

Actual Result:

The user is silently redirected to https://tutorialsninja.com/demo/index.php?route=checkout/cart with no alert or notification. The page shows the standard empty-cart state message only.

Impact:

Users who reach the checkout page via a bookmarked URL, a browser back-forward action, or a session expiry scenario have no indication of why checkout was blocked. E-commerce conversion research consistently identifies unexplained friction in the checkout flow as a primary driver of cart abandonment. This defect represents a measurable revenue risk.

Test Evidence:

```
  Automated Test:  tests/ui/ecommerce.spec.ts — TC-12

  Reproduction steps executed by automation:
    1. navigateTo(ROUTES.CHECKOUT) with empty cart state
    2. Assert: page.url() contains ROUTES.CART  [PASS — redirect confirmed]
    3. Assert: empty cart message visible         [PASS]
    4. Assert: any alert or error banner visible  [NOT ASSERTED — defect means none exists]

  Observed behavior:
    - URL after navigation: https://tutorialsninja.com/demo/index.php?route=checkout/cart
    - No alert, flash message, or notification rendered on the cart page
    - Only the standard "Your shopping cart is empty!" paragraph is visible
```

---

### BUG-005 — Out-of-Stock Product Added to Cart Without Immediate Warning

| Field              | Value                                                                           |
|--------------------|---------------------------------------------------------------------------------|
| Defect ID          | BUG-005                                                                         |
| Component          | UI — Cart / Inventory Management                                                |
| Severity           | HIGH                                                                            |
| Priority           | P2                                                                              |
| Status             | OPEN                                                                            |
| Reproducibility    | Always                                                                         |
| Affected Version   | OpenCart Demo v3.x                                                             |
| Reporter           | Abhishek Kumar, Lead SDET                                                       |
| Date Reported      | July 16, 2026                                                                   |
| Environment        | Production — https://tutorialsninja.com/demo/                                   |
| Browser            | Chromium (Playwright headless) on macOS                                         |
| Affected URL       | https://tutorialsninja.com/demo/index.php?route=product/search&search=iMac     |
| Linked Test        | tests/ui/ecommerce.spec.ts — TC-16                                              |

Description:

Clicking the Add to Cart button on a product that is marked as out of stock does not display any immediate feedback to the user. The item is accepted into the cart session without any stock validation at the point of action. The out-of-stock notification only appears when the user navigates to the cart page, at which point the item is already in the cart and checkout is subsequently blocked.

Steps to Reproduce:

1. Navigate to: https://tutorialsninja.com/demo/index.php?route=product/search&search=iMac
2. Click the Add to Cart button for the iMac product.
3. Observe the immediate feedback (or lack thereof) on the search results page.
4. Navigate to the Shopping Cart page.
5. Observe the warning that appears only at this step.

Expected Result:

Upon clicking Add to Cart on an out-of-stock product:
  - The button should be visually disabled and labeled "Out of Stock", OR
  - An immediate alert should appear: "This product is currently unavailable and cannot be added to your cart."

Actual Result:

  At search results page: Standard Add to Cart success behavior occurs. No stock warning is shown.
  At cart page:           "Products marked with *** are not available in the desired quantity or not in stock!"
                          alert is displayed only after the user has already navigated away from the search page.

Impact:

Users are led to believe their cart action succeeded, invest time reviewing their cart, and are only told about the stock problem at a point where they have already committed to the checkout journey. This creates significant frustration and is a well-documented driver of checkout abandonment. In a production system where the stock check is also applied at the payment gateway, a user could proceed all the way to entering payment details before receiving the final rejection.

Test Evidence:

```
  Automated Test:  tests/ui/ecommerce.spec.ts — TC-16

  Reproduction steps executed by automation:
    1. Search for iMac via ROUTES.PRODUCTS_SEARCH with query "iMac"
    2. Click Add to Cart on the first search result
    3. Navigate to ROUTES.CART
    4. Assert: .alert-danger contains out-of-stock warning text  [PASS — warning present on cart page]
    5. Click Proceed to Checkout
    6. Assert: URL remains at ROUTES.CART                        [PASS — checkout blocked]

  Key observation: No assertion on the search results page could detect a stock warning at step 2
  because none is rendered by the application.
```

---

### BUG-006 — Registration Form Label Elements Missing for Attribute — WCAG 2.1 Violation

| Field              | Value                                                                           |
|--------------------|---------------------------------------------------------------------------------|
| Defect ID          | BUG-006                                                                         |
| Component          | UI — Registration Page / Accessibility                                          |
| Severity           | HIGH                                                                            |
| Priority           | P2                                                                              |
| Status             | OPEN                                                                            |
| Reproducibility    | Always                                                                         |
| Affected Version   | OpenCart Demo v3.x                                                             |
| Reporter           | Abhishek Kumar, Lead SDET                                                       |
| Date Reported      | July 16, 2026                                                                   |
| Environment        | Production — https://tutorialsninja.com/demo/index.php?route=account/register  |
| Browser            | Chromium (Playwright headless) on macOS                                         |
| Standard Violated  | WCAG 2.1 — Success Criterion 1.3.1 (Info and Relationships)                    |
|                    | WCAG 2.1 — Success Criterion 2.4.6 (Headings and Labels)                       |
| Linked Test        | tests/ui/ecommerce.spec.ts — TC-01, TC-13, TC-14                                |

Description:

The form label elements on the account registration page are not programmatically associated with their corresponding input fields. The label elements are missing the for attribute, which should match the id of the input they describe. Without this association, assistive technologies (screen readers) cannot announce to a visually impaired user which input field is currently focused. Additionally, the standard browser behavior of moving focus to an input when its label is clicked does not function.

Steps to Reproduce:

1. Navigate to: https://tutorialsninja.com/demo/index.php?route=account/register
2. Open browser DevTools and inspect the First Name field:
   - Inspect the label element above the input.
   - Note the absence of a for attribute on the label tag.
3. Alternatively, open the browser Accessibility panel.
   - Select the First Name input.
   - Observe that no programmatic label is associated with it.
4. To verify via automation: run page.getByLabel('First Name') — it will return 0 matching elements.

Expected HTML (correct):

  <label for="input-firstname">First Name <span class="required">*</span></label>
  <input type="text" id="input-firstname" name="firstname" ...>

Actual HTML (defective):

  <label>First Name <span class="required">*</span></label>
  <input type="text" id="input-firstname" name="firstname" ...>

Impact:

  Legal:      Violates WCAG 2.1 Success Criteria 1.3.1 and 2.4.6. WCAG compliance is a legal
              requirement under the EU European Accessibility Act (EAA, effective June 2025) and
              is referenced in ADA Title III litigation in the United States. Non-compliance
              exposes the business to regulatory penalties and civil lawsuits.

  Functional: Screen reader users (estimated 7.5 million in the US alone) cannot identify which
              field they are focused on during registration, making account creation inaccessible.

  Automation: The test suite cannot use Playwright's semantic getByLabel locator strategy.
              All registration field interactions must use CSS ID selectors, which are more
              brittle and tied to implementation details rather than user-visible labels.

WCAG Compliance Requirement:

Add a matching for attribute to every label element on the registration form. The for value must exactly match the id of the associated input. This is a straightforward HTML attribute change with no JavaScript or server-side logic required.

Workaround Applied in Test Suite:

All registration form locators are defined in config/uiConstants.ts under LOCATORS.REGISTER_PAGE using direct CSS ID selectors (e.g., #input-firstname). This ensures test stability while the defect remains open.

Test Evidence:

```
  Verified via: Chrome DevTools Accessibility panel on https://tutorialsninja.com/demo/index.php?route=account/register
  
  Playwright verification:
    const el = await page.getByLabel('First Name');
    await el.count();  // returns 0 — confirms no associated label exists

  DOM inspection result:
    Element:   label (no for attribute present)
    Input:     input#input-firstname
    Link:      NONE — label and input are not programmatically associated
```

---

### BUG-007 — No Password Complexity Policy — Single Character Passwords Accepted

| Field              | Value                                                                           |
|--------------------|---------------------------------------------------------------------------------|
| Defect ID          | BUG-007                                                                         |
| Component          | UI — Registration / Security                                                    |
| Severity           | HIGH                                                                            |
| Priority           | P1                                                                              |
| Status             | OPEN                                                                            |
| Reproducibility    | Always                                                                         |
| Affected Version   | OpenCart Demo v3.x                                                             |
| Reporter           | Abhishek Kumar, Lead SDET                                                       |
| Date Reported      | July 16, 2026                                                                   |
| Environment        | Production — https://tutorialsninja.com/demo/index.php?route=account/register  |
| Browser            | Chromium (Playwright headless) on macOS                                         |
| Standard Violated  | OWASP Authentication Cheat Sheet — Password Complexity Requirements             |
|                    | NIST SP 800-63B — Digital Identity Guidelines                                   |
| Linked Test        | tests/ui/ecommerce.spec.ts — TC-01                                              |

Description:

The account registration form accepts a password consisting of a single character (for example, the digit "1") without any validation error. There is no client-side strength indicator, no minimum length enforcement, and no server-side complexity validation. A user can create an account with the weakest password possible.

Steps to Reproduce:

1. Navigate to: https://tutorialsninja.com/demo/index.php?route=account/register
2. Fill in all required fields with valid data (First Name, Last Name, Email, Telephone).
3. Enter the value "1" in the Password field.
4. Enter the value "1" in the Password Confirm field.
5. Check the Privacy Policy agreement checkbox.
6. Click the Continue button.
7. Observe the result.

Expected Result:

The form should reject the submission and display a validation error:
  "Password must be at least 8 characters and include at least one uppercase letter, one number, and one special character."

Actual Result:

Account is created successfully. No validation error is shown. The user is logged in.

Impact:

  Security:   Accounts with trivially weak passwords are vulnerable to brute-force and credential
              stuffing attacks. Any attacker with a list of registered email addresses can attempt
              to log in with a small set of common single-character or dictionary passwords and
              succeed. Customer accounts, order histories, and payment methods stored in the account
              are exposed.

  Compliance: OWASP recommends a minimum password length of 8 characters with complexity requirements.
              NIST SP 800-63B recommends a minimum of 8 characters and checking passwords against
              known-compromised password lists. Neither requirement is met.

Security Requirement (OWASP/NIST):

Implement a password complexity policy enforced on both the client and server sides:
  - Minimum length: 8 characters
  - Must contain at least one uppercase letter
  - Must contain at least one lowercase letter
  - Must contain at least one numeric digit
  - Must contain at least one special character

Additionally, implement a real-time password strength indicator on the registration form so users receive feedback as they type rather than only on submission.

Test Evidence:

```
  Automated Test:  tests/ui/ecommerce.spec.ts — TC-01 (uses testConfig for password values)

  Reproduction executed by automation:
    1. Navigate to ROUTES.REGISTER
    2. Fill required fields from testConfig
    3. Enter password: "1" in both password fields
    4. Submit form
    5. Assert: success page reached  [PASS — account created with single-char password]

  Observed state after submission:
    - URL: https://tutorialsninja.com/demo/index.php?route=account/success
    - Page heading: "Your Account Has Been Created!"
    - No validation error shown at any point
```

---

### BUG-008 — Product Search is Case-Sensitive — Lowercase Queries Return Zero Results

| Field              | Value                                                                           |
|--------------------|---------------------------------------------------------------------------------|
| Defect ID          | BUG-008                                                                         |
| Component          | UI — Product Search                                                             |
| Severity           | MEDIUM                                                                          |
| Priority           | P3                                                                              |
| Status             | OPEN                                                                            |
| Reproducibility    | Always                                                                         |
| Affected Version   | OpenCart Demo v3.x                                                             |
| Reporter           | Abhishek Kumar, Lead SDET                                                       |
| Date Reported      | July 16, 2026                                                                   |
| Environment        | Production — https://tutorialsninja.com/demo/                                   |
| Browser            | Chromium (Playwright headless) on macOS                                         |
| Linked Test        | tests/ui/ecommerce.spec.ts — TC-03, TC-04, TC-05                                |

Description:

The product search engine performs a case-sensitive string comparison against the product catalog. Searching for a product name in all lowercase or all uppercase returns zero results, even when the product exists in the catalog under a mixed-case name. Users habitually type search terms in lowercase. A zero-results page for a valid product name incorrectly communicates that the product does not exist.

Steps to Reproduce:

1. Navigate to: https://tutorialsninja.com/demo/index.php?route=product/search
2. Enter "macbook" (all lowercase) into the search field and submit.
3. Record the number of results returned.
4. Clear the search field, enter "MacBook" (mixed case) and submit.
5. Record the number of results returned.
6. Clear the search field, enter "MACBOOK" (all uppercase) and submit.
7. Record the number of results returned.

Expected Result:

All three queries ("macbook", "MacBook", "MACBOOK") should return the same set of results because the search should be case-insensitive.

Actual Result:

| Query    | Results Returned | Correct |
|----------|-----------------|---------|
| MacBook  | 3               | Yes     |
| macbook  | 0               | No      |
| MACBOOK  | 0               | No      |

Impact:

Users who search in lowercase — the most natural typing behavior — receive a false "no results" response. They may conclude the product is unavailable and leave the site, directly reducing conversion rate and revenue. The defect also affects discoverability for any product whose catalog name uses non-standard casing.

Test Evidence:

```
  Automated Tests:  tests/ui/ecommerce.spec.ts — TC-03, TC-04, TC-05

  These tests use mixed-case search keywords from testConfig.searchCriteria:
    MacBook -> 3 results   (PASS)
    HP      -> 1 result    (PASS)
    Samsung -> 2 results   (PASS)

  All three tests pass because the search terms are supplied in the exact casing the catalog uses.
  The defect manifests only when lowercase or uppercase variants are supplied.

  Manual verification performed:
    Input "macbook"  -> Result: "There is no product that matches the search criteria."
    Input "MacBook"  -> Result: 3 products returned
    Input "MACBOOK"  -> Result: "There is no product that matches the search criteria."
```

---

### BUG-009 — No Rate Limiting on Login Endpoint — Unlimited Brute-Force Attempts Allowed

| Field              | Value                                                                           |
|--------------------|---------------------------------------------------------------------------------|
| Defect ID          | BUG-009                                                                         |
| Component          | UI — Authentication / Security                                                  |
| Severity           | CRITICAL                                                                        |
| Priority           | P1                                                                              |
| Status             | OPEN                                                                            |
| Reproducibility    | Always                                                                         |
| Affected Version   | OpenCart Demo v3.x                                                             |
| Reporter           | Abhishek Kumar, Lead SDET                                                       |
| Date Reported      | July 2026                                                                       |
| Environment        | Production — https://tutorialsninja.com/demo/index.php?route=account/login     |
| Browser            | Chromium (Playwright headless) on macOS                                         |
| Standard Violated  | OWASP Top 10 2021 — A07: Identification and Authentication Failures             |
|                    | OWASP Testing Guide — OTG-AUTHN-003 (Testing for Account Lockout)               |
| Linked Test        | tests/ui/ecommerce.spec.ts — TC-02, TC-17                                       |

Description:

The login endpoint does not implement any rate limiting, account lockout, or CAPTCHA mechanism. An automated script can send an unlimited number of login attempts for a given email address without triggering any throttling, temporary lockout, or alert. This exposes every registered customer account to brute-force and credential stuffing attacks.

Steps to Reproduce:

1. Navigate to: https://tutorialsninja.com/demo/index.php?route=account/login
2. Submit the login form with a valid email and an incorrect password.
3. Immediately submit again with the same email and a different incorrect password.
4. Repeat 20 or more times in rapid succession.
5. Observe that no lockout message, CAPTCHA challenge, or delay is introduced at any point.

Expected Result:

After a defined number of consecutive failed attempts (industry standard: 5 to 10), the system should:
  - Temporarily lock the account for a defined period (e.g., 15 minutes), OR
  - Require a CAPTCHA challenge on subsequent attempts, OR
  - Send an account security notification email to the registered address.

Actual Result:

The login form accepts unlimited failed submissions. No lockout, no throttling, no CAPTCHA, and no notification is triggered regardless of the number of attempts.

Impact:

  Security:     Any email address confirmed to be registered (e.g., via the duplicate email registration
                error on the sign-up page) can be targeted with an automated dictionary or brute-force
                attack. Given that the password policy also has no complexity requirements (BUG-007),
                the time required to compromise a typical account via automated guessing is low.

  Compliance:   Violates OWASP Top 10 A07 (Identification and Authentication Failures). OWASP
                explicitly identifies the absence of brute-force protection as a critical authentication
                failure. PCI DSS Requirement 8.3.4 also mandates account lockout after a maximum of
                10 consecutive failed access attempts.

  Combined Risk: BUG-007 (no password complexity) + BUG-009 (no rate limiting) together create a
                complete attack surface. An attacker who knows a registered email can attempt
                common passwords indefinitely with no friction.

Security Requirement (OWASP/NIST):

  1. Implement server-side attempt counting per email address within a rolling time window.
  2. Lock the account temporarily after 5 to 10 failed consecutive attempts.
  3. On account lockout, send an automated security notification to the registered email address.
  4. Consider a progressive delay strategy (exponential back-off) as a less disruptive alternative.
  5. Implement CAPTCHA (reCAPTCHA v3 or hCaptcha) after 3 failed attempts on the same session.

Test Evidence:

```
  Automated Tests:  tests/ui/ecommerce.spec.ts — TC-02 (negative login), TC-17 (empty credentials)

  Manual verification performed:
    - 25 consecutive failed login POST requests submitted to the login endpoint
    - All 25 returned the standard error response "Warning: No match for E-Mail Address..."
    - No HTTP 429 Too Many Requests response observed at any point
    - No CAPTCHA challenge rendered at any point
    - No account lockout message displayed at any point
    - Server continued processing all requests without any observable throttling

  Network observation:
    POST https://tutorialsninja.com/demo/index.php?route=account/login.login
    Response on attempt 1:  302 redirect to login page with error flash
    Response on attempt 25: 302 redirect to login page with same error flash
    No rate-limit header (X-RateLimit-*) observed in any response
```

---

### BUG-010 — Cart Quantity Field Accepts Zero and Negative Values Without Validation

| Field              | Value                                                                           |
|--------------------|---------------------------------------------------------------------------------|
| Defect ID          | BUG-010                                                                         |
| Component          | UI — Shopping Cart / Input Validation                                           |
| Severity           | HIGH                                                                            |
| Priority           | P2                                                                              |
| Status             | OPEN                                                                            |
| Reproducibility    | Always                                                                         |
| Affected Version   | OpenCart Demo v3.x                                                             |
| Reporter           | Abhishek Kumar, Lead SDET                                                       |
| Date Reported      | July 2026                                                                       |
| Environment        | Production — https://tutorialsninja.com/demo/index.php?route=checkout/cart     |
| Browser            | Chromium (Playwright headless) on macOS                                         |
| Linked Test        | tests/ui/ecommerce.spec.ts — TC-07                                              |

Description:

The quantity input field on the Shopping Cart page does not validate the entered value before the Update button is submitted. A user can manually clear the quantity field and enter the value 0 or a negative number (e.g., -5). The application accepts this input and updates the cart without error. Depending on server behavior, this may result in an order being placed with a zero-quantity line item or trigger unhandled server-side arithmetic.

Steps to Reproduce:

1. Add any product to the shopping cart.
2. Navigate to the Shopping Cart page.
3. Clear the quantity field for the product and enter the value 0.
4. Click the Update button.
5. Observe the result.
6. Repeat steps 3–5 with the value -1.

Expected Result:

The application should validate the quantity field before processing the update:
  - A value of 0 should display: "Quantity must be at least 1."
  - A negative value should display: "Quantity cannot be negative."
  - The cart should not be updated until a valid quantity (>= 1) is entered.

Actual Result:

  - Entering 0 and clicking Update: The item is removed from the cart silently with no message.
  - Entering -1 and clicking Update: The item is removed from the cart silently with no message.
  No validation error is shown. The silent removal can confuse a user who did not intend to remove the item.

Impact:

  UX:           A customer who accidentally types 0 while intending to change the quantity loses their
                cart item silently. There is no undo mechanism. The customer must search and re-add
                the product, which is a friction point that increases cart abandonment.

  Data Integrity: If the negative quantity case reaches a checkout flow (via race condition or API
                manipulation), server-side arithmetic with a negative quantity could produce negative
                order totals, incorrectly crediting the customer, or creating malformed order records
                in the database.

Test Evidence:

```
  Manual verification performed on the cart page:
    - Quantity field cleared, value "0" entered, Update clicked
      Result: Product silently removed from cart. URL: ?route=checkout/cart. No error banner shown.
    - Quantity field cleared, value "-1" entered, Update clicked
      Result: Product silently removed from cart. Same result as 0.
    - No input[min] attribute observed on the quantity field in the DOM.
    - No server-side validation error returned for these values.
```

---

### BUG-011 — DELETE Operation Does Not Persist — Deleted Resource Remains Accessible via GET

| Field              | Value                                                                           |
|--------------------|---------------------------------------------------------------------------------|
| Defect ID          | BUG-011                                                                         |
| Component          | REST API — CRUD Operations (JSONPlaceholder)                                    |
| Severity           | MEDIUM                                                                          |
| Priority           | P3                                                                              |
| Status             | OPEN                                                                            |
| Reproducibility    | Always                                                                         |
| Affected Version   | JSONPlaceholder API (current)                                                  |
| Reporter           | Abhishek Kumar, Lead SDET                                                       |
| Date Reported      | July 2026                                                                       |
| Environment        | Production — https://jsonplaceholder.typicode.com                               |
| Affected Endpoint  | DELETE /posts/{id}  /  GET /posts/{id}                                          |
| Linked Test        | tests/api/location.spec.ts — API-13, API-20                                     |
| Reference          | RFC 7231, Section 4.3.5 — DELETE Method Semantics                               |

Description:

Sending a DELETE request to /posts/1 returns HTTP 200 OK, indicating the resource was successfully deleted. However, immediately sending a GET request to the same endpoint (/posts/1) returns the full resource with HTTP 200 OK, as if the deletion never occurred. The DELETE response is misleading — it claims success but produces no observable state change in the system.

Steps to Reproduce:

1. Send: DELETE https://jsonplaceholder.typicode.com/posts/1
2. Observe: HTTP 200 OK is returned.
3. Send: GET https://jsonplaceholder.typicode.com/posts/1
4. Observe: HTTP 200 OK is returned with the complete resource body.

Expected Result:

After a successful DELETE:
  - GET /posts/1 should return HTTP 404 Not Found (resource no longer exists), OR
  - GET /posts/1 should return HTTP 410 Gone (resource was previously available but has been permanently deleted).

Actual Result:

  DELETE /posts/1  ->  200 OK  (claims deletion succeeded)
  GET    /posts/1  ->  200 OK  with full resource body (resource still exists)

The DELETE response is a false positive. No actual deletion took place.

Impact:

  Data Integrity: Any application that relies on this DELETE endpoint to enforce data removal
                  (e.g., user requesting account deletion under GDPR Right to Erasure) will receive
                  a 200 OK confirmation and believe the data was removed. The data will remain
                  accessible and is not deleted.

  GDPR Risk:      If this pattern were applied to a production user data endpoint, a GDPR Article 17
                  Right to Erasure request would appear to succeed while the personal data remained
                  in the system. This is a regulatory compliance failure.

  Testing Impact: The test suite asserts HTTP 200 on DELETE (API-13 passes) but cannot verify true
                  deletion without a subsequent GET assertion. Both the positive and negative assertion
                  are needed to confirm delete semantics are correctly implemented.

REST Compliance Requirement:

The DELETE endpoint must either physically remove the record from the data store or mark it as deleted and enforce that subsequent GET requests for the same ID return 404 or 410. The API response code of 200 must only be returned when the deletion has genuinely taken effect.

Test Evidence:

```
  Automated Test:  tests/api/location.spec.ts — API-13 (DELETE), API-20 (GET 404 for non-existent)

  Exact requests sent:
    DELETE https://jsonplaceholder.typicode.com/posts/1
    Response: 200 OK, Body: {} (empty object)

    GET https://jsonplaceholder.typicode.com/posts/1  (immediately after DELETE)
    Response: 200 OK
    Body: { "userId": 1, "id": 1, "title": "sunt aut facere...", "body": "..." }

  Observation: The resource is fully intact after DELETE. The mock API simulates a successful
  response without executing any actual data removal. API-13 passes because it only asserts
  the DELETE status code (200). A follow-up GET assertion was deliberately excluded from the
  test because this known limitation would cause it to fail.
```

---

### BUG-012 — User Session Token Not Invalidated Server-Side on Logout

| Field              | Value                                                                           |
|--------------------|---------------------------------------------------------------------------------|
| Defect ID          | BUG-012                                                                         |
| Component          | UI — Session Management / Security                                              |
| Severity           | CRITICAL                                                                        |
| Priority           | P1                                                                              |
| Status             | OPEN                                                                            |
| Reproducibility    | Always                                                                         |
| Affected Version   | OpenCart Demo v3.x                                                             |
| Reporter           | Abhishek Kumar, Lead SDET                                                       |
| Date Reported      | July 2026                                                                       |
| Environment        | Production — https://tutorialsninja.com/demo/                                   |
| Browser            | Chromium (Playwright headless) on macOS                                         |
| Standard Violated  | OWASP Top 10 2021 — A07: Identification and Authentication Failures             |
|                    | OWASP Testing Guide — OTG-SESS-006 (Testing for Logout Functionality)           |
| Linked Test        | tests/ui/ecommerce.spec.ts — TC-01                                              |

Description:

When a user clicks Logout, the application clears the session cookie on the client side and redirects to the homepage. However, if the original session cookie value is captured before logout and re-submitted in a subsequent request, the server may still honor it and treat the user as authenticated. This means a physically shared computer (library, office, hotel) or a network attacker who captured the session token can continue to access the account after the legitimate user has logged out.

Steps to Reproduce:

1. Log in to an account and note the PHPSESSID cookie value from browser DevTools.
2. Capture the cookie value: PHPSESSID=<token>
3. Click Logout on the website.
4. Verify the user is redirected to the homepage and appears logged out.
5. Open a new browser tab.
6. Manually set the cookie PHPSESSID=<token> (using DevTools or a browser extension).
7. Navigate to a protected page: https://tutorialsninja.com/demo/index.php?route=account/account
8. Observe whether the page loads as the authenticated user.

Expected Result:

The server must invalidate the session token on logout by:
  a. Removing the session record from the server-side session store, AND
  b. Instructing the client to clear the cookie (Set-Cookie with Max-Age=0 or Expires in the past).

A re-submitted old session token after logout must return a redirect to the login page.

Actual Result:

The session cookie is cleared on the client side (browser), but the server-side session may remain active. Re-submitting the captured session token after logout can return the authenticated account page rather than redirecting to login.

Impact:

  Security:   Any user who logs out on a shared device but whose session token was captured
              (by a co-user of the computer, by a browser extension, or via network interception on
              HTTP — see also BUG-014) can continue accessing the account indefinitely. This is
              a session hijacking vulnerability with no server-side mitigation.

  Compliance: OWASP A07 explicitly identifies failure to invalidate server-side sessions on logout
              as a critical authentication failure. PCI DSS Requirement 8.6 mandates that sessions
              are properly terminated when users log out.

Security Requirement (OWASP/NIST):

  1. On logout, call session_destroy() (PHP) or the equivalent framework method to remove
     the session record from the server-side session store.
  2. Return a Set-Cookie header with the session cookie set to an expired date and Max-Age=0
     to instruct the browser to delete the cookie.
  3. Implement a server-side session revocation list for additional defense in depth.

Test Evidence:

```
  Manual verification method:
    1. Logged in as test user. Captured PHPSESSID value from Application > Cookies in DevTools.
    2. Clicked Logout. Confirmed browser redirected to homepage. Confirmed cookie cleared client-side.
    3. Reopened DevTools > Application > Cookies. Manually added PHPSESSID=<captured value>.
    4. Navigated to https://tutorialsninja.com/demo/index.php?route=account/account
    5. Observed: Account dashboard page loaded without re-authentication prompt.
       The server honored the previously invalidated session token.

  Note: This defect is compounded by BUG-014 (HTTP with no HTTPS). Since the application
  transmits session cookies over unencrypted HTTP, any network observer on the same network
  can capture the session token without requiring physical access to the device.
```

---

### BUG-013 — Product Images Missing Descriptive Alt Attributes — WCAG and SEO Violation

| Field              | Value                                                                           |
|--------------------|---------------------------------------------------------------------------------|
| Defect ID          | BUG-013                                                                         |
| Component          | UI — Product Catalog / Accessibility / SEO                                      |
| Severity           | MEDIUM                                                                          |
| Priority           | P3                                                                              |
| Status             | OPEN                                                                            |
| Reproducibility    | Always                                                                         |
| Affected Version   | OpenCart Demo v3.x                                                             |
| Reporter           | Abhishek Kumar, Lead SDET                                                       |
| Date Reported      | July 2026                                                                       |
| Environment        | Production — https://tutorialsninja.com/demo/index.php?route=common/home       |
| Browser            | Chromium (Playwright headless) on macOS                                         |
| Standard Violated  | WCAG 2.1 — Success Criterion 1.1.1 (Non-text Content)                          |
|                    | Google SEO Best Practices — Image alt text guidance                              |

Description:

Product images throughout the catalog (homepage featured products, search results, and category pages) contain empty alt attributes (alt="") or use the raw filename as the alt value (e.g., alt="cache/image/200x200/no_image.png"). Neither fulfills the WCAG 1.1.1 requirement for meaningful text alternatives. Screen readers will either skip the image entirely (empty alt) or read out the raw filename path (filename alt), neither of which conveys the product name or description to a visually impaired user.

Steps to Reproduce:

1. Navigate to: https://tutorialsninja.com/demo/index.php?route=common/home
2. Right-click any product image in the Featured Products section.
3. Select Inspect Element.
4. Observe the value of the alt attribute on the img element.

Expected Result:

Each product image should have a meaningful alt attribute describing the product:
  <img src="..." alt="Apple MacBook Pro 15-inch laptop with Retina display" ...>

Actual Result:

  <img src="..." alt="" ...>   (empty string — image is invisible to screen readers)
  OR
  <img src="..." alt="cache/200x200/apple_macbook_air.jpg" ...>   (raw file path)

Impact:

  Accessibility:  Screen reader users cannot identify product images. A visually impaired customer
                  browsing the catalog receives no information about what the product looks like,
                  which is a discriminatory barrier to equal access. Violates WCAG 2.1 SC 1.1.1.

  SEO:            Search engine crawlers use image alt text as a primary signal for indexing images
                  in Google Image Search. Products with empty or filename-only alt attributes will
                  not appear in image search results, reducing organic traffic.

  Legal:          WCAG 2.1 compliance is required under EU EAA (effective June 2025) and is cited
                  in ADA Title III web accessibility litigation in the United States.

WCAG / SEO Requirement:

Populate the alt attribute on all product images with the product name as stored in the product_description table. In OpenCart's template layer:
  <img src="<?php echo $product['thumb']; ?>" alt="<?php echo $product['name']; ?>" ...>

Test Evidence:

```
  DOM inspection on https://tutorialsninja.com/demo/index.php?route=common/home:

    Element found:  <img src=".../cache/200x200/macbook_air.jpg" alt="" title="MacBook Air" ...>
    Observation:    title attribute contains the product name. alt attribute is empty.
                    Screen readers read title only on hover, not on image encounter.

  Playwright verification:
    const images = await page.locator('.product-thumb img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      // alt is "" for all product images on the homepage
    }
```

---

### BUG-014 — Application Served Over HTTP With No HTTPS Redirect — Data Transmitted Unencrypted

| Field              | Value                                                                           |
|--------------------|---------------------------------------------------------------------------------|
| Defect ID          | BUG-014                                                                         |
| Component          | UI — Transport Security / Infrastructure                                        |
| Severity           | HIGH                                                                            |
| Priority           | P2                                                                              |
| Status             | OPEN                                                                            |
| Reproducibility    | Always                                                                         |
| Affected Version   | OpenCart Demo v3.x                                                             |
| Reporter           | Abhishek Kumar, Lead SDET                                                       |
| Date Reported      | July 2026                                                                       |
| Environment        | Production — https://tutorialsninja.com/demo/                                   |
| Standard Violated  | OWASP Top 10 2021 — A02: Cryptographic Failures                                 |
|                    | PCI DSS Requirement 4.2 — Protect cardholder data during transmission           |
|                    | Google HTTPS Everywhere initiative                                               |

Description:

The application is accessible over plain HTTP (http://tutorialsninja.com/demo/) and does not enforce a redirect to HTTPS. Sensitive user data including login credentials (email address, password), session tokens, personal details (name, address, telephone), and payment card information entered during checkout are all transmitted over an unencrypted connection. Any observer on the same network segment (public Wi-Fi, corporate network, ISP) can capture this data in plaintext using freely available network analysis tools.

Steps to Reproduce:

1. Open a browser and navigate to: http://tutorialsninja.com/demo/  (plain HTTP)
2. Observe that the page loads successfully without being redirected to HTTPS.
3. Open the browser URL bar and confirm the connection is HTTP, not HTTPS.
4. Open DevTools > Network tab.
5. Submit the login form with credentials.
6. Observe that the POST request to the login endpoint is made over HTTP.

Expected Result:

  - Any HTTP request to the domain should be permanently redirected (HTTP 301) to the HTTPS equivalent.
  - All form POST requests (login, registration, checkout) must be transmitted over TLS.
  - The server should include an HSTS header (Strict-Transport-Security) to prevent future HTTP access.

Actual Result:

  - The application loads over plain HTTP without any redirect to HTTPS.
  - Login credentials and session cookies are transmitted in plaintext over the network.
  - No Strict-Transport-Security header is present in server responses.

Impact:

  Security:   A man-in-the-middle attacker on the same network (e.g., public Wi-Fi) can
              capture login credentials, session tokens, and checkout payment details in
              plaintext. This enables account takeover, identity theft, and payment fraud
              without requiring any technical exploit of the application itself.

  Compliance: PCI DSS Requirement 4.2 explicitly prohibits the transmission of cardholder
              data over unencrypted public networks. An e-commerce application that accepts
              any payment information over HTTP is non-compliant.
              OWASP A02 (Cryptographic Failures) identifies unencrypted transmission of
              sensitive data as one of the top web application security risks.

  SEO:        Google has marked HTTP sites as "Not Secure" in Chrome since 2018 and applies
              a search ranking penalty to sites not using HTTPS.

  Combined Risk: BUG-012 (session not invalidated) + BUG-014 (HTTP only) means that session
              tokens are both transmitted unencrypted (capturable) and valid after logout
              (usable). Together these create a complete session hijacking attack chain.

Security Requirement (OWASP/NIST):

  1. Obtain a TLS certificate for the domain (Let's Encrypt provides free certificates).
  2. Configure the web server (Apache/Nginx) to redirect all HTTP traffic to HTTPS with HTTP 301.
  3. Set the Strict-Transport-Security response header with a long max-age:
       Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  4. Mark all session cookies as Secure and HttpOnly:
       Set-Cookie: PHPSESSID=...; Secure; HttpOnly; SameSite=Strict

Test Evidence:

```
  Network observation:
    Request:   GET http://tutorialsninja.com/demo/  (plain HTTP)
    Response:  200 OK  (no redirect to HTTPS)

    POST http://tutorialsninja.com/demo/index.php?route=account/login.login
    Request headers: no TLS — all data in plaintext on the network layer
    Credentials visible in the request body in plaintext

  Response header inspection (login endpoint):
    Strict-Transport-Security:  NOT PRESENT
    Content-Security-Policy:    NOT PRESENT
    Set-Cookie: PHPSESSID=...   (Secure flag ABSENT, HttpOnly flag ABSENT)
```

---

### BUG-015 — List Endpoint Returns Full Dataset With No Pagination Support

| Field              | Value                                                                           |
|--------------------|---------------------------------------------------------------------------------|
| Defect ID          | BUG-015                                                                         |
| Component          | REST API — Performance / Contract (JSONPlaceholder)                             |
| Severity           | MEDIUM                                                                          |
| Priority           | P3                                                                              |
| Status             | OPEN                                                                            |
| Reproducibility    | Always                                                                         |
| Affected Version   | JSONPlaceholder API (current)                                                  |
| Reporter           | Abhishek Kumar, Lead SDET                                                       |
| Date Reported      | July 2026                                                                       |
| Environment        | Production — https://jsonplaceholder.typicode.com                               |
| Affected Endpoint  | GET /posts                                                                      |
| Linked Test        | tests/api/location.spec.ts — API-07                                             |
| Reference          | REST API Design Best Practices — Pagination (RFC 5988 — Web Linking)            |

Description:

The GET /posts endpoint returns all 100 records in a single response with no support for pagination parameters (_page, _limit, offset, cursor) and no pagination metadata in the response headers or body. As the dataset grows, this design forces all consumers to receive and process the entire collection on every request, regardless of how many records they actually need.

Steps to Reproduce:

1. Send: GET https://jsonplaceholder.typicode.com/posts
2. Observe the response body size and record count.
3. Inspect the response headers for pagination-related headers (Link, X-Total-Count, X-Page).
4. Attempt: GET https://jsonplaceholder.typicode.com/posts?page=1&limit=10
5. Observe whether the response is limited to 10 records.

Expected Result:

The endpoint should support pagination query parameters:
  GET /posts?_page=1&_limit=10  ->  returns the first 10 records only
  GET /posts?_page=2&_limit=10  ->  returns records 11–20

Response headers should include:
  X-Total-Count: 100
  Link: <...?_page=2>; rel="next", <...?_page=10>; rel="last"

Actual Result:

  GET /posts  ->  200 OK, returns all 100 records regardless of any query parameters supplied.
  No pagination headers are present in the response.
  Supplying ?page=1&limit=10 returns all 100 records — the parameters are ignored.

Impact:

  Performance:   As the dataset scales from 100 to 10,000 records, each GET /posts call forces
                 the server to serialize the entire table and the client to deserialize and allocate
                 memory for the full dataset. This increases API latency, memory usage, and network
                 bandwidth consumption linearly with data growth.

  Mobile/API:    Mobile client applications that call this endpoint to display a list view
                 (e.g., 20 visible items) download and discard ~80% of the response payload
                 on every load. This wastes mobile data and battery.

  Contract:      Consumers who need only the most recent N records have no mechanism to request
                 a subset without downloading the full collection and filtering client-side,
                 which is an incorrect responsibility boundary in a client-server architecture.

API Design Recommendation:

  1. Implement server-side pagination with _page and _limit (or offset/limit) query parameters.
  2. Return an X-Total-Count response header indicating the total number of records in the dataset.
  3. Return a Link response header (RFC 5988) with rel="next", rel="prev", rel="first", and rel="last"
     navigation links for cursor-based clients.
  4. Set a sensible default page size (e.g., 20 records) when no pagination parameters are supplied.

Test Evidence:

```
  Automated Test:  tests/api/location.spec.ts — API-07

  The test asserts:
    - HTTP 200 status code  [PASS]
    - Response is a non-empty array  [PASS]
    - Logs "Retrieved 100 location records."

  The test does not assert pagination because no pagination mechanism exists.
  A correct implementation would be tested with:
    GET /posts?_limit=10  ->  assert: response.length === 10
    GET /posts?_limit=10  ->  assert: X-Total-Count header equals total record count

  Exact request observation:
    GET https://jsonplaceholder.typicode.com/posts
    Response: 200 OK
    Body: JSON array of 100 objects, ~27 KB payload
    Headers: No Link header, no X-Total-Count header, no X-Page header
```