# Toptal SDET Test Automation Project

This repository contains a comprehensive test automation suite built for a screening assessment. It demonstrates UI Automation, REST API testing, and Load Testing using modern industry best practices.

---

## Technical Stack & Tools
- **UI Automation**: Playwright + TypeScript + Page Object Model (POM)
- **API Automation**: Playwright APIRequestContext
- **Load Testing**: Gatling (TypeScript SDK)
- **Reporting**: Monocart Reporter & Native Gatling HTML Reports
- **CI/CD**: GitLab CI

---

## Project Structure
```text
toptal-project-assessment/
├── .gitlab-ci.yml           # GitLab CI/CD pipeline configuration
├── docs/
│   └── test_cases.md        # Full test cases in plain English (for all audiences)
├── BUG_REPORT.md            # Formal Jira-style bug tickets from testing
├── LOAD_TEST_REPORT.md      # Detailed analysis of Gatling load test results
├── config/
│   └── testConfig.ts        # Single source of truth for ALL environment config
│                            # (UI baseURL, API endpoints, test data — all env-driven)
├── api/                     # API Object Model (Service Client Layer)
│   └── LocationApiClient.ts # Encapsulates all HTTP calls — tests never call request.get() directly
├── pages/                   # UI Page Object Models (POM)
│   ├── BasePage.ts          # Shared navigateTo(), getPageTitle() methods
│   ├── HomePage.ts          # Products navigation, search, add-to-cart
│   ├── LoginPage.ts         # User signup, registration form, login
│   ├── CartPage.ts          # Cart item count and name validation
│   └── CheckoutPage.ts      # Order comment, payment details, order confirmation
├── tests/                   # Playwright Test Specs (assertions only, no raw HTTP/locator calls)
│   ├── api/
│   │   └── location.spec.ts # 7 REST API tests (GET 200, GET 404, GET 401, POST 201, PUT 200, DELETE 200, PUT 500)
│   └── ui/
│       └── ecommerce.spec.ts# 6 UI tests (Registration, Negative Login, 3x Search, Checkout)
├── load-tests/
│   └── ecommerce.gatling.ts # Gatling load test — 1000 users / 15 seconds
├── package.json             # Project dependencies
├── playwright.config.ts     # Playwright config — baseURL sourced from testConfig
└── tsconfig.json            # TypeScript compiler configuration
```

---

## Setup & Installation

### Prerequisites
- Node.js (version 18 or higher)

### Install Dependencies
Run the following commands in the project root folder to install all Node modules and Playwright browsers:
```bash
npm ci
npx playwright install
```

---

## Execution Guide

### 1. Run UI & API Automation Tests
To run all e-commerce flows (User Registration, Product Search, Cart Verification, Payment & Checkout) and REST API tests:
```bash
npx playwright test
```

After execution, view the beautiful Monocart rich HTML report (which includes traces and video recordings on failure):
```bash
npx monocart show-report test-results/report.html
```

---

### 2. Run Load Tests
To execute the Gatling load test plan simulating a DDoS event of 1,000 users ramping up in 15 seconds against the target server:
```bash
npx gatling run --typescript --sources-folder load-tests
```
*(Note: As documented in `LOAD_TEST_REPORT.md`, this test is expected to yield a non-zero exit code because the server will crash under load, intentionally breaching the CI/CD SLA assertions).*

After execution, the Gatling HTML report will be generated. The exact path to open it will be printed at the bottom of the terminal output (e.g. `open target/gatling/.../index.html`).

---

## Test Scenario Documentation
- For a detailed breakdown of test cases, refer to `docs/test_cases.md`.
- For details on bugs found during development, refer to `BUG_REPORT.md`.
- For the theoretical analysis of the performance test, refer to `LOAD_TEST_REPORT.md`.
