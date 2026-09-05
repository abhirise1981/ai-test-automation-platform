/**
 * HealingReport.ts — Advisory Healing Report Generator
 *
 * Generates a markdown diagnostic report documenting all failure classifications
 * and healing suggestions provided by the Healer Agent.
 *
 * This report is ADVISORY — it never patches code. Engineers review the
 * suggestions and decide which fixes to apply manually.
 */
import * as fs from 'fs';
import * as path from 'path';
import type { FailureAnalysis } from './LocatorHealer';

export interface HealingAction {
  analysis: FailureAnalysis;
  actionTaken: 'SUGGESTION_PROVIDED' | 'NEEDS_INVESTIGATION' | 'CLASSIFIED_ONLY';
  timestamp: string;
}

export class HealingReport {
  private readonly actions: HealingAction[] = [];
  private readonly outputDir: string;

  constructor(outputDir?: string) {
    this.outputDir = outputDir || path.resolve(process.cwd(), 'healing-reports');
  }

  /** Record a healing action. */
  addAction(action: HealingAction): void {
    this.actions.push(action);
  }

  /** Generate and save the advisory healing report. */
  generate(): string {
    const suggestions = this.actions.filter((a) => a.actionTaken === 'SUGGESTION_PROVIDED').length;
    const investigations = this.actions.filter((a) => a.actionTaken === 'NEEDS_INVESTIGATION').length;
    const classified = this.actions.filter((a) => a.actionTaken === 'CLASSIFIED_ONLY').length;

    const lines: string[] = [
      `# 🩹 Healing Advisory Report`,
      ``,
      `> **Mode: Advisory Only** — No code was modified. Review suggestions below and apply fixes manually.`,
      ``,
      `**Generated:** ${new Date().toISOString()}`,
      `**Total Failures Analyzed:** ${this.actions.length}`,
      `**Suggestions Provided:** ${suggestions}`,
      `**Needs Investigation:** ${investigations}`,
      `**Classified Only:** ${classified}`,
      ``,
      `---`,
      ``,
      `## Summary`,
      ``,
      `| # | Test | Failure Type | Status | Top Confidence |`,
      `|---|------|-------------|--------|----------------|`,
    ];

    this.actions.forEach((action, i) => {
      const topConfidence = action.analysis.healingSuggestions[0]?.suggestions[0]?.confidence || 0;
      const statusIcon =
        action.actionTaken === 'SUGGESTION_PROVIDED'
          ? '💡'
          : action.actionTaken === 'NEEDS_INVESTIGATION'
            ? '🔬'
            : '📋';
      lines.push(
        `| ${i + 1} | ${action.analysis.testName} | ${action.analysis.failureType} | ${statusIcon} ${action.actionTaken} | ${(topConfidence * 100).toFixed(0)}% |`,
      );
    });

    lines.push('', '---', '');

    // Detailed sections
    for (const action of this.actions) {
      lines.push(`### ${action.analysis.testName}`);
      lines.push('');
      lines.push(`- **File:** \`${action.analysis.testFile}\``);
      lines.push(`- **Failure Type:** ${action.analysis.failureType}`);
      lines.push(`- **Status:** ${action.actionTaken}`);
      lines.push(
        `- **Needs Investigation:** ${action.analysis.requiresHumanReview ? '⚠️ Yes' : 'No'}`,
      );
      lines.push('');

      if (action.analysis.brokenSelector) {
        lines.push(`**Broken Selector:** \`${action.analysis.brokenSelector}\``);
        lines.push('');
      }

      if (action.analysis.healingSuggestions.length > 0) {
        lines.push('**Suggested Fixes (apply manually):**');
        lines.push('');
        lines.push('| # | Selector | Strategy | Confidence |');
        lines.push('|---|----------|----------|------------|');

        for (const suggestion of action.analysis.healingSuggestions) {
          suggestion.suggestions.forEach((s, idx) => {
            lines.push(
              `| ${idx + 1} | \`${s.selector}\` | ${s.strategy} | ${(s.confidence * 100).toFixed(0)}% |`,
            );
          });
        }
        lines.push('');
      }

      lines.push(`**Error (truncated):** ${action.analysis.errorMessage.substring(0, 200)}`);
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    const markdown = lines.join('\n');

    // Save to file
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const filePath = path.join(this.outputDir, `healing-report-${timestamp}.md`);
    fs.writeFileSync(filePath, markdown, 'utf-8');

    console.log(`[HealingReport] ✅ Advisory report saved: ${filePath}`);
    return filePath;
  }
}
