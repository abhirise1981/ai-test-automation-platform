const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Abhishek Kumar - Principal AI QA Architect & Senior QE Leader</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 14mm 12mm 14mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      line-height: 1.4;
      font-size: 9.5pt;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    a {
      color: #0369a1;
      text-decoration: none;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    h1.name {
      font-size: 20pt;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
      margin: 0 0 3px 0;
      text-transform: uppercase;
    }
    .headline {
      font-size: 10.5pt;
      font-weight: 700;
      color: #0369a1;
      margin: 0 0 6px 0;
      line-height: 1.3;
    }
    .contact-bar {
      font-size: 8.5pt;
      color: #475569;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }
    .contact-item {
      display: inline-flex;
      align-items: center;
    }
    .availability-tag {
      background: #f0fdf4;
      color: #166534;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 4px;
      border: 1px solid #bbf7d0;
      font-size: 8pt;
    }
    h2.section-title {
      font-size: 10pt;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      border-bottom: 1.2px solid #cbd5e1;
      padding-bottom: 3px;
      margin: 12px 0 6px 0;
    }
    p.summary-text {
      margin: 0 0 6px 0;
      text-align: justify;
      color: #334155;
      font-size: 9.2pt;
    }
    .competency-group {
      margin-bottom: 4px;
      font-size: 9pt;
    }
    .competency-group strong {
      color: #0f172a;
    }
    .job-entry {
      margin-bottom: 10px;
      page-break-inside: avoid;
    }
    .job-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 3px;
    }
    .job-title-role {
      font-weight: 700;
      font-size: 9.8pt;
      color: #0f172a;
    }
    .job-company {
      color: #0369a1;
      font-weight: 600;
    }
    .job-meta {
      font-size: 8.5pt;
      color: #64748b;
      font-weight: 600;
      white-space: nowrap;
    }
    ul.bullet-list {
      margin: 3px 0 6px 0;
      padding-left: 16px;
    }
    ul.bullet-list li {
      margin-bottom: 3.5px;
      font-size: 9pt;
      color: #334155;
      text-align: justify;
    }
    ul.bullet-list li strong {
      color: #0f172a;
    }
    .cert-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 14px;
      font-size: 8.8pt;
    }
    .cert-item strong {
      color: #0f172a;
    }
    .repo-box {
      background: #f8fafc;
      border-left: 3px solid #0369a1;
      padding: 6px 10px;
      margin: 6px 0;
      font-size: 8.8pt;
      border-radius: 0 4px 4px 0;
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <h1 class="name">Abhishek Kumar</h1>
    <div class="headline">Principal AI QA Architect & Senior QE Leader | Multi-Agent AI Test Platforms & Enterprise Mobile/Web Automation</div>
    <div class="contact-bar">
      <span class="contact-item">📧 <a href="mailto:abhi.rise2@gmail.com">abhi.rise2@gmail.com</a></span>
      <span class="contact-item">📱 +91 7795820472</span>
      <span class="contact-item">📍 Bengaluru, India</span>
      <span class="contact-item">💻 <a href="https://github.com/abhirise1981/ai-test-automation-platform">github.com/abhirise1981</a></span>
      <span class="availability-tag">Notice: Immediate / 15–30 Days</span>
    </div>
  </div>

  <!-- EXECUTIVE PROFILE -->
  <h2 class="section-title">Executive Profile</h2>
  <p class="summary-text">
    <strong>17+ years of Senior QA Leadership and Enterprise Test Architecture</strong> delivering mission-critical quality engineering across Tier-1 FinTech (IG Group — 12 years on FCA/MiFID II-regulated trading platforms), Global Retail (7-Eleven GCC — CoE Architect across 4 geographies), and Frontier AI Quality Consulting (Scale AI). Architect of enterprise multi-agent AI test platforms integrating <strong>LangGraph StateGraph workflows, PostgreSQL pgvector, LangChain chunking, MCP (Model Context Protocol), Playwright, and LangSmith</strong> across web, API, and mobile ecosystems.
  </p>
  <p class="summary-text">
    <strong>GenAI Quality Engineering Authority:</strong> Deep hands-on expertise in RAG pipeline evaluation (document chunking boundaries, dense vector retrieval, <strong>Hit Rate @ 3</strong>, <strong>MRR</strong>), LLM evaluation frameworks (RAGAS, DeepEval), 22-criterion rubric engineering, and prompt-injection threat mitigation (OWASP Top 10 for LLMs). Proven architect of unified automation engines driving native iOS and Android apps via <strong>Appium 2.0 + WebdriverIO 9</strong>, alongside modern responsive web test suites via <strong>Playwright (TypeScript/Java)</strong> and Gatling performance engineering. Slashed test flakiness to &lt;1% and cut regression execution cycles by 85%.
  </p>

  <!-- CORE COMPETENCIES -->
  <h2 class="section-title">Core Competencies</h2>
  <div class="competency-group">
    <strong>GenAI & Agentic Quality Engineering:</strong> LangGraph (StateGraph Multi-Agent Workflows) • PostgreSQL / pgvector (HNSW & IVFFlat Indexing) • LangChain Chunking (RecursiveCharacterTextSplitter) • LLM Evaluation Rubrics • RAGAS • DeepEval • Semantic Search (&lt;=&gt; Cosine Distance) • Prompt Injection & Jailbreak Defense • Hallucination Gating • LangSmith Telemetry • MCP • SHA-256 Prompt Caching
  </div>
  <div class="competency-group">
    <strong>Core Automation Architecture:</strong> Playwright (TypeScript/Java) • Page Object Model (POM) • Selenium WebDriver 4 • REST API Automation (APIRequestContext) • GraphQL Testing • Gatling (TypeScript/Scala Load Testing) • JMeter • REST Assured • Cypress • Cucumber BDD
  </div>
  <div class="competency-group">
    <strong>Mobile End-to-End Testing:</strong> Appium 2.0 • WebdriverIO 9 • Android (UiAutomator2) • iOS (XCUITest) • Playwright Mobile Emulation • BrowserStack Real-Device Cloud • AWS Device Farm • Deep Linking • Push Notifications • Hybrid App / Webview Testing
  </div>
  <div class="competency-group">
    <strong>Security, Accessibility & Compliance:</strong> OWASP API & LLM Top 10 • Row-Level Security (RLS) • OAuth 2.0 / RBAC • WCAG 2.2 AA Accessibility (@axe-core/playwright) • PII Boundary Enforcement • FCA / MiFID II Compliance • PCI-DSS Payment Tokenization
  </div>
  <div class="competency-group">
    <strong>QE Leadership & DevOps:</strong> QA CoE Build (0 to 15+ headcount) • Enterprise QE Strategy • Shift-Left & Dual-Speed CI/CD Quality Gates • GitLab CI • GitHub Actions • Jenkins • Docker • AWS • Executive CXO Reporting
  </div>

  <!-- PROFESSIONAL EXPERIENCE -->
  <h2 class="section-title">Professional Experience</h2>

  <!-- Scale AI -->
  <div class="job-entry">
    <div class="job-header">
      <div>
        <span class="job-title-role">AI Quality Engineering Consultant</span>
        <span class="job-company">| Scale AI</span> (Independent Advisory)
      </div>
      <span class="job-meta">Remote • Apr 2026 – Present</span>
    </div>
    <ul class="bullet-list">
      <li><strong>Frontier Model Evaluation:</strong> Engaged as an independent AI Quality specialist evaluating 4 frontier LLM checkpoints (Claude Opus, GPT-5, Gemini Pro) across multi-turn reasoning, agentic tool invocation, and instruction-following fidelity.</li>
      <li><strong>Rubric Engineering:</strong> Designed 22-criterion binary weighted rubrics (+5/-5 scoring) rigorously evaluating task groundedness, factual accuracy, hallucination boundaries, and privacy violation prevention.</li>
      <li><strong>Adversarial & Guardrail Testing:</strong> Systematically engineered prompt-injection, jailbreak, and role-override test suites to validate safety boundaries and guardrail enforcement against adversarial inputs.</li>
      <li><strong>Vector Semantic Optimization:</strong> Implemented semantic similarity clustering using <strong>PostgreSQL pgvector</strong> (&lt;=&gt; cosine distance) to detect redundant prompt patterns across evaluation batches, accelerating review velocity.</li>
      <li><strong>Top-Tier Performance Rating:</strong> Consistently maintained an exceptional <strong>5.0/5.0 quality rating</strong> across model evaluation accuracy, instruction adherence, and reliability assessments.</li>
    </ul>
  </div>

  <!-- 7-Eleven -->
  <div class="job-entry">
    <div class="job-header">
      <div>
        <span class="job-title-role">Lead Engineer – QA | CoE Architect</span>
        <span class="job-company">| 7-Eleven Global Solution Center (GCC)</span>
      </div>
      <span class="job-meta">Bengaluru, India • Dec 2022 – Feb 2026</span>
    </div>
    <ul class="bullet-list">
      <li><strong>Built Enterprise QA CoE from Scratch:</strong> Scaled and mentored a high-performing 15+ engineer Global QA CoE across 4 geographies (North America, Europe, APAC); owned hiring, quality transformation roadmaps, CI/CD quality gates, and CXO release dashboards.</li>
      <li><strong>Quality Engineering for "7Bot" (GenAI RAG Product):</strong>
        Architected automated testing for 7-Eleven's customer-facing conversational RAG assistant (<strong>7Bot</strong>).
        Automated document chunking validation for store policy PDFs using <strong>LangChain’s RecursiveCharacterTextSplitter</strong> with 15% overlap constraints.
        Benchmarked <strong>PostgreSQL pgvector</strong> retrieval performance across 128-d dense embeddings, asserting <strong>Hit Rate @ 3 ≥ 75%</strong> and <strong>MRR ≥ 0.65</strong> using native &lt;=&gt; cosine distance on HNSW indexes.
        Validated <strong>LangGraph StateGraph workflows</strong> to guarantee deterministic prompt-injection interception at the guardrail layer and graceful fallback routing for out-of-domain queries to prevent hallucinations.
      </li>
      <li><strong>Enterprise Mobile Automation (7Now App):</strong>
        Architected end-to-end mobile automation using <strong>Appium 2.0 + WebdriverIO 9</strong> across Android (UiAutomator2) and iOS (XCUITest), covering cart, payment, dynamic promotions, and order tracking on 20+ real devices via BrowserStack.
        Automated location-aware mobile scenarios validating GPS-driven store selection and inventory availability.
      </li>
      <li><strong>Architected Self-Healing Automation (The Healer Agent):</strong>
        Engineered an AI-assisted diagnostic locator engine: on UI test failure, it chunks massive 50,000-line DOM snapshots using <strong>LangChain</strong>, retrieves historical locator patterns from <strong>pgvector</strong>, and runs a <strong>LangGraph sandbox loop</strong> to propose verified PR diffs for human review—slashing test maintenance by 40% and cutting flakiness to &lt;1%.
      </li>
      <li><strong>Full-Pyramid Quality & Performance:</strong>
        Automated Store Operations Scorecards and BI Analytics dashboards against underlying REST APIs and SQL databases with 100% data fidelity.
        Engineered automated Gatling load tests simulating 1,000-user spikes (15s ramp) to enforce CI/CD performance gates (&lt;2s response threshold).
        Enforced WCAG 2.2 AA accessibility gates using @axe-core/playwright across all digital checkout flows.
        Optimized GitHub Actions pipelines with cached dependency layers, cutting regression run times from <strong>45 minutes to 6 minutes (85% reduction)</strong>.
      </li>
    </ul>
  </div>

  <!-- IG Group -->
  <div class="job-entry">
    <div class="job-header">
      <div>
        <span class="job-title-role">QA Automation Developer | Automation QA Lead</span>
        <span class="job-company">| IG InfoTech India (IG Group)</span>
      </div>
      <span class="job-meta">Bengaluru, India • Sep 2010 – Dec 2022 • 12 Years</span>
    </div>
    <ul class="bullet-list">
      <li><strong>Owned Trading Platform Quality (FCA-Regulated):</strong> Led UI and API automation for multi-currency equities, FX, and financial derivatives platforms, validating TCF (Treating Customers Fairly), MiFID II surveillance, and immutable audit trails.</li>
      <li><strong>Mobile Trading App Automation:</strong> Delivered native iOS & Android trading app test automation (Appium, XCUITest, Espresso) achieving 85%+ automated coverage across critical execution and position-management journeys.</li>
      <li><strong>High-Throughput Financial API Automation:</strong> Engineered resilient API automation suites covering payment gateways, OAuth 2.0 authentication, and financial transaction settlement.</li>
      <li><strong>Global Release Coordination:</strong> Orchestrated continuous performance (Gatling/JMeter) and accessibility testing across London, Krakow, and Bengaluru with zero SLA breaches across 12 years.</li>
    </ul>
  </div>

  <!-- Earlier Career -->
  <div class="job-entry">
    <div class="job-header">
      <div>
        <span class="job-title-role">Programmer Analyst</span>
        <span class="job-company">| Infosys</span>
      </div>
      <span class="job-meta">Bengaluru, India • May 2009 – Aug 2010</span>
    </div>
    <ul class="bullet-list">
      <li>Contributed to enterprise eCommerce platform modernization, automating ATG-based transactional workflows.</li>
    </ul>
  </div>

  <div class="job-entry">
    <div class="job-header">
      <div>
        <span class="job-title-role">Associate Technology L2</span>
        <span class="job-company">| Sapient Corporation</span>
      </div>
      <span class="job-meta">Bengaluru, India • Nov 2007 – Jan 2009</span>
    </div>
    <ul class="bullet-list">
      <li>Validated UI and backend transaction engines for scalable telecom eCommerce portals.</li>
    </ul>
  </div>

  <!-- KEY REPOSITORY SHOWCASE -->
  <h2 class="section-title">Key Repository Showcase</h2>
  <div class="repo-box">
    <strong>Enterprise Multi-Agent AI Test Platform:</strong> <a href="https://github.com/abhirise1981/ai-test-automation-platform">github.com/abhirise1981/ai-test-automation-platform</a><br>
    Demonstrates a 5-stage multi-agent pipeline (Planner → Generator → Healer) built with Playwright, Appium 2.0, LangGraph, and PostgreSQL pgvector. Includes 35 automated specs testing chunking boundaries, pgvector cosine search (&lt;=&gt;), and LangGraph state machine routing.
  </div>

  <!-- CERTIFICATIONS -->
  <h2 class="section-title">Certifications & Professional Development</h2>
  <div class="cert-grid">
    <div class="cert-item"><strong>Lean Six Sigma Black Belt</strong> — GAQM (Lic: G1023899)</div>
    <div class="cert-item"><strong>ISTQB Certified Tester AI (CT-AI)</strong> — BCS/ISEB (Lic: sr9094246)</div>
    <div class="cert-item"><strong>PSM I – Professional Scrum Master</strong> — Scrum.org (Lic: 1028609)</div>
    <div class="cert-item"><strong>Oracle Certified Professional Java SE 8</strong> — Oracle (Lic: OC1685736)</div>
    <div class="cert-item"><strong>Executive IT Leadership & Quality Mgmt</strong> — XIME Bangalore</div>
    <div class="cert-item"><strong>AI Tools Mastery Workshop</strong> — Be10x</div>
  </div>

  <!-- EDUCATION -->
  <h2 class="section-title">Education</h2>
  <div style="display: flex; justify-content: space-between; font-size: 9pt;">
    <span><strong>B.E. in Computer Science</strong> — Visvesvaraya Technological University (VTU), Belgaum</span>
    <span style="color: #64748b; font-weight: 600;">Karnataka, India</span>
  </div>

</body>
</html>`;

async function generatePdf() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'load' });
  
  const outputPath = path.resolve(__dirname, '..', 'Abhishek_Kumar_Principal_AI_QA_Architect.pdf');
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '12mm',
      bottom: '12mm',
      left: '14mm',
      right: '14mm',
    },
  });
  
  await browser.close();
  console.log('PDF generated at:', outputPath);
}

generatePdf().catch(err => {
  console.error(err);
  process.exit(1);
});
