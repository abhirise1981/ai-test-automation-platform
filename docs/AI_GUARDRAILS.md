# AI Guardrails Layer

## What this is

A deterministic, rule-based guard (`ai-guardrails/lib/guard.ts`) that
sits in front of / around an LLM call:

- **Prompt injection detection** - pattern matching against known
  jailbreak/injection phrasing ("ignore previous instructions",
  "reveal your system prompt", role-override attempts).
- **PII redaction** - regex-based detection and redaction of emails,
  phone numbers, and card-number-shaped strings before anything is
  logged or forwarded.
- **Trace audit trail** - every guard invocation writes a timestamped
  JSON record to `ai-guardrails/traces/`, mirroring how LangSmith
  captures a run for later audit (see the code comment in `guard.ts`
  for the real LangChain/LangSmith wiring this would use in
  production, which needs a live API key and isn't wired into CI on
  purpose).

## Why deterministic, not another LLM call

Using a second LLM to police a first LLM is a common pattern
(LLM-as-judge) but it inherits the same probabilistic weaknesses it's
meant to catch, and it costs money/latency on every single request.
A fast, deterministic layer catches the *obvious* cases - known
injection phrasing, structured PII - cheaply, before anything reaches
the model. It does **not** replace an LLM-as-judge layer for what that
layer is actually good at (see below).

## What this deliberately does NOT cover

- **Hallucination / faithfulness scoring** - requires comparing model
  output against retrieved context; this is DeepEval/Ragas territory
  (answer relevancy, faithfulness, contextual precision/recall), not a
  regex problem. Out of scope for this deterministic layer by design.
- **Novel/obfuscated injection phrasing** - a determined attacker who
  rephrases around the known patterns will get through. Pattern lists
  need continuous updating; they are a floor, not a ceiling.
- **Semantic PII** - a name and a city mentioned in two different
  sentences that together identify someone won't be caught by
  standalone regex. That needs a more advanced/statistical entity
  resolution approach.

## Benchmark structure

`tests/ai-guardrails/guardrails.spec.ts` runs a fixed set of labelled
known-bad and known-good cases and asserts each individually - the
same rubric-style structure as a binary-weighted eval rubric (rather
than one aggregate pass/fail score), so a regression in one pattern
doesn't hide inside an averaged number.
