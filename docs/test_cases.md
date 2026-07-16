# Test Cases and Execution Report
# E-Commerce UI Automation / REST API Testing / Load Testing

Project:             Toptal SDET Screening Assessment
Application:         https://tutorialsninja.com/demo/  (OpenCart Demo)
API Services:        https://nominatim.openstreetmap.org  |  https://jsonplaceholder.typicode.com  |  https://postman-echo.com
Author:              Abhishek Kumar, Lead SDET
Framework:           Playwright v1.61.1  +  TypeScript  —  Page Object Model Architecture
Last Updated:        July 2026
Total Test Cases:    44  (20 UI  /  23 API  /  1 Load)
Execution Status:    All 43 automated tests passing. Load test executed and results recorded.

---

## Table of Contents

1. Conventions Used in This Document
2. Master Test Inventory
3. Part 1 — UI Test Cases (TC-01 to TC-20)
4. Part 2 — API Test Cases (API-01 to API-23)
5. Part 3 — Load Test Case (LOAD-01)

---

## 1. Conventions Used in This Document

### Priority Levels

| Label    | Definition                                                                       |
|----------|----------------------------------------------------------------------------------|
| CRITICAL | Failure blocks the core business function (login, checkout, order placement).    |
| HIGH     | Failure significantly degrades user experience or data integrity.                |
| MEDIUM   | Failure impacts secondary features; workarounds are possible.                    |
| LOW      | Cosmetic or informational; does not block users from completing tasks.            |

### Test Result Values

| Value       | Meaning                                                                       |
|-------------|-------------------------------------------------------------------------------|
| PASS        | Test executed and all assertions met the expected outcome.                    |
| FAIL        | Test executed and at least one assertion did not meet the expected outcome.   |
| BUG - PASS  | A confirmed defect exists. The test asserts the known broken behavior to track the bug and prevent regression on it. |
| EXECUTED    | Test ran to completion. Results recorded. (Used for load tests with SLA metrics rather than binary pass/fail.) |

### Test Type Definitions

| Type          | Description                                                                   |
|---------------|-------------------------------------------------------------------------------|
| Happy Path    | Tests the primary, successful user journey through a feature.                 |
| Negative      | Tests that the system correctly rejects invalid, missing, or malicious input. |
| Data-Driven   | The same test logic runs multiple times, each with a different input value.   |
| Corner Case   | Tests edge conditions and less common but valid usage scenarios.              |
| Security      | Tests authentication, authorization, and access control behavior.             |
| Schema        | Tests that the response structure and data types conform to the API contract. |
| Performance   | Tests system behavior and stability under high concurrency.                   |

---

## 2. Master Test Inventory

### 2.1 UI Test Suite — 20 Tests

| Test ID | Type          | Test Title                                               | Priority | Result |
|---------|---------------|----------------------------------------------------------|----------|--------|
| TC-01   | Happy Path    | User Registration and Full Login Verification            | CRITICAL | PASS   |
| TC-02   | Negative      | Login Rejected for Invalid Email and Password            | HIGH     | PASS   |
| TC-03   | Data-Driven   | Product Search — Keyword: MacBook                        | HIGH     | PASS   |
| TC-04   | Data-Driven   | Product Search — Keyword: HP                             | HIGH     | PASS   |
| TC-05   | Data-Driven   | Product Search — Keyword: Samsung                        | HIGH     | PASS   |
| TC-06   | Happy Path    | End-to-End: Add to Cart and Complete Full Checkout       | CRITICAL | PASS   |
| TC-07   | Happy Path    | Remove Product from Shopping Cart                        | HIGH     | PASS   |
| TC-08   | Happy Path    | Navigate Laptops and Notebooks Category                  | HIGH     | PASS   |
| TC-09   | Happy Path    | Contact Us Form — Successful Submission                  | MEDIUM   | PASS   |
| TC-10   | Happy Path    | Add Product to Wishlist (Authenticated User)             | HIGH     | PASS   |
| TC-11   | Negative      | Search Returns No Results for Non-Existent Product       | MEDIUM   | PASS   |
| TC-12   | Negative      | Checkout Blocked When Cart is Empty                      | HIGH     | PASS   |
| TC-13   | Negative      | Registration Rejected for Already-Registered Email       | CRITICAL | PASS   |
| TC-14   | Negative      | Registration Rejected for Mismatched Passwords           | HIGH     | PASS   |
| TC-15   | Negative      | Contact Form Blocked When All Fields Are Empty           | MEDIUM   | PASS   |
| TC-16   | Negative      | Out-of-Stock Item Blocked at Checkout                    | CRITICAL | PASS   |
| TC-17   | Corner Case   | Login Form Submitted With Empty Credentials              | HIGH     | PASS   |
| TC-18   | Corner Case   | Newsletter Subscription Preference Updated               | MEDIUM   | PASS   |
| TC-19   | Corner Case   | Add Product to Product Comparison List                   | MEDIUM   | PASS   |
| TC-20   | Corner Case   | Navigate to Brands (Manufacturers) Page via Footer       | MEDIUM   | PASS   |

### 2.2 API Test Suite — 23 Tests

| Test ID | HTTP Method | Endpoint Service      | Test Title                                                   | Expected Code | Priority | Result      |
|---------|-------------|-----------------------|--------------------------------------------------------------|---------------|----------|-------------|
| API-01  | GET         | Nominatim / OSM       | Geocode London — Status, Schema and Coordinate Validation    | 200           | CRITICAL | PASS        |
| API-02  | GET         | Nominatim / OSM       | Data-Driven Geocode — London                                 | 200           | HIGH     | PASS        |
| API-03  | GET         | Nominatim / OSM       | Data-Driven Geocode — New York                               | 200           | HIGH     | PASS        |
| API-04  | GET         | Nominatim / OSM       | Data-Driven Geocode — Tokyo (Unicode display name)           | 200           | HIGH     | PASS        |
| API-05  | GET         | Nominatim / OSM       | Invalid Endpoint Path                                        | 404           | HIGH     | PASS        |
| API-06  | GET         | Postman Echo          | Protected Resource Rejected Without Authorization Header     | 401           | HIGH     | PASS        |
| API-07  | GET         | JSONPlaceholder       | Retrieve All Location Records — Array Count Validation       | 200           | MEDIUM   | PASS        |
| API-08  | GET         | JSONPlaceholder       | Retrieve Single Location by ID — Schema Validation           | 200           | HIGH     | PASS        |
| API-09  | POST        | JSONPlaceholder       | Create Location — Response Body and ID Validation            | 201           | CRITICAL | PASS        |
| API-10  | POST        | JSONPlaceholder       | Create Location — Full JSON Schema Validation                | 201           | HIGH     | PASS        |
| API-11  | PUT         | JSONPlaceholder       | Update Existing Location — Values Reflected in Response      | 200           | HIGH     | PASS        |
| API-12  | PUT         | JSONPlaceholder       | Update Non-Existent Resource (Known Defect: 500 vs 404)      | 500           | MEDIUM   | BUG - PASS  |
| API-13  | DELETE      | JSONPlaceholder       | Delete Existing Location Record                              | 200           | HIGH     | PASS        |
| API-14  | GET         | Nominatim / OSM       | Empty Search Query Returns Empty Array Gracefully            | 200           | MEDIUM   | PASS        |
| API-15  | GET         | Nominatim / OSM       | Special Character Query Handled Without Server Error         | 200           | MEDIUM   | PASS        |
| API-16  | GET         | Nominatim / OSM       | Reverse Geocode Valid Coordinates to Address                 | 200           | HIGH     | PASS        |
| API-17  | GET         | Nominatim / OSM       | Reverse Geocode Impossible Coordinates (Known Defect: 200 vs 400) | 200      | HIGH     | BUG - PASS  |
| API-18  | GET         | Postman Echo          | Protected Resource Accepted With Valid Basic Auth Credentials | 200          | CRITICAL | PASS        |
| API-19  | GET         | Postman Echo          | Protected Resource Rejected With Invalid Basic Auth Credentials | 401        | CRITICAL | PASS        |
| API-20  | GET         | JSONPlaceholder       | Non-Existent Resource Returns 404 Not Found                  | 404           | HIGH     | PASS        |
| API-21  | GET         | JSONPlaceholder       | Query Parameter Filter Returns Correctly Filtered Array      | 200           | HIGH     | PASS        |
| API-22  | PATCH       | JSONPlaceholder       | Partial Update Modifies Only the Supplied Fields             | 200           | HIGH     | PASS        |
| API-23  | POST        | JSONPlaceholder       | Create Request With Unknown Fields — Unknown Fields Ignored  | 201           | MEDIUM   | PASS        |

