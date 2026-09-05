/**
 * LocatorHealer.ts — Smart Locator Failure Classifier & Suggestion Engine
 *
 * When a test fails due to a broken locator (element not found),
 * this module analyzes the failure and suggests replacement selectors.
 *
 * Strategies (in priority order):
 *  Web:    data-testid → accessible role → text content → CSS with parent context
 *  Mobile: accessibility-id → resource-id → XCUIElementType → XPath fallback
 */

export type FailureType =
  | 'LOCATOR_BROKEN'
  | 'TIMING_FLAKY'
  | 'ASSERTION_DRIFT'
  | 'NAVIGATION_ERROR'
  | 'API_CONTRACT_CHANGE'
  | 'APP_CRASH'
  | 'UNKNOWN';

export interface HealingSuggestion {
  /** The original broken selector */
  originalSelector: string;
  /** Suggested replacement selectors (ordered by confidence) */
  suggestions: Array<{
    selector: string;
    strategy: string;
    confidence: number; // 0.0 to 1.0
  }>;
  /** File path where the selector is defined */
  sourceFile: string;
  /** Line number in the source file */
  sourceLine?: number;
}

export interface FailureAnalysis {
  testName: string;
  testFile: string;
  failureType: FailureType;
  errorMessage: string;
  brokenSelector?: string;
  healingSuggestions: HealingSuggestion[];
  requiresHumanReview: boolean;
  /** True when the engine can offer concrete selector suggestions */
  suggestionsAvailable: boolean;
}

export class LocatorHealer {
  /**
   * Classify the type of test failure from the error message.
   */
  classifyFailure(errorMessage: string, testName: string, testFile: string): FailureAnalysis {
    const failureType = this.detectFailureType(errorMessage);
    const brokenSelector = this.extractBrokenSelector(errorMessage);

    return {
      testName,
      testFile,
      failureType,
      errorMessage: errorMessage.substring(0, 500),
      brokenSelector,
      healingSuggestions: [],
      requiresHumanReview: failureType === 'ASSERTION_DRIFT' || failureType === 'APP_CRASH',
      suggestionsAvailable: failureType === 'LOCATOR_BROKEN' || failureType === 'TIMING_FLAKY',
    };
  }

  /**
   * Generate healing suggestions for a broken web locator.
   */
  generateWebSuggestions(brokenSelector: string, pageHtml?: string): HealingSuggestion {
    const suggestions: HealingSuggestion['suggestions'] = [];

    // Strategy 1: Convert to data-testid (highest confidence)
    const tagMatch = brokenSelector.match(/([a-z]+)\[/);
    if (tagMatch) {
      suggestions.push({
        selector: `[data-testid="${this.selectorToTestId(brokenSelector)}"]`,
        strategy: 'data-testid (recommended)',
        confidence: 0.95,
      });
    }

    // Strategy 2: Convert to role-based selector
    if (brokenSelector.includes('button') || brokenSelector.includes('btn')) {
      suggestions.push({
        selector: `getByRole('button', { name: '...' })`,
        strategy: 'Accessible role',
        confidence: 0.85,
      });
    }
    if (brokenSelector.includes('input')) {
      suggestions.push({
        selector: `getByRole('textbox', { name: '...' })`,
        strategy: 'Accessible role',
        confidence: 0.85,
      });
    }
    if (brokenSelector.includes('link') || brokenSelector.includes('a[')) {
      suggestions.push({
        selector: `getByRole('link', { name: '...' })`,
        strategy: 'Accessible role',
        confidence: 0.85,
      });
    }

    // Strategy 3: Text-based selector
    suggestions.push({
      selector: `getByText('...')`,
      strategy: 'Text content',
      confidence: 0.7,
    });

    // Strategy 4: CSS with parent context narrowing
    if (brokenSelector.includes('#')) {
      // ID-based — try a more specific path
      suggestions.push({
        selector: `#content ${brokenSelector}`,
        strategy: 'CSS with parent context',
        confidence: 0.6,
      });
    }

    return {
      originalSelector: brokenSelector,
      suggestions,
      sourceFile: 'config/uiConstants.ts',
    };
  }

  /**
   * Generate healing suggestions for a broken mobile locator.
   */
  generateMobileSuggestions(brokenSelector: string, platform: 'android' | 'ios'): HealingSuggestion {
    const suggestions: HealingSuggestion['suggestions'] = [];

    if (platform === 'android') {
      // Strategy 1: accessibility-id (preferred over resource-id)
      suggestions.push({
        selector: `~${this.selectorToAccessibilityId(brokenSelector)}`,
        strategy: 'Accessibility ID (preferred)',
        confidence: 0.9,
      });

      // Strategy 2: Content description
      suggestions.push({
        selector: `android=new UiSelector().description("...")`,
        strategy: 'Content description',
        confidence: 0.75,
      });

      // Strategy 3: Class name + index
      suggestions.push({
        selector: `android=new UiSelector().className("android.widget.TextView").instance(0)`,
        strategy: 'Class + index (fragile)',
        confidence: 0.4,
      });
    } else {
      // iOS strategies
      suggestions.push({
        selector: `~${this.selectorToAccessibilityId(brokenSelector)}`,
        strategy: 'Accessibility ID',
        confidence: 0.9,
      });

      suggestions.push({
        selector: `-ios predicate string:label == "..."`,
        strategy: 'iOS Predicate String',
        confidence: 0.75,
      });

      suggestions.push({
        selector: `-ios class chain:**/XCUIElementTypeButton[\`label == "..."\`]`,
        strategy: 'iOS Class Chain',
        confidence: 0.65,
      });
    }

    return {
      originalSelector: brokenSelector,
      suggestions,
      sourceFile: 'config/mobileSelectors.ts',
    };
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  private detectFailureType(errorMessage: string): FailureType {
    const msg = errorMessage.toLowerCase();

    if (
      msg.includes('element not found') ||
      msg.includes('no such element') ||
      msg.includes('locator resolved to') ||
      msg.includes('waiting for selector')
    ) {
      return 'LOCATOR_BROKEN';
    }
    if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('exceeded')) {
      return 'TIMING_FLAKY';
    }
    if (msg.includes('expected') && (msg.includes('received') || msg.includes('to be') || msg.includes('to have'))) {
      return 'ASSERTION_DRIFT';
    }
    if (msg.includes('navigation') || msg.includes('url') || msg.includes('route')) {
      return 'NAVIGATION_ERROR';
    }
    if (msg.includes('status') && (msg.includes('api') || msg.includes('response'))) {
      return 'API_CONTRACT_CHANGE';
    }
    if (msg.includes('crash') || msg.includes('died') || msg.includes('terminated')) {
      return 'APP_CRASH';
    }

    return 'UNKNOWN';
  }

  private extractBrokenSelector(errorMessage: string): string | undefined {
    // Try to extract selector from Playwright error messages
    const patterns = [
      /locator\('(.+?)'\)/,
      /selector\s*['"](.+?)['"]/,
      /Waiting for selector\s*['"](.+?)['"]/,
      /element\s*['"](.+?)['"]/,
    ];

    for (const pattern of patterns) {
      const match = errorMessage.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  private selectorToTestId(selector: string): string {
    return selector
      .replace(/[#.\[\]()='"^$*~>+:]/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
  }

  private selectorToAccessibilityId(selector: string): string {
    return selector
      .replace(/com\.\w+:id\//g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }
}
