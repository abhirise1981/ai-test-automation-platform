# 🚀 Enterprise AI-Powered Multi-Agent Test Automation Platform

[![Playwright Tests](https://github.com/abhirise1981/ai-test-automation-platform/actions/workflows/playwright.yml/badge.svg)](https://github.com/abhirise1981/ai-test-automation-platform/actions/workflows/playwright.yml)
[![Live Test Report](https://img.shields.io/badge/Report-Live%20Dashboard-brightgreen)](https://abhirise1981.github.io/ai-test-automation-platform/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-v1.49+-red.svg)](https://playwright.dev/)
[![Appium](https://img.shields.io/badge/Appium-WDIO-purple.svg)](https://appium.io/)
[![Gatling](https://img.shields.io/badge/Gatling-TypeScript%20SDK-orange.svg)](https://gatling.io/)
[![Axe-Core](https://img.shields.io/badge/Axe--Core-WCAG%202.1%20AA-teal.svg)](https://www.deque.com/axe/)
[![pgvector](https://img.shields.io/badge/pgvector-Embeddings-blueviolet.svg)](https://github.com/pgvector/pgvector)

A state-of-the-art, enterprise-grade test automation platform unifying **Web UI**, **Native Mobile (iOS/Android)**, **REST/GraphQL APIs**, **Stripe Billing & Webhook Cryptographic Security**, **High-Concurrency Load Testing**, **WCAG 2.1 AA Accessibility Compliance**, **Vector Database Embeddings & NL-to-SQL (RAG)**, and an **Autonomous Multi-Agent AI Layer** with self-healing locators.

👉 **[📊 View Live Interactive Test Dashboard](https://abhirise1981.github.io/ai-test-automation-platform/)**

---

## 🏛️ High-Level System Architecture

```mermaid
graph TB
    subgraph "1. JIRA AGENT"
        JA[Jira Client<br/>axios + jira.js] -->|Fetches User Story| JP[Story Parser<br/>Extracts AC, Priority, Type]
    end

    subgraph "2. PLANNER AGENT"
        JP -->|Story JSON| PA[Planner Agent]
        PA -->|Analyzes Story + ACs| BRD[BRD Generator<br/>Creates .md file]
    end

    subgraph "3. GENERATOR AGENT"
        BRD -->|BRD .md file| GA[Generator Agent]
        GA -->|Uses POM Templates| TS[Web Spec Generator<br/>Creates Playwright .spec.ts]
        GA -->|Mobile Stories| MS[Mobile Spec Generator<br/>Creates Appium .spec.ts]
    end

    subgraph "4. SELF-HEALING ENGINE"
        TS -->|Execution Failure| HA[Healer Agent]
        MS -->|Execution Failure| HA
        HA -->|DOM & AST Analysis| FIX[Auto-Fix Engine<br/>Locator Healing + Retries]
        FIX -->|Patches Scripts| TS
        FIX -->|Patches Scripts| MS
    end

    subgraph "5. MODEL CONTEXT PROTOCOL (MCP) SERVER"
        MCP[MCP Orchestrator<br/>Express + SSE] -->|Tool: run_tests| EX[Execution Engine]
        MCP -->|Tool: fetch_story| JA
        MCP -->|Tool: generate_brd| PA
        MCP -->|Tool: generate_tests| GA
        MCP -->|Tool: heal_tests| HA
        MCP -->|Tool: run_mobile| MOB[Mobile Executor]
    end

    subgraph "6. MULTI-PLATFORM TEST EXECUTION"
        EX --> LOCAL[Playwright Web E2E<br/>Chromium / WebKit / Firefox]
        EX --> API[REST & GraphQL API<br/>Nominatim, Countries API]
        EX --> STRIPE[Stripe Billing & Cryptography<br/>HMAC-SHA256 Webhook Engine]
        EX --> A11Y[Accessibility Engine<br/>Axe-Core WCAG 2.1 AA]
        MOB --> APPIUM[Appium & WebdriverIO<br/>iOS Simulator / Android Emulator]
        MOB --> BS[BrowserStack Cloud<br/>Real iOS & Android Devices]
    end

    subgraph "7. VECTOR DB & NL-to-SQL (RAG)"
        VDB[(Vector Store<br/>pgvector / Embeddings)] --> SIM[Cosine Similarity<br/>Schema Retrieval]
        SIM --> NL2SQL[NL-to-SQL Agent<br/>Natural Language → SQL]
        NL2SQL --> GUARD[SQL Safety Guardrails<br/>Injection Prevention]
    end

    subgraph "8. REPORTING & ANALYTICS"
        LOCAL --> RPT[Playwright HTML & Monocart Reports]
        API --> RPT
        STRIPE --> RPT
        A11Y --> RPT
        RPT --> GHPAGES[Live GitHub Pages Deployment]
    end
```

---

## 💎 Framework Modules & Key Capabilities

| Layer | Technologies | Highlights & Test Coverage |
| :--- | :--- | :--- |
| 🌐 **Web UI E2E** | Playwright, TypeScript, Page Object Model (POM) | Full customer journeys: 2-step Signup/Login, Product Discovery, Cart management, and Checkout order placement. Resilient against ad intercepts and dynamic modal animations. |
| 💳 **Stripe & Billing** | TypeScript, HMAC-SHA256, Form-URL-Encoded REST | End-to-end SaaS subscription lifecycle (Starter, Pro, Enterprise), PaymentIntents, partial/full refunds, webhook replay protection, and cryptographic signature validation. |
| 📱 **Native Mobile** | Appium, WebdriverIO, Screen Object Model (SOM) | Cross-platform automation on iOS Simulator and Android Emulator. Touch gestures, scrolls, and device orientation handling. |
| 📱 **Mobile-Web** | Playwright Device Descriptors | Mobile viewport emulation (iPhone 14, Pixel 7) testing responsive hamburger navigation and touch tap targets. |
| 🔌 **REST & GraphQL** | Playwright APIRequestContext, Service Object Model | Full CRUD assertions (GET, POST, PUT, PATCH, DELETE), Basic Auth security boundaries, reverse geocoding, and GraphQL query resolution. |
| ⚡ **Performance** | Gatling TypeScript SDK, P.S.I.A. Architecture | Concurrency load tests, token correlation, cookie header management, and response time SLA assertions. |
| ♿ **Accessibility (a11y)** | Axe-Core, WCAG 2.1 AA, Section 508 | Automated WCAG compliance auditing, keyboard navigation verification (Tab focus order), 4.5:1 color contrast enforcement, 48×48px touch target validation, and component-scoped modal scanning with third-party widget exclusion. |
| 🧠 **Vector DB & NL-to-SQL** | Embeddings, Cosine Similarity, pgvector, RAG | High-dimensional vector embeddings for semantic schema retrieval (Recall@K), NL-to-SQL query generation with SQL injection guardrails, and intelligent test deduplication via cosine similarity. |
| 🤖 **AI Self-Healing** | LangChain, LLM Cache, AST Repair | Autonomous test generation from Jira BRDs + self-healing locator engine that heals broken UI selectors at runtime via vector similarity matching. |

---

## 🚀 Quickstart & Execution Guide

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/abhirise1981/ai-test-automation-platform.git
cd ai-test-automation-platform

# Install dependencies
npm install

# Install Playwright browser binaries
npx playwright install --with-deps
```

### 2. Run Test Suites
```bash
# Run all automated tests (UI, REST, GraphQL, Stripe)
npm run test

# Run UI E2E tests only
npx playwright test tests/ui/

# Run Stripe Billing & Webhook tests only
npx playwright test tests/api/stripe.spec.ts

# Run REST & GraphQL API tests only
npx playwright test tests/api/location.spec.ts tests/api/graphql.spec.ts

# Run Mobile-Web responsive tests
npm run test:mobile-web
```

### 3. Native Mobile Automation (Appium)
```bash
# Start Appium Server
npm run appium:start

# Run Android Native Tests
npm run test:mobile:android

# Run iOS Native Tests
npm run test:mobile:ios
```

### 4. Gatling Performance & Load Testing
```bash
# Run Gatling TypeScript Load Tests
npx gatling run --typescript --sources-folder load-tests --simulation ecommerce
```

### 5. AI Multi-Agent Pipeline & MCP Server
```bash
# Run the autonomous Jira-to-Test agent pipeline
npx ts-node agents/pipeline.ts --issue PROJ-123

# Start the MCP Tool Server for AI assistants
npm run mcp:start
```

---

## ♿ Accessibility Testing (WCAG 2.1 AA)

The framework includes a purpose-built **A11yAuditor** engine (`utils/A11yAuditor.ts`) powered by **Axe-Core** for automated WCAG 2.1 AA compliance:

| Capability | WCAG Standard | Implementation |
| :--- | :--- | :--- |
| **Full Page Auditing** | WCAG 2.0/2.1 Level A & AA, Section 508 | Tag-based Axe-Core rulesets with severity gating |
| **Keyboard Navigation** | WCAG 2.1.1 & 2.4.7 | Sequential Tab focus order assertions |
| **Color Contrast** | WCAG 1.4.3 | ≥ 4.5:1 ratio enforcement for normal text |
| **Touch Target Size** | WCAG 2.5.5 / 2.5.8 | ≥ 48×48px bounding box validation |
| **Component Scoping** | — | Isolate modals/dialogs, exclude third-party ad widgets |
| **Severity Quality Gate** | — | CI build fails on `critical` or `serious` violations |

```bash
# Run Accessibility tests
npx playwright test tests/ui/accessibility.spec.ts
```

---

## 🧠 Vector Database, Embeddings & NL-to-SQL (RAG)

The platform includes a **Vector Store** (`agents/vector/VectorStore.ts`) and **NL-to-SQL Agent** (`agents/sql/NlToSqlAgent.ts`) for AI-powered schema retrieval and natural language query generation:

```mermaid
graph LR
    NL["Natural Language Assertion"] --> EMB["Embedding Vector"]
    EMB --> VDB[("Vector Store / pgvector")]
    VDB --> SIM["Cosine Similarity Search"]
    SIM --> RAG["Top-K Schema Retrieval (RAG)"]
    RAG --> SQL["Safe Parameterized SQL"]
    SQL --> GUARD["SQL Injection Guardrails"]
```

| Capability | What It Does |
| :--- | :--- |
| **Embedding Generation** | Converts text into high-dimensional normalized vectors using character n-gram frequency hashing |
| **Cosine Similarity Search** | k-NN semantic search for retrieving the most relevant schemas |
| **Schema RAG (Retrieval-Augmented Generation)** | Indexes table schemas into vector store; retrieves only relevant tables for SQL generation |
| **NL-to-SQL Translation** | Translates natural language requirements into verified SQL queries |
| **SQL Safety Guardrails** | Rejects destructive DDL/DML (`DROP`, `DELETE`, `TRUNCATE`, `ALTER`, `; --`) |
| **Test Deduplication** | Identifies semantically duplicate test cases via similarity thresholds |
| **Self-Healing Locators** | Matches broken CSS/XPath selectors to new DOM elements by semantic meaning |

```bash
# Run Vector DB & NL-to-SQL tests
npx playwright test tests/ai/nl-to-sql-vector.spec.ts
```

---

## 📊 Reports & CI/CD Pipelines

* **Dual CI/CD Integration**:
  * **GitHub Actions**: Automated regression on every push/PR with instant artifact publishing (Node.js 22 LTS, 4 parallel workers, `npm ci`).
  * **GitLab CI**: Fully configured `.gitlab-ci.yml` multi-stage pipeline (Build → Test → Performance).
* **Interactive Live Reporting**:
  * View real-time test execution graphs, metrics, and video traces at **[https://abhirise1981.github.io/ai-test-automation-platform/](https://abhirise1981.github.io/ai-test-automation-platform/)**.
* **Local Report Viewer**:
  ```bash
  npx playwright show-report
  # or Monocart Executive Dashboard:
  npx monocart show-report test-results/report.html
  ```

---

## 📄 License
Distributed under the MIT License. Developed for enterprise-grade test automation and architectural evaluations.