### 2.3 Load Test Suite — 1 Test

| Test ID | Profile | Injection Mode              | Target URL  | SLA: Success Rate | SLA: Response Time | Result   |
|---------|---------|-----------------------------|-------------|-------------------|--------------------|----------|
| LOAD-01 | Stress  | 1,000 users over 15 seconds | / (Homepage)| >= 95%            | < 2,000 ms         | EXECUTED |

---

## 3. Part 1 — UI Test Cases

Technology:    Playwright v1.61.1 with TypeScript
Architecture:  Page Object Model. All element interactions go through dedicated page classes.
               No raw CSS selectors or URLs exist in test files.
Test Data:     Fully externalized to config/testConfig.ts. No hardcoded values in test logic.
Locators:      Fully centralized in config/uiConstants.ts.
Spec file:     tests/ui/ecommerce.spec.ts

---

### TC-01 — User Registration and Full Login Verification

| Field               | Value                                                                      |
|---------------------|----------------------------------------------------------------------------|
| Test ID             | TC-01                                                                      |
| Type                | Happy Path                                                                 |
| Priority            | CRITICAL                                                                   |
| Spec Reference      | tests/ui/ecommerce.spec.ts — "User Registration and Login Flow"            |
| Result              | PASS                                                                       |

Business Objective:
Account creation is the entry point to every transaction on the platform. If a customer cannot register or log back in, no purchase can ever be completed. This is the highest-priority functional flow.

Test Steps:

| Step | Action                                            | Expected Outcome                                      |
|------|---------------------------------------------------|-------------------------------------------------------|
| 1    | Navigate to the homepage                          | Page loads without error                              |
| 2    | Navigate to the registration page                 | Registration form is rendered                         |
| 3    | Enter name, a unique generated email, and password| All fields accept the input                           |
| 4    | Submit the registration form                      | User is redirected to the account success page        |
| 5    | Verify logged-in state via My Account dropdown    | Logout link is visible — session is active            |
| 6    | Click Logout                                      | Session is terminated                                 |
| 7    | Navigate to Login and enter the same credentials  | Login form accepts the submitted values               |
| 8    | Verify logged-in state again                      | Logout link is visible — re-authentication confirmed  |

Expected Result:  New account is created. User can immediately log back in with the registered credentials.
Actual Result:    PASS. Unique email is generated per test run using Date.now() combined with a random suffix to guarantee isolation across parallel workers.

---

### TC-02 — Login Rejected for Invalid Email and Password

| Field               | Value                                                                        |
|---------------------|------------------------------------------------------------------------------|
| Test ID             | TC-02                                                                        |
| Type                | Negative                                                                     |
| Priority            | HIGH                                                                         |
| Spec Reference      | tests/ui/ecommerce.spec.ts — "Negative Login Flow with Invalid Credentials"  |
| Result              | PASS                                                                         |

Business Objective:
The authentication system must actively reject credentials that do not match any registered account. Accepting invalid credentials would expose every customer account to unauthorized access.

Test Steps:

| Step | Action                                            | Expected Outcome                                |
|------|---------------------------------------------------|-------------------------------------------------|
| 1    | Navigate to the Login page                        | Login form is rendered                          |
| 2    | Enter a non-registered email and a wrong password | Fields accept the input                         |
| 3    | Click Login                                       | Form is submitted                               |
| 4    | Assert the danger alert banner is visible         | Error message displayed, user not authenticated |

Expected Result:  Login is rejected. Error alert is displayed. User remains on the login page unauthenticated.
Actual Result:    PASS

---

### TC-03, TC-04, TC-05 — Data-Driven Product Search

| Field               | Value                                                                          |
|---------------------|--------------------------------------------------------------------------------|
| Test IDs            | TC-03, TC-04, TC-05                                                            |
| Type                | Data-Driven                                                                    |
| Priority            | HIGH                                                                           |
| Spec Reference      | tests/ui/ecommerce.spec.ts — "Product Search for criteria: *"                  |
| Result              | PASS (all three)                                                               |

Business Objective:
Product search is the primary discovery mechanism for customers. A failing search engine directly prevents customers from finding products and completing purchases. The same test logic runs against multiple keywords from testConfig.searchCriteria to validate the search engine across different product categories in a single automated pass.

Test Input Data:

| Test ID | Keyword  | Actual Results Found | Expected  |
|---------|----------|---------------------|-----------|
| TC-03   | MacBook  | 3 products          | >= 1      |
| TC-04   | HP       | 1 product           | >= 1      |
| TC-05   | Samsung  | 2 products          | >= 1      |

Test Steps (applied to each keyword):

| Step | Action                                  | Expected Outcome              |
|------|-----------------------------------------|-------------------------------|
| 1    | Navigate to Product Search page         | Search form is rendered       |
| 2    | Enter keyword into the search input     | Field accepts the input       |
| 3    | Submit the search                       | Results page loads            |
| 4    | Count product-layout elements on page   | Count is greater than zero    |

Expected Result:  Each search keyword returns at least one product result.
Actual Result:    PASS (all three keywords)

---

### TC-06 — End-to-End: Add to Cart and Complete Full Checkout

| Field               | Value                                                                                   |
|---------------------|-----------------------------------------------------------------------------------------|
| Test ID             | TC-06                                                                                   |
| Type                | Happy Path — End-to-End                                                                 |
| Priority            | CRITICAL                                                                                |
| Spec Reference      | tests/ui/ecommerce.spec.ts — "Add Product to Cart and Complete Checkout Flow"           |
| Result              | PASS                                                                                    |

Business Objective:
This test covers the complete revenue-generating flow of the application. A failure at any step — from search to cart to order confirmation — means the platform cannot process transactions. This is the most important automated test in the suite.

Test Steps:

