import * as fs from 'fs';
import * as path from 'path';

/**
 * AI GUARDRAIL LAYER
 * ------------------------------------------------------------------
 * WHAT THIS IS: a deterministic, rule-based pre/post-processing guard
 * that sits in front of / behind an LLM call. It is intentionally
 * NOT an LLM itself - guardrails that depend on another probabilistic
 * model to police a probabilistic model are a weaker design; a fast,
 * deterministic layer catches the obvious cases cheaply and
 * predictably, before anything reaches (or leaves) the model.
 *
 * WHAT THIS IS NOT: this is not a hallucination-detection or
 * answer-quality evaluator - that class of check genuinely needs an
 * LLM-as-judge (e.g. DeepEval / Ragas-style faithfulness scoring) and
 * is out of scope for this deterministic layer by design.
 *
 * PRODUCTION EXTENSION POINT:
 * In a real deployment this module would wrap a LangChain Runnable
 * and every call would be traced to LangSmith for observability:
 *
 *   import { ChatOpenAI } from '@langchain/openai';
 *   import { RunnableSequence } from '@langchain/core/runnables';
 *   // process.env.LANGCHAIN_TRACING_V2 = 'true';
 *   // process.env.LANGCHAIN_PROJECT = 'qa-agentic-pipeline';
 *   const guardedChain = RunnableSequence.from([
 *     (input: string) => { const g = runGuardrails(input); if (!g.allowed) throw new Error(g.reason); return input; },
 *     new ChatOpenAI({ model: 'gpt-4o-mini' }),
 *   ]);
 *
 * That wiring needs a live API key and network egress, so it is left
 * as a documented extension point rather than wired into CI, where
 * it would be non-deterministic and would fail on a key-less runner.
 * The deterministic checks below ARE what actually runs in CI.
 */

export interface GuardResult {
  allowed: boolean;
  reason: string | null;
  flags: string[];
  redactedInput: string;
}

// --- Prompt injection detection --------------------------------------
// Pattern-based detection of common injection/jailbreak phrasing.
// This is a first line of defence, not a complete solution - see
// docs/AI_GUARDRAILS.md for known limitations.
const INJECTION_PATTERNS: { id: string; regex: RegExp }[] = [
  { id: 'ignore-previous-instructions', regex: /ignore (all|any|the) (previous|prior|above) instructions?/i },
  { id: 'role-override', regex: /you are now (a|an) .*(unfiltered|unrestricted|dan|jailbroken)/i },
  { id: 'system-prompt-exfil', regex: /(reveal|print|show|output) (your|the) (system prompt|instructions)/i },
  { id: 'developer-mode', regex: /enable (developer|debug|admin) mode/i },
  { id: 'delimiter-escape', regex: /```[\s\S]*end of (system|user) (prompt|message)[\s\S]*```/i },
];

// --- PII detection -----------------------------------------------------
const PII_PATTERNS: { id: string; regex: RegExp; redact: string }[] = [
  { id: 'email', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, redact: '[REDACTED_EMAIL]' },
  { id: 'credit-card', regex: /\b(?:\d[ -]*?){13,16}\b/g, redact: '[REDACTED_CARD]' },
  { id: 'phone', regex: /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3}[-.\s]?\d{3,4}\b/g, redact: '[REDACTED_PHONE]' },
];

export function detectPromptInjection(input: string): string[] {
  return INJECTION_PATTERNS.filter(p => p.regex.test(input)).map(p => p.id);
}

export function redactPII(input: string): { redacted: string; flags: string[] } {
  let redacted = input;
  const flags: string[] = [];
  for (const p of PII_PATTERNS) {
    if (p.regex.test(input)) {
      flags.push(p.id);
      redacted = redacted.replace(p.regex, p.redact);
    }
  }
  return { redacted, flags };
}

export function runGuardrails(input: string): GuardResult {
  const injectionFlags = detectPromptInjection(input);
  const { redacted, flags: piiFlags } = redactPII(input);

  const allFlags = [...injectionFlags, ...piiFlags];
  const allowed = injectionFlags.length === 0;

  const result: GuardResult = {
    allowed,
    reason: allowed ? null : `Blocked - matched injection pattern(s): ${injectionFlags.join(', ')}`,
    flags: allFlags,
    redactedInput: redacted,
  };

  writeTrace(input, result);
  return result;
}

// --- Trace logging (LangSmith-style run capture, written locally) -----
function writeTrace(input: string, result: GuardResult): void {
  const traceDir = path.join(__dirname, '..', 'traces');
  if (!fs.existsSync(traceDir)) fs.mkdirSync(traceDir, { recursive: true });

  const trace = {
    timestamp: new Date().toISOString(),
    runType: 'guardrail-check',
    input: input.length > 200 ? input.slice(0, 200) + '...[truncated]' : input,
    output: result,
  };

  const file = path.join(traceDir, `trace-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.json`);
  fs.writeFileSync(file, JSON.stringify(trace, null, 2));
}
