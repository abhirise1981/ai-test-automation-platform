/**
 * HealerAgent.ts — AI-Powered Test Failure Advisor
 *
 * Post-execution diagnostic agent that runs AFTER the test suite completes.
 * It reads Playwright's JSON results and produces an actionable healing report.
 *
 * Design philosophy: ADVISORY ONLY — never auto-patches code.
 *  1. Parses the test results JSON
 *  2. Classifies each failure (LOCATOR_BROKEN, TIMING_FLAKY, etc.)
 *  3. Generates ranked healing suggestions with confidence scores
 *  4. Produces a markdown report for the engineer to review
 *
 * Why advisory-only?
 *  - Auto-patching locators can mask real app bugs (false-green)
 *  - Engineers must validate that the fix matches the intended UX
 *  - CI should never silently change test source code
 */
import * as fs from 'fs';
import * as path from 'path';
import { type FailureAnalysis, LocatorHealer } from './LocatorHealer';
import { type HealingAction, HealingReport } from './HealingReport';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface PlaywrightTestResult {
  suites: PlaywrightSuite[];
}

interface PlaywrightSuite {
  title: string;
  file: string;
  specs: PlaywrightSpec[];
  suites?: PlaywrightSuite[];
}

interface PlaywrightSpec {
  title: string;
  ok: boolean;
  tests: Array<{
    status: string;
    results: Array<{
      status: string;
      error?: { message: string; stack?: string };
    }>;
  }>;
}

export interface HealerResult {
  totalTests: number;
  passed: number;
  failed: number;
  suggestionsGenerated: number;
  needsHumanReview: number;
  reportPath: string;
  analyses: FailureAnalysis[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Healer Agent (Advisory Mode)
// ─────────────────────────────────────────────────────────────────────────────

export class HealerAgent {
  private readonly locatorHealer: LocatorHealer;
  private readonly projectRoot: string;

  constructor() {
    this.locatorHealer = new LocatorHealer();
    this.projectRoot = path.resolve(__dirname, '../..');
  }

  /**
   * Analyze test results and generate healing suggestions (advisory only).
   * @param resultsPath — Path to the Playwright JSON test results file
   */
  async healFromResults(resultsPath: string): Promise<HealerResult> {
    console.log(`[HealerAgent] 🔍 Analyzing test results: ${resultsPath}`);

    const results = this.parseResults(resultsPath);
    const failures = this.extractFailures(results);

    if (failures.length === 0) {
      console.log('[HealerAgent] ✅ All tests passed — no healing needed');
      const totalTests = this.countTotalTests(results);
      return {
        totalTests,
        passed: totalTests,
        failed: 0,
        suggestionsGenerated: 0,
        needsHumanReview: 0,
        reportPath: '',
        analyses: [],
      };
    }

    console.log(`[HealerAgent] Found ${failures.length} failure(s) to analyze`);

    const report = new HealingReport();
    const analyses: FailureAnalysis[] = [];
    let suggestionsCount = 0;
    let humanReviewCount = 0;

    for (const failure of failures) {
      // Step 1: Classify the failure type
      const analysis = this.locatorHealer.classifyFailure(
        failure.errorMessage,
        failure.testName,
        failure.testFile,
      );

      // Step 2: Generate healing suggestions (if locator-related)
      if (analysis.brokenSelector) {
        const suggestion = this.locatorHealer.generateWebSuggestions(analysis.brokenSelector);
        analysis.healingSuggestions.push(suggestion);
        suggestionsCount++;
      }

      // Step 3: Determine advisory action
      let actionTaken: HealingAction['actionTaken'];

      if (analysis.requiresHumanReview) {
        actionTaken = 'NEEDS_INVESTIGATION';
        humanReviewCount++;
        console.log(`[HealerAgent] 🔬 Needs investigation: ${failure.testName} (${analysis.failureType})`);
      } else if (analysis.healingSuggestions.length > 0) {
        actionTaken = 'SUGGESTION_PROVIDED';
        console.log(`[HealerAgent] 💡 Suggestion provided: ${failure.testName} (${analysis.failureType})`);
      } else {
        actionTaken = 'CLASSIFIED_ONLY';
        console.log(`[HealerAgent] 📋 Classified: ${failure.testName} (${analysis.failureType})`);
      }

      report.addAction({
        analysis,
        actionTaken,
        timestamp: new Date().toISOString(),
      });

      analyses.push(analysis);
    }

    // Generate the advisory report
    const reportPath = report.generate();

    const totalTests = this.countTotalTests(results);
    const result: HealerResult = {
      totalTests,
      passed: totalTests - failures.length,
      failed: failures.length,
      suggestionsGenerated: suggestionsCount,
      needsHumanReview: humanReviewCount,
      reportPath,
      analyses,
    };

    console.log(
      `[HealerAgent] 📊 Advisory Report: ${result.passed}/${result.totalTests} passed, ` +
        `${result.suggestionsGenerated} suggestions, ${result.needsHumanReview} need investigation`,
    );

    return result;
  }

  // ─── Parsing ─────────────────────────────────────────────────────────────

  private parseResults(resultsPath: string): PlaywrightTestResult {
    const absolutePath = path.resolve(this.projectRoot, resultsPath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`[HealerAgent] Results file not found: ${absolutePath}`);
    }

    const content = fs.readFileSync(absolutePath, 'utf-8');
    return JSON.parse(content);
  }

  private extractFailures(
    results: PlaywrightTestResult,
  ): Array<{ testName: string; testFile: string; errorMessage: string }> {
    const failures: Array<{ testName: string; testFile: string; errorMessage: string }> = [];

    const processSpecs = (specs: PlaywrightSpec[], file: string) => {
      for (const spec of specs) {
        for (const test of spec.tests) {
          for (const result of test.results) {
            if (result.status === 'failed' && result.error) {
              failures.push({
                testName: spec.title,
                testFile: file,
                errorMessage: result.error.message || result.error.stack || 'Unknown error',
              });
            }
          }
        }
      }
    };

    const processSuites = (suites: PlaywrightSuite[]) => {
      for (const suite of suites) {
        processSpecs(suite.specs || [], suite.file);
        if (suite.suites) {
          processSuites(suite.suites);
        }
      }
    };

    processSuites(results.suites || []);
    return failures;
  }

  private countTotalTests(results: PlaywrightTestResult): number {
    let count = 0;
    const countInSuites = (suites: PlaywrightSuite[]) => {
      for (const suite of suites) {
        for (const spec of suite.specs || []) {
          count += spec.tests.length;
        }
        if (suite.suites) {
          countInSuites(suite.suites);
        }
      }
    };
    countInSuites(results.suites || []);
    return count;
  }
}

// ─── CLI Entrypoint ─────────────────────────────────────────────────────────
if (require.main === module) {
  const resultsFile = process.argv[2] || 'test-results/results.json';
  const healer = new HealerAgent();
  healer
    .healFromResults(resultsFile)
    .then((result) => {
      console.log(`[HealerAgent] Finished analysis. Report generated: ${result.reportPath || 'None'}`);
    })
    .catch((err) => {
      console.warn(`[HealerAgent] Advisory check bypassed: ${err.message}`);
    });
}