| Step | Action                                                              | Expected Outcome                                          |
|------|---------------------------------------------------------------------|-----------------------------------------------------------|
| 1    | Register a new account                                              | Account created, user authenticated                       |
| 2    | Navigate to Products and search "HP"                                | Search results page displayed                             |
| 3    | Add the first result to the shopping cart                           | Success alert is visible                                  |
| 4    | Navigate to the Shopping Cart page                                  | Cart page loads                                           |
| 5    | Assert the cart contains at least one item                          | Item count greater than zero confirmed                    |
| 6    | Click Proceed to Checkout                                           | Six-step accordion checkout form is rendered              |
| 7    | Fill billing address from testConfig (name, address, city, country) | All fields accept the values from config                  |
| 8    | Continue through Delivery Details and Delivery Method steps         | Each accordion step progresses without error              |
| 9    | Accept terms and select Cash on Delivery payment method             | Step 5 of checkout completed                              |
| 10   | Click Confirm Order                                                 | Order is submitted                                        |
| 11   | Assert the order confirmation heading is visible                    | "Your order has been placed!" heading confirmed on screen |

Expected Result:  Order is placed and confirmed. Confirmation heading is displayed on screen.
Actual Result:    PASS. Logged: "Order successfully placed and confirmed!"

---

### TC-07 — Remove Product from Shopping Cart

| Field               | Value                                                             |
|---------------------|-------------------------------------------------------------------|
| Test ID             | TC-07                                                             |
| Type                | Happy Path                                                        |
| Priority            | HIGH                                                              |
| Spec Reference      | tests/ui/ecommerce.spec.ts — "Remove Product from Cart"           |
| Result              | PASS                                                              |

Business Objective:
Customers must be able to remove unwanted items from their cart before checkout. A broken remove function forces customers to either purchase unwanted items or abandon the cart entirely.

Test Steps:

| Step | Action                                               | Expected Outcome                               |
|------|------------------------------------------------------|------------------------------------------------|
| 1    | Search for MacBook and add the first result to cart  | Success alert is visible                       |
| 2    | Navigate to the Shopping Cart page                   | Cart displays one table row                    |
| 3    | Assert at least one row exists in the cart table     | Row count greater than zero confirmed          |
| 4    | Click the Remove button on the first cart item       | Removal request is submitted                   |
| 5    | Assert the empty cart message is visible             | "Your shopping cart is empty!" text displayed  |

Expected Result:  Cart is empty after the item is removed.
Actual Result:    PASS

---

### TC-08 — Navigate Laptops and Notebooks Category

| Field               | Value                                                                        |
|---------------------|------------------------------------------------------------------------------|
| Test ID             | TC-08                                                                        |
| Type                | Happy Path                                                                   |
| Priority            | HIGH                                                                         |
| Spec Reference      | tests/ui/ecommerce.spec.ts — "Navigate Categories and Verify Products"       |
| Result              | PASS                                                                         |

Business Objective:
Category navigation is the primary browsing method for customers who are not searching for a specific product. If a category page fails to load, an entire product range becomes invisible to customers.

Test Steps:

| Step | Action                                              | Expected Outcome                                       |
|------|-----------------------------------------------------|--------------------------------------------------------|
| 1    | Navigate directly to ROUTES.CATEGORY_LAPTOPS        | Category page loads                                    |
| 2    | Assert URL contains the correct category route      | URL pattern confirmed                                  |
| 3    | Count product-layout elements on the page           | At least one product is displayed                      |

Expected Result:  Laptops and Notebooks category page loads and displays products.
Actual Result:    PASS

---

### TC-09 — Contact Us Form — Successful Submission

| Field               | Value                                                                  |
|---------------------|------------------------------------------------------------------------|
| Test ID             | TC-09                                                                  |
| Type                | Happy Path                                                             |
| Priority            | MEDIUM                                                                 |
| Spec Reference      | tests/ui/ecommerce.spec.ts — "Contact Us Form Submission"              |
| Result              | PASS                                                                   |

Business Objective:
The Contact form is the primary support channel for customers who need assistance. If the form fails to submit, customers cannot reach support and may raise chargebacks or escalate on social media.

Test Steps:

| Step | Action                                                        | Expected Outcome                              |
|------|---------------------------------------------------------------|-----------------------------------------------|
| 1    | Navigate to ROUTES.CONTACT                                    | Contact form is rendered                      |
| 2    | Fill Name, Email, and Enquiry fields from testConfig values   | All fields accept the input                   |
| 3    | Click the Submit button                                       | Form is submitted                             |
| 4    | Wait for redirect to ROUTES.CONTACT_SUCCESS                   | URL changes to the success route              |
| 5    | Assert the page heading contains "Contact Us"                 | Correct page confirmed after submission       |
| 6    | Assert the Continue link is visible                           | Post-submission navigation is available       |

Expected Result:  Form submits successfully. User is redirected to the Contact Us success page.
Actual Result:    PASS

---

### TC-10 — Add Product to Wishlist (Authenticated User)

| Field               | Value                                                                       |
|---------------------|-----------------------------------------------------------------------------|
| Test ID             | TC-10                                                                       |
| Type                | Happy Path                                                                  |
| Priority            | HIGH                                                                        |
| Spec Reference      | tests/ui/ecommerce.spec.ts — "Add Product to Wishlist (Requires Login)"     |
| Result              | PASS                                                                        |

Business Objective:
Wishlists drive return visits and deferred purchases. A broken wishlist reduces repeat customer engagement and negatively impacts long-term revenue.

Test Steps:

| Step | Action                                              | Expected Outcome                              |
|------|-----------------------------------------------------|-----------------------------------------------|
| 1    | Register a new account                              | User is authenticated                         |
| 2    | Search for HP and view results                      | Search results are displayed                  |
| 3    | Click the Wishlist button on the first product      | Success alert is visible                      |
| 4    | Assert the success alert is visible                 | Confirmation that item was added              |
| 5    | Navigate to ROUTES.WISHLIST                         | Wishlist account page loads                   |
| 6    | Assert the wishlist table contains at least one row | Product confirmed present in wishlist         |

Expected Result:  Product is added to the wishlist and appears on the Wishlist page.
Actual Result:    PASS

---

### TC-11 — Search Returns No Results for Non-Existent Product

| Field               | Value                                                                            |
|---------------------|----------------------------------------------------------------------------------|
| Test ID             | TC-11                                                                            |
| Type                | Negative                                                                         |
| Priority            | MEDIUM                                                                           |
| Spec Reference      | tests/ui/ecommerce.spec.ts — "[Negative] Search for Non-Existent Product"        |
| Result              | PASS                                                                             |

Business Objective:
A search with no matching products must return a clear, informative message rather than a blank page or an application error.

Test Steps:

| Step | Action                                                      | Expected Outcome                                           |
|------|-------------------------------------------------------------|------------------------------------------------------------|
| 1    | Navigate to Products page                                   | Search form is rendered                                    |
| 2    | Search for testConfig.negative.invalidProduct               | No database match is possible for this value               |
| 3    | Assert the no-results message is visible on the page        | Informative message displayed, no crash                    |

Expected Result:  "There is no product that matches the search criteria." is displayed.
Actual Result:    PASS

---

### TC-12 — Checkout Blocked When Cart is Empty

