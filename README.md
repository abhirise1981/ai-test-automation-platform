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
├── docs/                    # Test documentation & bug reports
│   └── test_cases.md        # Plain English test scenarios
├── BUG_REPORT.md            # Formal bug ticket report
├── LOAD_TEST_REPORT.md      # Detailed analysis of Gatling load test
├── load-tests/              # Gatling Load tests
│   └── ecommerce.gatling.ts # Gatling TS Load Test Plan (1000 users / 15s)
├── pages/                   # Page Object Models (POM)
│   ├── BasePage.ts          # Common actions & page transitions
│   ├── HomePage.ts          # Home & product search interactions
│   ├── LoginPage.ts         # User signup & authentication
│   ├── CartPage.ts          # Cart validation
│   └── CheckoutPage.ts      # Checkout comments and payment details
├── tests/                   # Playwright Test Specs
│   ├── api/
│   │   └── location.spec.ts # REST API tests (GET, POST, PUT, DELETE)
│   └── ui/
│       └── ecommerce.spec.ts# UI flow tests (Registration, Search, Checkout)
├── package.json             # Project dependencies
├── playwright.config.ts     # Playwright configuration
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
