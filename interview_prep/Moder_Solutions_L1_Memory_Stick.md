# 🏢 Moder Solutions — Test Architect L1 Interview Memory Stick

**Focus Areas:** Functional Testing (50%) | API Testing (25%) | DB Testing (25%)  
**Shift:** 3 PM – 12 AM IST | **Location:** Bangalore/Chennai | **Domain:** US Mortgage

---

## 🧪 PART 1: FUNCTIONAL TESTING (50% of Interview)

---

### Q1: "What is your Test Strategy approach?"
👉 **Risk-Based Testing** — Prioritize test cases by **Business Impact × Likelihood of Failure**. High-risk flows (e.g., Loan Origination, Payment Processing) get exhaustive coverage; low-risk flows get smoke coverage.

### Q2: "How do you define Test Architecture for a large enterprise app?"
👉 **Testing Pyramid:** Unit (70%) → API/Integration (20%) → UI/E2E (10%). I define which layer owns which validation to avoid duplication and maximize speed.

### Q3: "What test types do you cover end-to-end?"
👉 **6 Types:** Functional → Integration → System → Regression → UAT → Production Validation (Smoke in Prod post-deploy).

### Q4: "How do you do Test Planning?"
👉 **4 Artifacts:** Test Strategy Doc → Test Plan (scope, entry/exit criteria, environments) → Test Scenarios (high-level) → Test Cases (step-level with expected results).

### Q5: "Entry & Exit Criteria?"
* **Entry:** Requirements signed off, Test environment ready, Test data seeded, Build deployed.
* **Exit:** 100% critical TCs executed, 0 P1/P2 open defects, Defect Escape Rate < 2%, Sign-off from Business.

### Q6: "How do you handle Requirement Gaps?"
👉 **Requirement Traceability Matrix (RTM)** — Map every requirement to test cases. If a requirement has 0 test cases mapped, it is flagged as a **coverage gap** in the review.

### Q7: "Explain Regression Testing strategy?"
👉 **Impact-Based Regression** — Don't re-run all 5,000 TCs. Analyze the code change, identify impacted modules via RTM, and run only the **impacted subset + critical path smoke suite**.

### Q8: "How do you handle Flaky Tests?"
👉 **3-Strike Rule:** If a test fails intermittently 3 times in 30 days, it is quarantined, root-caused (timing/data/environment), and fixed before re-entry into the regression suite.

### Q9: "What Quality Metrics do you track?"
* **DER** (Defect Escape Rate) = Prod Defects / Total Defects Found → Target: < 2%
* **Defect Density** = Defects / KLOC (1000 Lines of Code)
* **Test Coverage %** = TCs Executed / Total TCs Planned
* **Defect Removal Efficiency (DRE)** = Defects Found in Testing / Total Defects → Target: > 95%

### Q10: "UAT — What is your role as Test Architect?"
👉 I **don't execute UAT**. I define the UAT Test Plan, prepare sanitized test data, set up the UAT environment, train Business Users, and provide the **Go/No-Go sign-off checklist**.

### Q11: "Boundary Value Analysis vs Equivalence Partitioning?"
* **BVA:** Test at edges → e.g., Age field accepts 18–65: Test **17, 18, 65, 66**.
* **EP:** Divide inputs into valid/invalid groups → Test **one value from each partition** (e.g., 25 for valid, 10 for invalid).

### Q12: "How do you do Release Quality Sign-Off?"
👉 **4-Gate Model:**
1. ✅ Code Review Gate (PR approved)
2. ✅ Automated Regression Gate (100% pass)
3. ✅ UAT Sign-Off Gate (Business approved)
4. ✅ Production Smoke Gate (Post-deploy health check)

---

## 🔌 PART 2: API TESTING (25% of Interview)

---

### Q13: "How do you approach API Testing?"
👉 **4 Layers:** Contract Validation (Swagger/OpenAPI schema) → Functional (CRUD operations) → Negative (400/401/404/500 error codes) → Integration (end-to-end chain of APIs).

### Q14: "What do you validate in an API response?"
👉 **5 Checks (SHBDT):**
* **S**tatus Code (200, 201, 400, 401, 404, 500)
* **H**eaders (Content-Type, Authorization)
* **B**ody (JSON field values, data types, null checks)
* **D**ata Integrity (Does DB match API response?)
* **T**ime (Response time < SLA threshold, e.g., < 500ms)

### Q15: "REST vs SOAP?"
* **REST:** Lightweight, JSON, stateless, uses HTTP methods (GET/POST/PUT/DELETE).
* **SOAP:** Heavyweight, XML, has WSDL contract, used in legacy banking/mortgage systems.

### Q16: "HTTP Methods — GET vs POST vs PUT vs PATCH vs DELETE?"
* **GET** → Read (Idempotent)
* **POST** → Create (Non-idempotent)
* **PUT** → Full Update (Replace entire resource)
* **PATCH** → Partial Update (Update specific fields only)
* **DELETE** → Remove

### Q17: "How do you test API Authentication & Authorization?"
* **Authentication (401):** Send request with expired/missing/invalid token → Expect HTTP **401 Unauthorized**.
* **Authorization (403):** Send request with valid token but insufficient role → Expect HTTP **403 Forbidden**.

### Q18: "What is Idempotency and why does it matter?"
👉 Calling the same API multiple times produces the **same result**. GET, PUT, DELETE are idempotent. POST is NOT (creates duplicate records if called twice).