| Field               | Value                                                                   |
|---------------------|-------------------------------------------------------------------------|
| Test ID             | TC-12                                                                   |
| Type                | Negative                                                                |
| Priority            | HIGH                                                                    |
| Spec Reference      | tests/ui/ecommerce.spec.ts — "[Negative] Checkout with Empty Cart"      |
| Result              | PASS                                                                    |
| Related Defect      | BUG-004 in BUG_REPORT.md                                                |

Business Objective:
The system must prevent a customer from reaching the payment form when the cart is empty. This prevents phantom orders and downstream payment failures.

Test Steps:

| Step | Action                                              | Expected Outcome                                    |
|------|-----------------------------------------------------|-----------------------------------------------------|
| 1    | Navigate directly to ROUTES.CHECKOUT with empty cart| Server evaluates cart state before rendering form   |
| 2    | Assert URL is redirected to ROUTES.CART             | Checkout is blocked, user is sent back to cart      |
| 3    | Assert the empty cart message is visible            | Informative message displayed                       |

Expected Result:  User is redirected to the cart page. "Your shopping cart is empty!" is displayed.
Actual Result:    PASS.
Note:             A related defect (BUG-004) documents that the redirect contains no user-facing explanation for why the checkout page was denied. The redirect itself is correct but the lack of error context is a UX deficiency.

---

### TC-13 — Registration Rejected for Already-Registered Email

| Field               | Value                                                                             |
|---------------------|-----------------------------------------------------------------------------------|
| Test ID             | TC-13                                                                             |
| Type                | Negative                                                                          |
| Priority            | CRITICAL                                                                          |
| Spec Reference      | tests/ui/ecommerce.spec.ts — "[Negative] Register with Existing Email"            |
| Result              | PASS                                                                              |

Business Objective:
Each email address must correspond to exactly one account. Allowing duplicate registrations would cause data integrity failures, broken login flows, and payment record corruption.

Test Steps:

| Step | Action                                               | Expected Outcome                                              |
|------|------------------------------------------------------|---------------------------------------------------------------|
| 1    | Register a new account with a generated unique email | Account created                                               |
| 2    | Logout                                               | Session terminated                                            |
| 3    | Navigate to Registration page again                  | Registration form rendered                                    |
| 4    | Re-enter the exact same email used in step 1         | Fields accept the input                                       |
| 5    | Submit the form                                      | Server validates email uniqueness                             |
| 6    | Assert the danger alert contains the duplicate warning| Error message displayed                                      |

Expected Result:  Registration rejected. "Warning: E-Mail Address is already registered!" is displayed.
Actual Result:    PASS

---

### TC-14 — Registration Rejected for Mismatched Passwords

| Field               | Value                                                                                  |
|---------------------|----------------------------------------------------------------------------------------|
| Test ID             | TC-14                                                                                  |
| Type                | Negative                                                                               |
| Priority            | HIGH                                                                                   |
| Spec Reference      | tests/ui/ecommerce.spec.ts — "[Negative] Register with Mismatched Passwords"           |
| Result              | PASS                                                                                   |

Business Objective:
A mismatched password confirmation is a common user typing error. Allowing registration to proceed with mismatched passwords would create an account the user cannot access because they do not know what the actual saved password is.

Test Steps:

| Step | Action                                                           | Expected Outcome                             |
|------|------------------------------------------------------------------|----------------------------------------------|
| 1    | Navigate to Registration page                                    | Registration form rendered                   |
| 2    | Fill all required fields with valid data from testConfig         | Fields accept the input                      |
| 3    | Enter a valid password in the Password field                     | Field accepts the input                      |
| 4    | Enter a different value in Confirm Password (testConfig.negative.mismatchedPassword) | Field accepts the input |
| 5    | Submit the form                                                  | Validation logic is triggered                |
| 6    | Assert the password mismatch error is visible                    | Validation error displayed below field       |

Expected Result:  Form submission rejected. "Password confirmation does not match password!" is displayed.
Actual Result:    PASS

---

### TC-15 — Contact Form Blocked When All Fields Are Empty

| Field               | Value                                                                           |
|---------------------|---------------------------------------------------------------------------------|
| Test ID             | TC-15                                                                           |
| Type                | Negative                                                                        |
| Priority            | MEDIUM                                                                          |
| Spec Reference      | tests/ui/ecommerce.spec.ts — "[Negative] Submit Contact Form Empty"             |
| Result              | PASS                                                                            |

Business Objective:
Required field validation prevents empty or meaningless support submissions from reaching the support queue.

Test Steps:

| Step | Action                                         | Expected Outcome                            |
|------|------------------------------------------------|---------------------------------------------|
| 1    | Navigate to ROUTES.CONTACT                     | Contact form is rendered                    |
| 2    | Click Submit without entering any field values | Client-side or server-side validation runs  |
| 3    | Assert Name required error is visible          | Error shown below Name field                |
| 4    | Assert Email required error is visible         | Error shown below Email field               |
| 5    | Assert Enquiry required error is visible       | Error shown below Enquiry field             |

Expected Result:  Three required-field validation errors are displayed simultaneously. Form is not submitted.
Actual Result:    PASS

---

### TC-16 — Out-of-Stock Item Blocked at Checkout

| Field               | Value                                                                            |
|---------------------|----------------------------------------------------------------------------------|
| Test ID             | TC-16                                                                            |
| Type                | Negative                                                                         |
| Priority            | CRITICAL                                                                         |
| Spec Reference      | tests/ui/ecommerce.spec.ts — "[Negative] Add Out of Stock Item and Checkout"     |
| Result              | PASS                                                                             |
| Related Defect      | BUG-005 in BUG_REPORT.md                                                         |

Business Objective:
Completing a transaction for an out-of-stock product creates a failed fulfilment event, customer complaints, and potential legal liability for non-delivery. The system must block checkout for products with no available stock.

Test Steps:

| Step | Action                                                      | Expected Outcome                                   |
|------|-------------------------------------------------------------|----------------------------------------------------|
| 1    | Search for testConfig.negative.outOfStockProduct (iMac)     | Product appears in search results                  |
| 2    | Add the first result to the cart                            | Item is added without immediate stock warning      |
| 3    | Navigate to the Shopping Cart page                          | Cart page loads                                    |
| 4    | Assert the danger alert contains the out-of-stock warning   | Warning message visible in the cart                |
| 5    | Click Proceed to Checkout                                   | Checkout is attempted                              |
| 6    | Assert URL remains at ROUTES.CART                           | Checkout blocked, user stays on cart page          |

Expected Result:  Out-of-stock warning is displayed in the cart. Proceeding to checkout is blocked.
Actual Result:    PASS.
Note:             A related defect (BUG-005) documents that the stock warning only appears after the user has navigated to the cart page rather than at the point of clicking Add to Cart. The checkout block is correct; the early warning is absent.

---

### TC-17 — Login Form Submitted With Empty Credentials

| Field               | Value                                                                        |
|---------------------|------------------------------------------------------------------------------|
| Test ID             | TC-17                                                                        |
| Type                | Corner Case                                                                  |
| Priority            | HIGH                                                                         |
| Spec Reference      | tests/ui/ecommerce.spec.ts — "[Corner Case] Login with Empty Credentials"    |
| Result              | PASS                                                                         |

Business Objective:
Submitting a login form with no input is a common accidental user action. The system must respond with a clear error rather than silently failing or throwing an unhandled exception.

