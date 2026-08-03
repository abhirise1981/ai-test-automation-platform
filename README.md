# AI-Powered Multi-Agent Test Automation Framework

Transform the existing Playwright framework into an enterprise-grade, AI-driven multi-agent system that automatically reads Jira stories, generates BRDs, creates test scripts (Web, Mobile & GraphQL), self-heals broken tests, optimizes LLM tokens via **Distributed Redis Caching**, monitors agent telemetry via **LangSmith**, and executes on local & cloud — all orchestrated through an **MCP server**.

---

## High-Level Architecture

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
        GA -->|Uses POM Templates| TS[Test Script Generator<br/>Creates .spec.ts files]
        GA -->|Mobile Stories| MS[Mobile Test Generator<br/>Creates Appium .spec.ts]
    end

    subgraph "4. HEALER AGENT"
        TS -->|Test Execution| HA[Healer Agent]
        MS -->|Test Execution| HA
        HA -->|Analyzes Failures| FIX[Auto-Fix Engine<br/>Locator Healing + Retry Logic]
        FIX -->|Patched Scripts| TS
        FIX -->|Patched Scripts| MS
    end

    subgraph "5. MCP SERVER"
        MCP[MCP Orchestrator<br/>Express + SSE] -->|Tool: run_tests| EX[Execution Engine]
        MCP -->|Tool: fetch_story| JA
        MCP -->|Tool: generate_brd| PA
        MCP -->|Tool: generate_tests| GA
        MCP -->|Tool: heal_tests| HA
        MCP -->|Tool: run_mobile| MOB[Mobile Executor]
    end

    subgraph "6. EXECUTION LAYER — WEB"
        EX -->|Local| LOCAL[Playwright Local<br/>Chromium/Firefox/WebKit]
        EX -->|Cloud| BS[BrowserStack Automate<br/>Cross-Browser Desktop]
    end

    subgraph "7. EXECUTION LAYER — MOBILE"
        MOB -->|Emulated| EMU[Playwright Mobile Emulation<br/>iPhone, Pixel, Galaxy]
        MOB -->|Native/Hybrid| APPIUM[Appium Server<br/>Android + iOS]
        APPIUM -->|Cloud| BSAPP[BrowserStack App Automate<br/>Real Devices]
        APPIUM -->|Cloud| AWSDF[AWS Device Farm<br/>Real Device Grid]
    end

    subgraph "8. REPORTING"
        LOCAL --> RPT[Monocart Reporter]
        BS --> RPT
        EMU --> RPT
        APPIUM --> RPT
        RPT --> JIRA_UPDATE[Jira Ticket Update<br/>Pass/Fail + Attachments]
    end
```

---

## Technical Stack & Tools
- **UI Automation**: Playwright + TypeScript + Page Object Model (POM)
- **Mobile Native Automation**: WebdriverIO + Appium + Screen Object Model (SOM)
- **API Automation**: Playwright APIRequestContext
- **AI Agents**: OpenAI GPT-4o / Google Gemini via MCP
- **Orchestration**: Model Context Protocol (MCP) Server
- **Load Testing**: Gatling (TypeScript SDK)
- **Cloud Execution**: BrowserStack (Web/App Automate) & AWS Device Farm
- **Reporting**: Monocart Reporter & Healing Reports

---

## Execution Guide

### 1. Run Pipeline Orhestrator (End-to-End)
Runs the complete flow: Jira → Planner → Generator → Execute → Heal
```bash
npx ts-node agents/pipeline.ts --issue PROJ-123
```
Add `--dry-run` to see what would happen without actually executing tests.

### 2. Start the MCP Server
Allows any MCP-compatible AI client to orchestrate the pipeline via tools.
```bash
npm run mcp:start
```

### 3. Run Web Tests (Playwright)
```bash
npm run test                   # Local Chromium
npm run test:mobile-web        # Playwright mobile emulation
npm run test:browserstack      # BrowserStack cross-browser
```

### 4. Run Mobile Native Tests (Appium)
```bash
npm run appium:start           # Start Appium server first
npm run test:mobile:android    # Local Android emulator
npm run test:mobile:ios        # Local iOS simulator
npm run test:mobile:browserstack # BrowserStack App Automate
```

---

## Configuration & Secrets
Copy `.env.example` to `.env` and fill in your values for Jira, OpenAI/Gemini, BrowserStack, and AWS.

> **Note:** Do NOT commit your `.env` file!

---

## Old Setup Notes

- **UI Automation**: Playwright tests are in `tests/ui/`
- **API Automation**: Playwright API tests are in `tests/api/`
- **Load Testing**: Gatling load tests are in `load-tests/`
- **Legacy Run**: `npx playwright test` still works!
