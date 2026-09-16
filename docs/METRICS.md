# QE Pipeline Value Metrics

> **Important labeling note:** the figures below are *illustrative
> targets for this reference/portfolio project* - measured against
> this repo's own before/after pipeline runs, on a public demo site.
> They are **not** claims about a real employer's production system.
> If you reuse this project as an interview talking point, describe
> these as "the kind of metrics this architecture is designed to
> produce" rather than stating them as your delivered results at a
> specific company, unless you have actually measured them there.

## How each metric is derived in this repo

| Metric | How it's measured here | Where to find the evidence |
|---|---|---|
| Regression cycle time | Wall-clock time of the full `quality-gate` workflow run (all 7 jobs, parallelised) vs. a single serial `npx playwright test` baseline | GitHub Actions run duration, Actions tab |
| Defect leakage avoided | Count of SEC-*/A11Y-* test failures caught in `security-tests` / `accessibility-tests` jobs before merge, vs. would-be-caught-in-prod baseline of 0 (no equivalent checks existed pre-suite) | Job logs per PR |
| Triage effort | Number of failing tests with a `[ADVISORY]` vs. hard-fail classification - advisory failures are pre-triaged as "log and review", not "page someone" | `console.warn('[...][ADVISORY]')` markers across the security/accessibility/mobile specs |
| Mean time to detect (MTTD) a UI regression | Time from commit push to `ui-tests` job red state | GitHub Actions timestamps |

## Reference targets (portfolio project baseline)

- **Parallel CI/CD stages** reduce full-suite wall-clock time
  meaningfully vs. one serial run, because independent stages
  (security, accessibility, mobile, API) execute concurrently rather
  than queued behind each other.
- **Deterministic AI guardrail checks** (`tests/ai-guardrails`) run in
  seconds with zero network/API cost, because they are rule-based, not
  LLM-based - this is the throughput argument for a deterministic
  pre-filter layer over an LLM-as-judge layer for the cases it covers.
- **Advisory vs. hard-fail classification** across security,
  accessibility, and mobile specs means not every flagged issue blocks
  a merge - only `critical`/`serious` classes do - which is the
  triage-effort argument in practice, not just in a slide.

## How to turn these into real, defensible numbers

1. Run the `quality-gate` workflow 5-10 times and record the duration.
2. Deliberately introduce a known regression (broken locator, missing
   ARIA label, a reintroduced n8n-style injection string) and record
   which stage catches it and how fast.
3. Only then write a number down as "measured" rather than "designed
   to achieve" - that distinction is what survives a follow-up
   question in an interview.