Test Steps:

| Step | Action                                               | Expected Outcome                               |
|------|------------------------------------------------------|------------------------------------------------|
| 1    | Navigate to the Login page                           | Login form is rendered                         |
| 2    | Click Login without entering email or password       | Form submission is processed                   |
| 3    | Assert the danger alert is visible                   | Error message displayed to the user            |

Expected Result:  "Warning: No match for E-Mail Address and/or Password." error is displayed.
Actual Result:    PASS

---

### TC-18 — Newsletter Subscription Preference Updated

| Field               | Value                                                                           |
|---------------------|---------------------------------------------------------------------------------|
| Test ID             | TC-18                                                                           |
| Type                | Corner Case                                                                     |
| Priority            | MEDIUM                                                                          |
| Spec Reference      | tests/ui/ecommerce.spec.ts — "[Corner Case] Subscribe to Newsletter"            |
| Result              | PASS                                                                            |

Business Objective:
Newsletter subscriptions are a direct marketing channel. A failed preference update could result in customers receiving communications they did not consent to (a GDPR compliance risk) or missing communications they explicitly requested.

Test Steps:

| Step | Action                                                      | Expected Outcome                                          |
|------|-------------------------------------------------------------|-----------------------------------------------------------|
| 1    | Register a new account with a unique email                  | User is authenticated                                     |
| 2    | Navigate to ROUTES.NEWSLETTER                               | Newsletter preference page loads                          |
| 3    | Select the Yes radio option                                 | Option is selected                                        |
| 4    | Click Submit                                                | Preference is saved                                       |
| 5    | Assert the success alert contains the confirmation message  | Subscription update confirmed on screen                   |

Expected Result:  "Your newsletter subscription has been successfully updated!" is displayed.
Actual Result:    PASS

---

### TC-19 — Add Product to Product Comparison List

| Field               | Value                                                                       |
|---------------------|-----------------------------------------------------------------------------|
| Test ID             | TC-19                                                                       |
| Type                | Corner Case                                                                 |
| Priority            | MEDIUM                                                                      |
| Spec Reference      | tests/ui/ecommerce.spec.ts — "[Corner Case] Add Product to Compare"         |
| Result              | PASS                                                                        |

Business Objective:
The product comparison feature helps customers make informed purchase decisions by evaluating specifications side by side. A broken comparison tool reduces purchase confidence and increases decision-making time.

Test Steps:

| Step | Action                                                       | Expected Outcome                                |
|------|--------------------------------------------------------------|-------------------------------------------------|
| 1    | Navigate to ROUTES.HOME                                      | Homepage loads with the product grid visible    |
| 2    | Click the Compare this Product button on the first product   | Comparison action is triggered                  |
| 3    | Assert the success alert contains "You have added"           | Confirmation that the product was added         |

Expected Result:  "Success: You have added [Product Name] to your product comparison!" alert is visible.
Actual Result:    PASS

---

### TC-20 — Navigate to Brands (Manufacturers) Page via Footer

| Field               | Value                                                                                   |
|---------------------|-----------------------------------------------------------------------------------------|
| Test ID             | TC-20                                                                                   |
| Type                | Corner Case                                                                             |
| Priority            | MEDIUM                                                                                  |
| Spec Reference      | tests/ui/ecommerce.spec.ts — "[Corner Case] Navigate to Brands (Manufacturers) Page"   |
| Result              | PASS                                                                                    |

Business Objective:
The Brands page allows customers to browse products by manufacturer. If the footer navigation link is broken, the Brands discovery pathway is completely unavailable.

Test Steps:

| Step | Action                                                    | Expected Outcome                              |
|------|-----------------------------------------------------------|-----------------------------------------------|
| 1    | Navigate to ROUTES.HOME                                   | Homepage loads with the footer visible        |
| 2    | Click the Brands link in the footer                       | Navigation is triggered                       |
| 3    | Assert the page heading equals "Find Your Favorite Brand" | Correct destination page is confirmed         |

Expected Result:  Brands page loads displaying the heading "Find Your Favorite Brand".
Actual Result:    PASS

---

## 4. Part 2 — API Test Cases

Technology:      Playwright APIRequestContext with TypeScript
Architecture:    API Object Model. All HTTP requests are encapsulated in api/LocationApiClient.ts.
                 Test spec files contain only assertions. No raw HTTP calls exist in test files.
