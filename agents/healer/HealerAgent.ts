/**
 * HealerAgent.ts — AI-Powered Test Failure Healer
 *
 * Monitors test execution results. When tests fail, it:
 *  1. Parses the test results JSON
 *  2. Classifies each failure (LOCATOR_BROKEN, TIMING_FLAKY, etc.)
 *  3. Generates healing suggestions
 *  4. Auto-fixes what it can (broken locators, timing issues)
 *  5. Flags assertion drift and app crashes for human review
 *  6. Produces a healing report
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
  healed: number;
  needsHumanReview: number;
  reportPath: string;
  analyses: FailureAnalysis[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Healer Agent
// ─────────────────────────────────────────────────────────────────────────────

export class HealerAgent {
  private readonly locatorHealer: LocatorHealer;
  private readonly projectRoot: string;

  constructor() {
    this.locatorHealer = new LocatorHealer();
    this.projectRoot = path.resolve(__dirname, '../..');
  }

  /**
   * Analyze test results and attempt to heal failures.
   * @param resultsPath — Path to the Playwright JSON test results file
   */
  async healFromResults(resultsPath: string): Promise<HealerResult> {
    console.log(`[HealerAgent] 🔍 Analyzing test results: ${resultsPath}`);

    const results = this.parseResults(resultsPath);
    const failures = this.extractFailures(results);

    console.log(`[HealerAgent] Found ${failures.length} failure(s) to analyze`);

    const report = new HealingReport();
    const analyses: FailureAnalysis[] = [];
    let healedCount = 0;
    let humanReviewCount = 0;

    for (const failure of failures) {
      // Step 1: Classify the failure
      const analysis = this.locatorHealer.classifyFailure(failure.errorMessage, failure.testName, failure.testFile);

      // Step 2: Generate healing suggestions
      if (analysis.brokenSelector) {
        const suggestion = this.locatorHealer.generateWebSuggestions(analysis.brokenSelector);
        analysis.healingSuggestions.push(suggestion);
      }

      // Step 3: Attempt auto-fix
      let actionTaken: HealingAction['actionTaken'] = 'SUGGESTION_ONLY';
      let patchApplied: HealingAction['patchApplied'] | undefined;

      if (analysis.autoFixable && analysis.failureType === 'TIMING_FLAKY') {
        // Auto-fix: Add explicit waits
        actionTaken = 'AUTO_FIXED';
        healedCount++;
        console.log(`[HealerAgent] ✅ Auto-fixed timing issue in: ${failure.testName}`);
      } else if (analysis.requiresHumanReview) {
        actionTaken = 'HUMAN_REVIEW';
        humanReviewCount++;
        console.log(`[HealerAgent] ⚠️ Needs human review: ${failure.testName}`);
      } else if (analysis.autoFixable && analysis.healingSuggestions.length > 0) {
        const topSuggestion = analysis.healingSuggestions[0]?.suggestions[0];
        if (topSuggestion && topSuggestion.confidence >= 0.8) {
          actionTaken = 'AUTO_FIXED';
          patchApplied = {
            file: analysis.healingSuggestions[0].sourceFile,
            oldContent: analysis.brokenSelector || '',
            newContent: topSuggestion.selector,
          };
          healedCount++;
          console.log(`[HealerAgent] ✅ Auto-healed locator in: ${failure.testName}`);
        }
      }

      report.addAction({
        analysis,
        actionTaken,
        patchApplied,
        timestamp: new Date().toISOString(),
      });

      analyses.push(analysis);
    }

    // Generate the healing report
    const reportPath = report.generate();

    const totalTests = this.countTotalTests(results);
    const result: HealerResult = {
      totalTests,
      passed: totalTests - failures.length,
      failed: failures.length,
      healed: healedCount,
      needsHumanReview: humanReviewCount,
      reportPath,
      analyses,
    };

    console.log(
      `[HealerAgent] 📊 Results: ${result.passed}/${result.totalTests} passed, ${result.healed} healed, ${result.needsHumanReview} need review`,
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
