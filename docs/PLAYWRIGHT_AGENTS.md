# AI-Assisted Test Authoring & Self-Healing (Playwright Native Agents)

## The honest architecture (two layers, not one)

**Layer 1 - Authoring & Healing (dev-time, human-in-the-loop)**
Uses Playwright's native agent system - Planner, Generator, Healer -
invoked through an AI coding assistant (Claude Code / VS Code) via:

```
npx playwright init-agents --loop=vscode
```

This pulls the MCP tool definitions into the repo under `.github/`.
When new coverage is needed, the **Planner** is prompted with a seed
test (`tests/ui/seed.spec.ts` pattern) and explores the live app,
producing a human-readable Markdown plan in `specs/`. The **Generator**
turns that plan into an executable TypeScript spec in `tests/`,
verifying selectors live as it writes. A human reviews both the plan
and the generated test before commit - this is a development-time
workflow, not a runtime one.

**Layer 2 - Execution (CI/CD, fully deterministic)**
Once a test is generated and reviewed, it runs exactly like any other
Playwright spec - triggered by GitHub Actions on every push/PR, with
**zero LLM calls in the runtime execution path**. This is intentional:
non-deterministic AI calls have no place deciding pass/fail in a
production test run.

**Layer 3 - Healing (AI touches a failure, but stays gated)**
When a test fails, the **Healer** agent is invoked manually against
that spec. It replays the failing steps, inspects the current DOM,
proposes a locator/wait/data patch, and re-runs to confirm. It never
auto-merges - a human reviews the diff to decide whether the failure
was a locator drift or a real regression before merging.

## Why this split matters (and why it survives follow-up questions)

| Question | Honest answer |
|---|---|
| "How do you call the agent?" | Through the AI coding assistant's own agent loop using Playwright's registered MCP tools - not an API call I make. |
| "How does this fit your CI/CD?" | It doesn't run inside CI. CI runs deterministic, already-reviewed tests only. |
| "Is this production-grade?" | Authoring/healing are dev-time and human-reviewed. Execution is production-grade, standard CI, zero AI runtime risk. |

## Known limitations (raise these proactively, don't wait to be asked)

1. **Enterprise/regulated environments** - Playwright Agents connect to
   an MCP server backed by an external LLM. In an FCA-regulated or
   banking context, this should only run against a sandboxed,
   self-hosted model (e.g. an internal Azure OpenAI tenant), never a
   public API endpoint touching proprietary app source or DOM.
2. **Healer false-positive risk** - if a button changed because of a
   real bug (not a cosmetic refactor), the Healer could "fix" the test
   to point at the wrong element and mask a regression. That's exactly
   why healing output is a suggested PR, not an auto-merge.
3. **Maturity** - this is an actively evolving Playwright feature
   (VS Code 1.105+, MCP tooling). Treated here as a prototyped,
   sandboxed capability - not claimed as a 2-year production track
   record.