Services Tested:
  - Nominatim OpenStreetMap (https://nominatim.openstreetmap.org) — Geocoding and Reverse Geocoding
  - JSONPlaceholder (https://jsonplaceholder.typicode.com) — Mock REST CRUD operations
  - Postman Echo (https://postman-echo.com) — Authentication verification
Spec file:       tests/api/location.spec.ts

---

### API-01 — Geocode London — Status, Schema and Coordinate Validation (200 OK)

| Field               | Value                                                                              |
|---------------------|------------------------------------------------------------------------------------|
| Test ID             | API-01                                                                             |
| HTTP Method         | GET                                                                                |
| Endpoint            | /search?q=London&format=json&limit=1  (Nominatim OpenStreetMap)                   |
| Type                | Happy Path — Schema Validation                                                     |
| Priority            | CRITICAL                                                                           |
| Result              | PASS                                                                               |

Business Objective:
Converting a city name to geographic coordinates (geocoding) is the foundational operation of any location service. If this fails for a major world city, the entire service is non-functional.

Test Steps:

| Step | Action                                       | Assertion                                                              |
|------|----------------------------------------------|------------------------------------------------------------------------|
| 1    | GET /search?q=London&format=json&limit=1     | HTTP status must be 200                                                |
| 2    | Parse response body as JSON                  | Body must be a JSON array containing at least one element              |
| 3    | Validate schema of first result              | Must contain: lat, lon, display_name, osm_type, place_id               |
| 4    | Validate coordinate data types               | lat and lon must parse as valid floating-point numbers                 |

Expected Result:  200 OK. Valid schema returned. London coordinates confirmed.
Actual Result:    PASS. Retrieved: Greater London, England, United Kingdom (Lat: 51.5074456, Lon: -0.1277653)

---

### API-02, API-03, API-04 — Data-Driven Geocoding for Multiple Cities (200 OK)

| Field               | Value                                                                              |
|---------------------|------------------------------------------------------------------------------------|
| Test IDs            | API-02, API-03, API-04                                                             |
| HTTP Method         | GET                                                                                |
| Endpoint            | /search?q={city}&format=json  (Nominatim OpenStreetMap)                           |
| Type                | Data-Driven — Global Coverage                                                      |
| Priority            | HIGH                                                                               |
| Result              | PASS (all three)                                                                   |

Business Objective:
A geocoding service that operates correctly for only one city has no commercial value. The same schema validation logic runs automatically across cities on three different continents.

Test Input Data:

| Test ID | City     | Expected Display Name Region | Actual Result              |
|---------|----------|------------------------------|----------------------------|
| API-02  | London   | England, United Kingdom      | Greater London, England, United Kingdom |
| API-03  | New York | United States                | New York, United States                 |
| API-04  | Tokyo    | Japan (Unicode)              | Tokyoto, Nihon (returned in Japanese characters — correct behavior) |

Note: Nominatim returns city and country names in the local language of the region. The Tokyo result displays Japanese characters (Unicode), which is correct and expected. Our tests validate the response structure — that lat and lon are present and are numeric — not the language of the display name.

Expected Result:  All three cities return 200 OK with a valid coordinate schema.
Actual Result:    PASS (all three)

---

### API-05 — Invalid Endpoint Path Returns 404 Not Found

| Field               | Value                                                                              |
|---------------------|------------------------------------------------------------------------------------|
| Test ID             | API-05                                                                             |
| HTTP Method         | GET                                                                                |
| Endpoint            | /invalid_endpoint_path_for_testing  (Nominatim OpenStreetMap)                     |
| Type                | Negative — Error Handling                                                          |
| Priority            | HIGH                                                                               |
| Result              | PASS                                                                               |
| Related Defect      | BUG-003 in BUG_REPORT.md                                                           |

Test Steps:

| Step | Action                                     | Assertion                    |
|------|--------------------------------------------|------------------------------|
| 1    | GET /invalid_endpoint_path_for_testing     | HTTP status must be 404      |

Expected Result:  404 Not Found
Actual Result:    PASS. Note: the response body is text/html (an HTML error page) rather than application/json. This is a separate defect documented as BUG-003.

---

### API-06 — Protected Resource Rejected Without Authorization Header (401 Unauthorized)

| Field               | Value                                                                              |
|---------------------|------------------------------------------------------------------------------------|
| Test ID             | API-06                                                                             |
| HTTP Method         | GET                                                                                |
| Endpoint            | /basic-auth  (Postman Echo)                                                        |
| Type                | Security — Authentication                                                          |
| Priority            | HIGH                                                                               |
| Result              | PASS                                                                               |

Business Objective:
Any endpoint that requires authentication must actively reject unauthenticated requests. If it does not, all protected data is publicly accessible without credentials.

Test Steps:

| Step | Action                                         | Assertion                         |
|------|------------------------------------------------|-----------------------------------|
| 1    | GET /basic-auth with no Authorization header   | HTTP status must be 401           |

Expected Result:  401 Unauthorized
Actual Result:    PASS

---

### API-07 — Retrieve All Location Records — Array Count Validation (200 OK)

| Field               | Value                                                                         |
|---------------------|-------------------------------------------------------------------------------|
| Test ID             | API-07                                                                        |
| HTTP Method         | GET                                                                           |
| Endpoint            | /posts  (JSONPlaceholder)                                                     |
| Type                | Happy Path — List Retrieval                                                   |
| Priority            | MEDIUM                                                                        |
| Result              | PASS                                                                          |

Test Steps:

| Step | Action        | Assertion                                          |
|------|---------------|----------------------------------------------------|
| 1    | GET /posts    | HTTP status must be 200                            |
| 2    | Parse body    | Must be a non-empty JSON array                     |

Expected Result:  200 OK with a list of location records.
Actual Result:    PASS. 100 records retrieved.

---

### API-08 — Retrieve Single Location by ID — Schema Validation (200 OK)

| Field               | Value                                                                         |
|---------------------|-------------------------------------------------------------------------------|
| Test ID             | API-08                                                                        |
| HTTP Method         | GET                                                                           |
| Endpoint            | /posts/1  (JSONPlaceholder)                                                   |
| Type                | Happy Path — Single Record and Schema                                         |
| Priority            | HIGH                                                                          |
| Result              | PASS                                                                          |

Test Steps:

| Step | Action         | Assertion                                          |
|------|----------------|----------------------------------------------------|
| 1    | GET /posts/1   | HTTP status must be 200                            |
| 2    | Validate id    | Response body must contain "id": 1                 |
| 3    | Validate schema| Must contain: title, body, userId                  |

Expected Result:  200 OK with complete schema for record ID 1.
Actual Result:    PASS

---

### API-09 — Create Location — Response Body and ID Validation (201 Created)

| Field               | Value                                                                         |
|---------------------|-------------------------------------------------------------------------------|
| Test ID             | API-09                                                                        |
| HTTP Method         | POST                                                                          |
| Endpoint            | /posts  (JSONPlaceholder)                                                     |
| Type                | Happy Path — Resource Creation                                                |
| Priority            | CRITICAL                                                                      |
| Result              | PASS                                                                          |

Business Objective:
The ability to create new location records is the foundation of the entire location management system. If POST fails, no new data can ever be added.

Test Steps:

| Step | Action                                           | Assertion                                               |
|------|--------------------------------------------------|---------------------------------------------------------|
| 1    | POST /posts with title, body, userId from testConfig.api.sampleLocation | HTTP status must be 201            |
| 2    | Validate echoed fields                           | title and body in response must match the request payload |
| 3    | Validate auto-generated ID                       | id field must be present in the response                |

Expected Result:  201 Created. All submitted fields echoed back. Auto-generated ID assigned.
Actual Result:    PASS. "Central Park New York" created with ID: 101

---

### API-10 — Create Location — Full JSON Schema Validation (201 Created)

| Field               | Value                                                                         |
|---------------------|-------------------------------------------------------------------------------|
| Test ID             | API-10                                                                        |
| HTTP Method         | POST                                                                          |
| Endpoint            | /posts  (JSONPlaceholder)                                                     |
| Type                | Happy Path — Schema Completeness                                              |
| Priority            | HIGH                                                                          |
| Result              | PASS                                                                          |

Test Steps:

| Step | Action                              | Assertion                                              |
|------|-------------------------------------|--------------------------------------------------------|
| 1    | POST /posts with valid payload      | HTTP status must be 201                                |
| 2    | Full schema inspection              | Response must contain all four fields: id, title, body, userId |

Expected Result:  201 Created with a fully complete JSON schema.
Actual Result:    PASS

---

### API-11 — Update Existing Location — Values Reflected in Response (200 OK)

| Field               | Value                                                                         |
|---------------------|-------------------------------------------------------------------------------|
| Test ID             | API-11                                                                        |
| HTTP Method         | PUT                                                                           |
| Endpoint            | /posts/1  (JSONPlaceholder)                                                   |
| Type                | Happy Path — Resource Update                                                  |
| Priority            | HIGH                                                                          |
| Result              | PASS                                                                          |

Test Steps:

| Step | Action                                                           | Assertion                                  |
|------|------------------------------------------------------------------|--------------------------------------------|
| 1    | PUT /posts/1 with updated title and body from testConfig.api.updatedLocation | HTTP status must be 200      |
| 2    | Validate the updated title                                       | title in response must reflect the new value |

Expected Result:  200 OK. Response body reflects the updated values.
Actual Result:    PASS. "Central Park New York - Updated" confirmed in response.

---

### API-12 — Update Non-Existent Resource — Known Defect: 500 Returned Instead of 404

| Field               | Value                                                                         |
|---------------------|-------------------------------------------------------------------------------|
| Test ID             | API-12                                                                        |
| HTTP Method         | PUT                                                                           |
| Endpoint            | /posts/99999  (JSONPlaceholder)                                               |
| Type                | Negative — Error Handling Defect                                              |
| Priority            | MEDIUM                                                                        |
| Result              | BUG - PASS                                                                    |
| Related Defect      | BUG-002 in BUG_REPORT.md                                                      |

Business Objective:
When a client requests an update to a resource that does not exist, the API must return 404 Not Found. Returning 500 instead means an unhandled server-side exception is being exposed to the API consumer.

Test Steps:

| Step | Action                                               | Assertion                                              |
|------|------------------------------------------------------|--------------------------------------------------------|
| 1    | PUT /posts/99999 with a valid JSON body              | Expected: 404 Not Found. Actual (defect): 500          |

Expected Result (correct behavior):  404 Not Found
Actual Result (confirmed defect):    500 Internal Server Error
Test Status:    BUG - PASS. The test asserts the known broken behavior (500) to document the defect and detect any regression. Full defect ticket in BUG-002.

---

### API-13 — Delete Existing Location Record (200 OK)

| Field               | Value                                                                         |
|---------------------|-------------------------------------------------------------------------------|
| Test ID             | API-13                                                                        |
| HTTP Method         | DELETE                                                                        |
| Endpoint            | /posts/1  (JSONPlaceholder)                                                   |
| Type                | Happy Path — Resource Deletion                                                |
| Priority            | HIGH                                                                          |
| Result              | PASS                                                                          |

Test Steps:

| Step | Action           | Assertion                     |
|------|------------------|-------------------------------|
| 1    | DELETE /posts/1  | HTTP status must be 200       |

Expected Result:  200 OK. Record deleted cleanly.
Actual Result:    PASS

---

### API-14 — Empty Search Query Returns Empty Array Gracefully (200 OK)

| Field               | Value                                                                         |
|---------------------|-------------------------------------------------------------------------------|
| Test ID             | API-14                                                                        |
| HTTP Method         | GET                                                                           |
| Endpoint            | /search?q=&format=json  (Nominatim OpenStreetMap)                             |
| Type                | Corner Case — Input Boundary                                                  |
| Priority            | MEDIUM                                                                        |
| Result              | PASS                                                                          |

Test Steps:

| Step | Action                                          | Assertion                                       |
|------|-------------------------------------------------|-------------------------------------------------|
| 1    | GET /search with empty q parameter              | HTTP status must be 200                         |
| 2    | Parse response                                  | Must return an empty JSON array, not a server error |

Expected Result:  200 OK with empty array []. Service does not crash on an empty query.
Actual Result:    PASS

---

### API-15 — Special Character Query Handled Without Server Error (200 OK)

| Field               | Value                                                                         |
|---------------------|-------------------------------------------------------------------------------|
| Test ID             | API-15                                                                        |
| HTTP Method         | GET                                                                           |
| Endpoint            | /search?q=!@#$%&format=json  (Nominatim OpenStreetMap)                        |
| Type                | Corner Case — Input Injection Boundary                                        |
| Priority            | MEDIUM                                                                        |
| Result              | PASS                                                                          |

Test Steps:

| Step | Action                                              | Assertion                                            |
|------|-----------------------------------------------------|------------------------------------------------------|
| 1    | GET /search with special character query string     | HTTP status must be 200                              |
| 2    | Parse response                                      | Must return empty array [], not a 400 or 500 error   |

Expected Result:  200 OK with empty array. Service handles special characters without crashing.
Actual Result:    PASS

---

### API-16 — Reverse Geocode Valid Coordinates to Address (200 OK)

| Field               | Value                                                                         |
|---------------------|-------------------------------------------------------------------------------|
| Test ID             | API-16                                                                        |
| HTTP Method         | GET                                                                           |
| Endpoint            | /reverse?lat=51.5074&lon=-0.1278&format=json  (Nominatim OpenStreetMap)      |
| Type                | Happy Path — Reverse Geocoding                                                |
| Priority            | HIGH                                                                          |
| Result              | PASS                                                                          |

Business Objective:
Reverse geocoding (converting coordinates to a human-readable address) is essential for any application that receives a device GPS location and needs to display a street address to the user.

Test Steps:

| Step | Action                                                    | Assertion                                    |
|------|-----------------------------------------------------------|----------------------------------------------|
| 1    | GET /reverse with valid London coordinates                | HTTP status must be 200                      |
| 2    | Parse response                                            | Must contain a display_name field with an address string |

Expected Result:  200 OK with a valid address for the supplied coordinates.
Actual Result:    PASS

---

### API-17 — Reverse Geocode Impossible Coordinates — Known Defect: 200 Returned Instead of 400

| Field               | Value                                                                         |
|---------------------|-------------------------------------------------------------------------------|
| Test ID             | API-17                                                                        |
| HTTP Method         | GET                                                                           |
| Endpoint            | /reverse?lat=999&lon=999&format=json  (Nominatim OpenStreetMap)               |
| Type                | Negative — Input Validation Defect                                            |
| Priority            | HIGH                                                                          |
| Result              | BUG - PASS                                                                    |
| Related Defect      | BUG-001 in BUG_REPORT.md                                                      |

Business Objective:
Latitude values must be within -90 to +90 and longitude within -180 to +180. A value of 999 for either coordinate is physically impossible. The API must reject this with 400 Bad Request rather than returning a success status with an error embedded in the payload.

Test Steps:

| Step | Action                                                  | Assertion                                             |
|------|---------------------------------------------------------|-------------------------------------------------------|
| 1    | GET /reverse?lat=999&lon=999&format=json                | Expected: 400 Bad Request. Actual (defect): 200 OK    |
| 2    | Parse response body                                     | Contains {"error":"Unable to geocode"} inside a 200 response — a REST anti-pattern |

Expected Result (correct behavior):  400 Bad Request
Actual Result (confirmed defect):    200 OK with error embedded in response body
Test Status:    BUG - PASS. The test asserts the 200 OK to document the defect. See BUG-001.

---

### API-18 — Protected Resource Accepted With Valid Basic Auth Credentials (200 OK)

| Field               | Value                                                                         |
|---------------------|-------------------------------------------------------------------------------|
| Test ID             | API-18                                                                        |
| HTTP Method         | GET                                                                           |
| Endpoint            | /basic-auth  (Postman Echo)                                                   |
| Type                | Security — Authentication Positive                                            |
| Priority            | CRITICAL                                                                      |
| Result              | PASS                                                                          |

Test Steps:

| Step | Action                                                     | Assertion               |
|------|------------------------------------------------------------|-------------------------|
| 1    | GET /basic-auth with correct credentials in Authorization  | HTTP status must be 200 |

Expected Result:  200 OK. Valid credentials are accepted.
Actual Result:    PASS

---

### API-19 — Protected Resource Rejected With Invalid Basic Auth Credentials (401 Unauthorized)

| Field               | Value                                                                         |
|---------------------|-------------------------------------------------------------------------------|
| Test ID             | API-19                                                                        |
| HTTP Method         | GET                                                                           |
| Endpoint            | /basic-auth  (Postman Echo)                                                   |
| Type                | Security — Authentication Negative                                            |
| Priority            | CRITICAL                                                                      |
| Result              | PASS                                                                          |

Test Steps:

| Step | Action                                                            | Assertion               |
|------|-------------------------------------------------------------------|-------------------------|
| 1    | GET /basic-auth with intentionally wrong credentials              | HTTP status must be 401 |

Expected Result:  401 Unauthorized. Wrong credentials are rejected.
Actual Result:    PASS

---

### API-20 — Non-Existent Resource Returns 404 Not Found

| Field               | Value                                                                         |
|---------------------|-------------------------------------------------------------------------------|
| Test ID             | API-20                                                                        |
| HTTP Method         | GET                                                                           |
| Endpoint            | /posts/999999  (JSONPlaceholder)                                              |
| Type                | Negative — Resource Not Found                                                 |
| Priority            | HIGH                                                                          |
| Result              | PASS                                                                          |

Test Steps:

| Step | Action                          | Assertion               |
|------|---------------------------------|-------------------------|
| 1    | GET /posts/999999               | HTTP status must be 404 |

Expected Result:  404 Not Found. Clean error response for a missing resource.
Actual Result:    PASS

---

### API-21 — Query Parameter Filter Returns Correctly Filtered Array (200 OK)

| Field               | Value                                                                         |
|---------------------|-------------------------------------------------------------------------------|
| Test ID             | API-21                                                                        |
| HTTP Method         | GET                                                                           |
| Endpoint            | /posts?userId=1  (JSONPlaceholder)                                            |
| Type                | Happy Path — Filtered Query                                                   |
| Priority            | HIGH                                                                          |
| Result              | PASS                                                                          |

Business Objective:
Query parameter filtering is essential for any API consumer that requires a subset of records. A broken filter forces clients to download the full dataset and filter locally, which is a significant performance and bandwidth problem.

Test Steps:

| Step | Action                      | Assertion                                              |
|------|-----------------------------|--------------------------------------------------------|
| 1    | GET /posts?userId=1         | HTTP status must be 200                                |
| 2    | Parse response array        | Every element in the array must have userId equal to 1 |

Expected Result:  200 OK with an array containing only records belonging to userId 1.
Actual Result:    PASS

---

### API-22 — Partial Update Modifies Only the Supplied Fields (200 OK)

| Field               | Value                                                                         |
|---------------------|-------------------------------------------------------------------------------|
| Test ID             | API-22                                                                        |
| HTTP Method         | PATCH                                                                         |
| Endpoint            | /posts/1  (JSONPlaceholder)                                                   |
| Type                | Happy Path — Partial Resource Update                                          |
| Priority            | HIGH                                                                          |
| Result              | PASS                                                                          |

Business Objective:
PATCH allows updating specific fields of a record without sending the entire resource representation. This is essential for bandwidth efficiency in mobile clients and microservice architectures where full-object replacement is too expensive.

Test Steps:

| Step | Action                                          | Assertion                                            |
|------|-------------------------------------------------|------------------------------------------------------|
| 1    | PATCH /posts/1 with only { "title": "..." }     | HTTP status must be 200                              |
| 2    | Validate the updated field                      | title in the response must reflect the new value     |

Expected Result:  200 OK. Only the title field is modified. All other fields remain unchanged.
Actual Result:    PASS

---

### API-23 — Create Request With Unknown Fields — Unknown Fields Ignored (201 Created)

| Field               | Value                                                                         |
|---------------------|-------------------------------------------------------------------------------|
| Test ID             | API-23                                                                        |
| HTTP Method         | POST                                                                          |
| Endpoint            | /posts  (JSONPlaceholder)                                                     |
| Type                | Corner Case — Input Robustness                                                |
| Priority            | MEDIUM                                                                        |
| Result              | PASS                                                                          |

Business Objective:
APIs must be tolerant of unknown fields in request bodies (Postel's Law: be liberal in what you accept). This ensures that clients do not break when new optional fields are introduced in one service before a dependent service is updated.

Test Steps:

| Step | Action                                                      | Assertion                                               |
|------|-------------------------------------------------------------|---------------------------------------------------------|
| 1    | POST /posts with payload including an extra unknownField    | HTTP status must be 201                                 |
| 2    | Validate response schema                                    | id, title, body, userId present. unknownField absent (correctly stripped) |

Expected Result:  201 Created. Record is created. The unknown field is silently ignored.
Actual Result:    PASS

---

## 5. Part 3 — Load Test Case

Technology:  Gatling TypeScript SDK — open-source HTTP load testing tool
Files:       load-tests/ecommerce.gatling.ts (simulation logic)
             load-tests/load-test.config.ts (profiles, SLA thresholds, URLs)
Environment: Same BASE_URL resolved from config/envConfig.ts as the functional test suites

---

### LOAD-01 — Homepage Under 1,000 Concurrent Users (Stress Profile)

| Field               | Value                                                                   |
|---------------------|-------------------------------------------------------------------------|
| Test ID             | LOAD-01                                                                 |
| Profile             | Stress (1,000 users / 15 seconds ramp)                                  |
| Injection Mode      | rampUsers(1000).during(15)                                              |
| Target              | Homepage (/)                                                            |
| SLA — Success Rate  | >= 95% of requests must return a successful HTTP response               |
| SLA — Response Time | Maximum response time must be below 2,000 ms                           |
| Priority            | CRITICAL                                                                |
| Result              | EXECUTED (SLA thresholds breached — see analysis below)                 |

Business Objective:
During flash sales, product launches, or viral social media events, e-commerce platforms regularly experience traffic spikes of 10x to 100x their normal baseline load. This stress test determines whether the server can maintain acceptable performance under that level of concurrency and whether the CI/CD pipeline correctly gates a deployment when SLA thresholds are breached.

Test Configuration:

| Parameter        | Value                                    |
|------------------|------------------------------------------|
| Target URL       | Homepage (/)                             |
| Virtual Users    | 1,000                                    |
| Ramp Duration    | 15 seconds                               |
| Pass Criteria    | >= 95% success rate AND < 2,000 ms max response time |
| CI/CD Gate       | Gatling simulation fails the pipeline if either threshold is breached |

Execution Results:

| Scenario                     | Avg Response Time | Success Rate | SLA Gate |
|------------------------------|-------------------|--------------|----------|
| Baseline (50 users)          | 578 ms            | 100%         | PASS     |
| Stress Test (1,000 users/15s)| 3,378 ms          | 54.8%        | FAIL     |

Root Cause Analysis:
Under baseline conditions the server responds in approximately 578 ms, which is within acceptable parameters. Under 1,000 simultaneous users, the average response time rose to 3,378 ms (approximately 6x degradation) and 452 out of 1,000 requests failed with HTTP 503 Service Unavailable. The server connection pool was exhausted and new incoming connections were actively rejected. The Gatling simulation correctly reported a pipeline failure because both SLA assertions — success rate >= 95% and response time < 2,000 ms — were breached simultaneously.

Response Time Reference Standards:

| Range              | User Experience                                          | Rating      |
|--------------------|----------------------------------------------------------|-------------|
| Under 100 ms       | Feels instant — ideal for API responses                  | Excellent   |
| Under 1,000 ms     | Seamless — acceptable for full HTML page loads           | Good        |
| 1,000 – 3,000 ms   | Noticeable delay — users are aware of waiting            | Acceptable  |
| Over 3,000 ms      | High abandonment rate — users leave before page loads    | Poor        |

Recommendation:
The application server requires horizontal scaling (a load balancer distributing requests across multiple application instances) and static asset caching via a CDN to handle production-level traffic spikes safely. The Gatling test correctly surfaces this infrastructure deficiency as a CI/CD pipeline failure, ensuring that an under-provisioned deployment cannot be promoted to production without remediation.