### Q19: "How do you test API Chaining / Integration?"
👉 **Response-to-Request Chaining:**
1. `POST /api/loan` → Returns `loanId: 12345`
2. `GET /api/loan/12345` → Verify loan details match
3. `PUT /api/loan/12345` → Update loan status
4. `DELETE /api/loan/12345` → Verify 404 on re-fetch

### Q20: "How do you mock third-party APIs?"
👉 **WireMock or Playwright `page.route()`** — Intercept outbound API calls and return stubbed responses (e.g., simulate Credit Bureau timeout with `{ status: 504 }`).

### Q21: "Postman vs Playwright API Testing?"
* **Postman:** Quick manual exploration, collection sharing, environment variables.
* **Playwright `request` fixture:** Programmatic, runs in CI/CD, assertions in TypeScript, integrated with UI tests in the same suite.

### Q22: "What is Contract Testing?"
👉 Validating that the API response **strictly matches the Swagger/OpenAPI schema** (correct field names, data types, required fields). Tools: **Pact, Swagger Validator, Ajv JSON Schema**.

---

## 🗄️ PART 3: DATABASE / SQL TESTING (25% of Interview)

---

### Q23: "What do you validate in DB Testing?"
👉 **5 Checks (DIMCR):**
* **D**ata Integrity (FK constraints, no orphan records)
* **I**nsert/Update/Delete accuracy (CRUD reflected correctly)
* **M**apping (UI field → API payload → DB column match)
* **C**alculations (Financial math: Amortization, Interest, Escrow)
* **R**eporting (Aggregated views/stored procs return correct totals)

### Q24: "Write SQL to find duplicate loan records?"
```sql
SELECT loan_number, COUNT(*) AS cnt
FROM loans
GROUP BY loan_number
HAVING COUNT(*) > 1;
```

### Q25: "Write SQL to find orphan records (no parent)?"
```sql
SELECT p.payment_id
FROM payments p
LEFT JOIN loans l ON p.loan_id = l.loan_id
WHERE l.loan_id IS NULL;
```

### Q26: "JOIN Types — Quick Memory Stick?"
* **INNER JOIN** → Only matching rows from both tables.
* **LEFT JOIN** → All rows from LEFT + matching from RIGHT (NULLs for no match).
* **RIGHT JOIN** → All rows from RIGHT + matching from LEFT.
* **FULL OUTER JOIN** → All rows from BOTH (NULLs where no match).

### Q27: "How do you validate a financial calculation in DB?"
👉 **Dual-Source Assertion:** Calculate expected value in your test script (e.g., Monthly EMI formula) and compare it against the actual DB column value. Tolerance: ± $0.01.

```sql
-- Verify monthly payment calculation
SELECT loan_id, monthly_payment,
       ROUND((loan_amount * (rate/12) * POWER(1+rate/12, term)) /
             (POWER(1+rate/12, term) - 1), 2) AS expected_emi
FROM loans
WHERE loan_id = 12345;
```

### Q28: "Stored Procedure Testing?"
👉 Call the SP with known inputs → Assert output matches expected values → Verify DB state changed correctly after SP execution.

```sql
EXEC sp_calculate_escrow @loan_id = 12345;
-- Then verify:
SELECT escrow_balance FROM escrow_ledger WHERE loan_id = 12345;
```

### Q29: "How do you test Data Migration?"
👉 **3-Step Validation:**
1. **Row Count Match:** Source table count = Target table count.
2. **Column Mapping:** Every source column maps to correct target column.
3. **Data Integrity:** Checksum/hash comparison on critical columns (e.g., `SUM(balance)` matches).

### Q30: "Index & Query Performance?"
👉 Use **`EXPLAIN ANALYZE`** (PostgreSQL) or **`EXPLAIN PLAN`** (Oracle) to check if queries use indexes or do full table scans. A missing index on a FK column is the #1 cause of slow queries.

### Q31: "ACID Properties?"
* **A**tomicity → All or nothing (transaction fully commits or fully rolls back).
* **C**onsistency → DB moves from one valid state to another.
* **I**solation → Concurrent transactions don't interfere with each other.
* **D**urability → Once committed, data survives even a server crash.

### Q32: "How do you handle Test Data in DB Testing?"
👉 **API Seeding (not direct SQL INSERT)** — Create test data via API calls (`POST /api/loan`) so that all business rules, validations, and audit logs are triggered correctly. Direct SQL inserts skip business logic and create invalid states.

---

## 🎯 RAPID-FIRE KEYWORDS (Last 5 Min Revision)

| Topic | Keywords to Drop |
| :--- | :--- |
| **Test Strategy** | Risk-Based, Testing Pyramid, RTM, Entry/Exit Criteria |
| **Functional** | BVA, EP, Decision Table, State Transition, Exploratory |
| **API** | REST, CRUD, Status Codes, Idempotent, Contract Testing, Swagger |
| **DB** | JOINs, GROUP BY + HAVING, ACID, EXPLAIN ANALYZE, Orphan Records |
| **Quality Metrics** | DER < 2%, DRE > 95%, Defect Density, Test Coverage % |
| **Governance** | 4-Gate Release, Go/No-Go, Production Smoke, UAT Sign-Off |
| **Security** | PII Masking, RBAC (401/403), TLS 1.3, GLBA Compliance |
| **Accessibility** | WCAG 2.1 AA, 4.5:1 Contrast, 48×48px Touch Targets, aria-label |
