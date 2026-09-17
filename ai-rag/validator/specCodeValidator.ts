/**
 * POST-GENERATION SPEC CODE VALIDATOR (QUALITY GATE)
 * ------------------------------------------------------------------
 * Sits directly between the Generator Agent and Executor Agent in the
 * LangGraph pipeline.
 *
 * Why this is mandatory:
 * When an LLM generates test automation code, executing it unchecked
 * introduces 3 severe enterprise risks:
 * 1. Security exploits: Malicious shell commands, eval(), or data exfiltration.
 * 2. Anti-patterns: Arbitrary sleeps (waitForTimeout) or brittle /html/body XPaths.
 * 3. Assertion-free hallucinations: Tests that click around but never assert anything.
 *
 * The Code Validator enforces a 4-pillar deterministic quality gate before
 * any generated code is allowed to reach the execution engine.
 */

export interface CodeQualityGateResult {
  valid: boolean;
  qualityScore: number; // 0 to 100
  passedGates: string[];
  failedGates: string[];
  errors: string[];
  warnings: string[];
}

export class SpecCodeValidator {
  /**
   * Evaluates generated Playwright TypeScript code against enterprise quality gates.
   */
  public static validate(code: string): CodeQualityGateResult {
    const passedGates: string[] = [];
    const failedGates: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // --- GATE 1: SECURITY & SANDBOXING GATE ---
    const securityViolations = this.checkSecurity(code);
    if (securityViolations.length === 0) {
      passedGates.push('SECURITY_SANDBOX_GATE');
    } else {
      failedGates.push('SECURITY_SANDBOX_GATE');
      errors.push(...securityViolations);
    }

    // --- GATE 2: PLAYWRIGHT FRAMEWORK CONFORMANCE ---
    const frameworkViolations = this.checkFrameworkConformance(code);
    if (frameworkViolations.length === 0) {
      passedGates.push('FRAMEWORK_CONFORMANCE_GATE');
    } else {
      failedGates.push('FRAMEWORK_CONFORMANCE_GATE');
      errors.push(...frameworkViolations);
    }

    // --- GATE 3: ASSERTION INTEGRITY GATE (Anti-Hallucination) ---
    const assertionViolations = this.checkAssertionIntegrity(code);
    if (assertionViolations.length === 0) {
      passedGates.push('ASSERTION_INTEGRITY_GATE');
    } else {
      failedGates.push('ASSERTION_INTEGRITY_GATE');
      errors.push(...assertionViolations);
    }

    // --- GATE 4: ANTI-PATTERN PREVENTION GATE ---
    const antiPatternViolations = this.checkAntiPatterns(code);
    if (antiPatternViolations.length === 0) {
      passedGates.push('ANTI_PATTERN_GATE');
    } else {
      failedGates.push('ANTI_PATTERN_GATE');
      errors.push(...antiPatternViolations);
    }

    // Calculate quality score (25 points per passed gate)
    const qualityScore = passedGates.length * 25;
    const valid = failedGates.length === 0;

    return {
      valid,
      qualityScore,
      passedGates,
      failedGates,
      errors,
      warnings,
    };
  }

  private static checkSecurity(code: string): string[] {
    const violations: string[] = [];
    if (/eval\s*\(/.test(code)) {
      violations.push('Security Violation: Disallowed eval() execution detected.');
    }
    if (/child_process|exec\s*\(|spawn\s*\(/.test(code)) {
      violations.push('Security Violation: Unauthorized subprocess shell execution detected.');
    }
    if (/process\.exit|process\.kill/.test(code)) {
      violations.push('Security Violation: Process termination calls detected.');
    }
    if (/fs\.(unlink|rmdir|rmSync|truncate)/.test(code)) {
      violations.push('Security Violation: Destructive filesystem operations detected.');
    }
    return violations;
  }

  private static checkFrameworkConformance(code: string): string[] {
    const violations: string[] = [];
    if (!code.includes('@playwright/test')) {
      violations.push("Framework Violation: Missing '@playwright/test' package import.");
    }
    if (!/test\s*\(|test\.describe\s*\(/.test(code)) {
      violations.push('Framework Violation: Missing test() or test.describe() block.');
    }
    return violations;
  }

  private static checkAssertionIntegrity(code: string): string[] {
    const violations: string[] = [];
    if (!/expect\s*\(/.test(code)) {
      violations.push('Quality Violation: Test contains 0 assertions. Every AI-generated test must contain expect().');
    }
    return violations;
  }

  private static checkAntiPatterns(code: string): string[] {
    const violations: string[] = [];
    if (/page\.waitForTimeout\s*\(/.test(code)) {
      violations.push('Anti-Pattern Violation: Arbitrary sleep (page.waitForTimeout) detected. Use web-first assertions.');
    }
    if (/\/html\/body|\/html\[1\]/.test(code)) {
      violations.push('Anti-Pattern Violation: Fragile absolute XPath (/html/body) detected. Use data-testid or role locators.');
    }
    return violations;
  }
}
