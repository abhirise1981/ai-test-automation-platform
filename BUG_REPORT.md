# QA Assessment Bug Reports

As per the assessment guidelines, below are the formal bug tickets discovered during the UI and API automation testing phases. They have been documented in a standard Jira-style format.

---

## [BUG-001] UI Accessibility (A11y) Failure on Registration Form

* **Reporter**: Abhishek Kumar (SDET Lead)
* **Date/Time Tested**: July 10, 2026 (approx 14:30 UTC)
* **Environment**: `Production` (https://automationexercise.com/)
* **Browser/OS**: Chromium (Playwright) on macOS
* **Component**: UI / Registration Page
* **Severity**: High
* **Priority**: High

### Description:
When testing the application using strict ARIA/accessibility locators (e.g., Playwright's `getByLabel`), the personal information form fails to submit correctly. Upon inspection, the HTML `<label>` tags (e.g., `<label>Password *</label>`) are missing the corresponding `for=""` attributes, and they do not wrap the `<input>` elements. 

### Impact:
This completely breaks Web Accessibility (A11y). Screen readers cannot associate the labels with the input fields, making it impossible for visually impaired users to register. Furthermore, it causes standard accessibility-driven automation locators to silently fail during interaction.

### Steps to Reproduce:
1. Navigate to `https://automationexercise.com/login`
2. Enter a name and email, then click "Signup"
3. On the registration page, attempt to interact with the form fields using a screen reader (or via Playwright's `page.getByLabel('First name *')`).
4. Notice that the inputs are not properly targeted or read out.

### Expected Result:
Every `<label>` should have a `for` attribute that identically matches the `id` of its corresponding `<input>` field, ensuring semantic HTML compliance.

### Actual Result:
Labels lack the `for` attribute, breaking ARIA compliance.

### Workaround Applied:
For the automated test suite (`tests/ui/ecommerce.spec.ts`), we gracefully degraded the locators for the personal information form from `getByLabel` to direct CSS ID selectors (`#first_name`, `#password`, etc.) to ensure pipeline stability.

### Test Evidence:
*Please refer to the attached Playwright Trace Viewer logs (`trace.zip`) which demonstrate the `getByLabel` strict mode failure at the registration step.*

---

## [BUG-002] Navigation Hijacked by Google Vignette Ads Overlay

* **Reporter**: Abhishek Kumar (SDET Lead)
* **Date/Time Tested**: July 10, 2026 (approx 14:30 UTC)
* **Environment**: `Production` (https://automationexercise.com/)
* **Browser/OS**: Chromium, Firefox, WebKit (Playwright) on macOS
* **Component**: UI / Global Navigation
* **Severity**: Major
* **Priority**: High

### Description:
Clicking on internal page navigation links (such as "Products", "Cart", "Signup / Login") occasionally triggers a full-page Google Vignette advertisement overlay. This ad container injects an iframe that intercepts all pointer events and prevents the target page from submitting searches or displaying content until it is manually closed. This breaks test automation and severely degrades user experience.

### Steps to Reproduce:
1. Navigate to `https://automationexercise.com/`.
2. Click on the "Products" link in the header.
3. Observe if the URL transitions to `https://automationexercise.com/#google_vignette` and a full-page ad overlay covers the page.

### Expected Result:
The browser should navigate directly to `https://automationexercise.com/products` and display the products catalog immediately, without showing ads.

### Actual Result:
The page is hijacked by a Vignette ad iframe, blocking further interactions.

### Suggested Fix:
Disable third-party Google Ad scripts in development/sandbox environments, or implement an ad-free QA subdomain for testing.

### Workaround Applied:
Implemented dynamic URL redirection logic in the Page Object Model (POM) classes. If the URL contains `#google_vignette`, the page is forced to navigate directly to the target URL using `page.goto()`.

### Test Evidence:
*Please refer to the attached Playwright video recording (`ad_hijack.webm`) showing the iframe overlay blocking the pointer events during the `click` action.*

---

## [BUG-003] Improper Error Handling / Missing JSON on Invalid API Endpoint

* **Reporter**: Abhishek Kumar (SDET Lead)
* **Date/Time Tested**: July 10, 2026 (approx 14:30 UTC)
* **Environment**: `Production` (https://nominatim.openstreetmap.org/)
* **Browser/OS**: Node.js / Playwright APIRequestContext
* **Component**: REST API
* **Severity**: Medium
* **Priority**: Medium

### Description:
When sending a `GET` request to an invalid endpoint path on the location API, the server returns an HTML error page rather than a standardized JSON error response. 

### Impact:
Modern REST clients and frontend applications expect JSON payloads for programmatic error handling. Returning raw HTML for API errors can cause JSON parsers to crash unexpectedly in client applications.

### Steps to Reproduce:
1. Send a `GET` request to `https://nominatim.openstreetmap.org/invalid_endpoint_path_for_testing`
2. Observe the response headers and body.

### Expected Result:
The API should return a `404 Not Found` or `400 Bad Request` status code accompanied by a standard `application/json` payload (e.g., `{ "error": "Endpoint not found" }`).

### Actual Result:
The API returns a `404 Not Found` status code, but the `Content-Type` is `text/html` and the body is a full HTML page.

### Workaround Applied:
In our automated test suite (`tests/api/location.spec.ts`), we asserted strictly on the `404` status code and bypassed attempting to parse `.json()` on invalid endpoints to prevent test runner crashes.

### Test Evidence:
*Please refer to the attached API Response Payload screenshot showing the `Content-Type: text/html` header and raw XML/HTML body.*

---

## [BUG-004] Mixed Content Blocked (Google Fonts Load Fail)

* **Reporter**: Abhishek Kumar (SDET Lead)
* **Date/Time Tested**: July 10, 2026 (approx 14:30 UTC)
* **Environment**: `Production` (https://automationexercise.com/)
* **Browser/OS**: Chromium, Firefox, WebKit (Playwright) on macOS
* **Component**: UI / Styling
* **Severity**: Minor
* **Priority**: Low

### Description:
The website loads stylesheets for Google Fonts (Roboto, Open Sans, Abel) using the insecure HTTP protocol (`http://fonts.googleapis.com/...`) from a secure HTTPS host (`https://automationexercise.com/`). Modern web browsers automatically block these insecure resources due to mixed content security policies, causing a fallback to system sans-serif fonts.

### Steps to Reproduce:
1. Navigate to `https://automationexercise.com/`.
2. Open Browser Developer Tools (F12) and go to the Console tab.
3. Observe the mixed content blocking error logs:
   `Mixed Content: The page at 'https://automationexercise.com/' was loaded over HTTPS, but requested an insecure stylesheet 'http://fonts.googleapis.com/css?family=Roboto...'`

### Expected Result:
All external styles and fonts should load securely over HTTPS.

### Actual Result:
Browser blocks the HTTP stylesheet requests.

### Suggested Fix:
Update the font link tags in the HTML header to use secure HTTPS URLs or protocol-relative links:
```html
<!-- Before -->
<link href="http://fonts.googleapis.com/css?family=Roboto" rel="stylesheet">

<!-- After -->
<link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet">
```

### Test Evidence:
*Please refer to the attached browser console screenshot showing the Mixed Content blocking errors.*
