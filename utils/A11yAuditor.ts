/**
 * A11yAuditor.ts — Intelligent Accessibility (a11y) Engine
 *
 * Powered by Axe-Core & WCAG 2.1 AA Standards.
 * Provides automated accessibility scanning, severity threshold gating,
 * and AI-ready remediation reports for compliance (Section 508 / ADA).
 */

import { Page, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export type A11ySeverity = 'minor' | 'moderate' | 'serious' | 'critical';

export interface A11yAuditOptions {
  includeTags?: string[]; // e.g. ['wcag2a', 'wcag2aa', 'wcag21aa', 'section508']
  excludeSelectors?: string[]; // Ignore 3rd party ads/widgets
  failOnSeverities?: A11ySeverity[]; // Default: ['serious', 'critical']
  scopeSelector?: string; // Limit audit to a specific component / modal
}

export interface A11yAuditReport {
  url: string;
  timestamp: string;
  violationsCount: number;
  criticalCount: number;
  seriousCount: number;
  moderateCount: number;
  minorCount: number;
  passesCount: number;
  violations: Array<{
    id: string;
    impact?: string;
    description: string;
    helpUrl: string;
    nodes: Array<{ html: string; target: string[]; failureSummary?: string }>;
  }>;
}

export class A11yAuditor {
  private defaultTags: string[] = ['wcag2a', 'wcag2aa', 'wcag21aa'];
  private defaultFailSeverities: A11ySeverity[] = ['serious', 'critical'];

  /**
   * Run Axe-Core automated accessibility scan on a Playwright Page or Component
   */
  public async auditPage(page: Page, options?: A11yAuditOptions): Promise<A11yAuditReport> {
    const tags = options?.includeTags || this.defaultTags;
    const failSeverities = options?.failOnSeverities || this.defaultFailSeverities;

    let builder = new AxeBuilder({ page }).withTags(tags);

    // Exclude third-party widgets or ad iframes if specified
    if (options?.excludeSelectors && options.excludeSelectors.length > 0) {
      for (const selector of options.excludeSelectors) {
        builder = builder.exclude(selector);
      }
    }

    // Include specific sub-component / modal scope
    if (options?.scopeSelector) {
      builder = builder.include(options.scopeSelector);
    }

    const results = await builder.analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical').length;
    const serious = results.violations.filter((v) => v.impact === 'serious').length;
    const moderate = results.violations.filter((v) => v.impact === 'moderate').length;
    const minor = results.violations.filter((v) => v.impact === 'minor').length;

    const report: A11yAuditReport = {
      url: page.url(),
      timestamp: new Date().toISOString(),
      violationsCount: results.violations.length,
      criticalCount: critical,
      seriousCount: serious,
      moderateCount: moderate,
      minorCount: minor,
      passesCount: results.passes.length,
      violations: results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        helpUrl: v.helpUrl,
        nodes: v.nodes.map((n) => ({
          html: n.html,
          target: n.target.map(String),
          failureSummary: n.failureSummary,
        })),
      })),
    };

    return report;
  }

  /**
   * Assert zero critical or serious WCAG accessibility violations
   */
  public assertZeroCriticalViolations(report: A11yAuditReport): void {
    const blockingViolations = report.violations.filter(
      (v) => v.impact && this.defaultFailSeverities.includes(v.impact as A11ySeverity)
    );

    if (blockingViolations.length > 0) {
      const summary = blockingViolations
        .map((v) => `[${v.impact?.toUpperCase()}] ${v.id}: ${v.description} (Affected: ${v.nodes[0]?.target.join(', ')})`)
        .join('\n');
      throw new Error(`🚨 WCAG Accessibility Violations Found (${blockingViolations.length} blocking issues):\n${summary}`);
    }
  }

  /**
   * WCAG 2.1.1 & 2.4.7: Verifies sequential Keyboard Tab Navigation & Focus Order
   */
  public async assertKeyboardNavigation(page: Page, expectedFocusSelectors: string[]): Promise<void> {
    for (const expectedSelector of expectedFocusSelectors) {
      await page.keyboard.press('Tab');
      const targetElement = page.locator(expectedSelector);
      await expect(targetElement).toBeFocused({ timeout: 3000 });
    }
  }

  /**
   * WCAG 2.5.5 / 2.5.8 & Mobile HIG: Verifies interactive elements meet 48x48px minimum touch target size
   */
  public async assertTouchTargetSize(page: Page, selector: string, minWidth = 48, minHeight = 48): Promise<void> {
    const elements = page.locator(selector);
    const count = await elements.count();

    for (let i = 0; i < count; i++) {
      const el = elements.nth(i);
      const box = await el.boundingBox();
      if (!box) continue;

      if (box.width < minWidth || box.height < minHeight) {
        throw new Error(
          `🚨 Touch Target Size Defect: Element "${selector}" [index ${i}] is ${Math.round(box.width)}x${Math.round(box.height)}px. Must be at least ${minWidth}x${minHeight}px for WCAG/Mobile accessibility.`
        );
      }
    }
  }
}
