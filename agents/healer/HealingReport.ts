/**
 * HealingReport.ts — Healing Action Report Generator
 *
 * Generates markdown reports documenting all healing actions taken by the Healer Agent.
 * Reports include before/after diffs, confidence scores, and human-review flags.
 */
import * as fs from 'fs';
import * as path from 'path';
import type { FailureAnalysis } from './LocatorHealer';

export interface HealingAction {
  analysis: FailureAnalysis;
  actionTaken: 'AUTO_FIXED' | 'SUGGESTION_ONLY' | 'SKIPPED' | 'HUMAN_REVIEW';
  patchApplied?: {
    file: string;
    oldContent: string;
    newContent: string;
  };
  timestamp: string;
}

export class HealingReport {
  private readonly actions: HealingAction[] = [];
  private readonly outputDir: string;

  constructor(outputDir?: string) {
    this.outputDir = outputDir || path.resolve(__dirname, '../../agents/healer/healing-reports');
  }

  /** Record a healing action. */
  addAction(action: HealingAction): void {
    this.actions.push(action);
  }

  /** Generate and save the full healing report. */
  generate(): string {
    const lines: string[] = [
      `# 🩹 Healing Report`,
      ``,
      `**Generated:** ${new Date().toISOString()}`,
      `**Total Failures Analyzed:** ${this.actions.length}`,
      `**Auto-Fixed:** ${this.actions.filter((a) => a.actionTaken === 'AUTO_FIXED').length}`,
      `**Needs Human Review:** ${this.actions.filter((a) => a.actionTaken === 'HUMAN_REVIEW').length}`,
      `**Skipped:** ${this.actions.filter((a) => a.actionTaken === 'SKIPPED').length}`,
      ``,
      `---`,
      ``,
      `## Summary`,
      ``,
      `| # | Test | Failure Type | Action | Confidence |`,
      `|---|------|-------------|--------|------------|`,
    ];

    this.actions.forEach((action, i) => {
      const topConfidence = action.analysis.healingSuggestions[0]?.suggestions[0]?.confidence || 0;
      lines.push(
        `| ${i + 1} | ${action.analysis.testName} | ${action.analysis.failureType} | ${action.actionTaken} | ${(topConfidence * 100).toFixed(0)}% |`,
      );
    });

    lines.push('', '---', '');

    // Detailed sections
    for (const action of this.actions) {
      lines.push(`### ${action.analysis.testName}`);
      lines.push('');
      lines.push(`- **File:** \`${action.analysis.testFile}\``);
      lines.push(`- **Type:** ${action.analysis.failureType}`);
      lines.push(`- **Action:** ${action.actionTaken}`);
      lines.push(`- **Auto-Fixable:** ${action.analysis.autoFixable ? 'Yes' : 'No'}`);
      lines.push(`- **Human Review:** ${action.analysis.requiresHumanReview ? '⚠️ Yes' : 'No'}`);
      lines.push('');

      if (action.analysis.brokenSelector) {
        lines.push(`**Broken Selector:** \`${action.analysis.brokenSelector}\``);
        lines.push('');
      }

      if (action.analysis.healingSuggestions.length > 0) {
        lines.push('**Healing Suggestions:**');
        lines.push('');
        lines.push('| # | Selector | Strategy | Confidence |');
        lines.push('|---|----------|----------|------------|');

        for (const suggestion of action.analysis.healingSuggestions) {
          for (const s of suggestion.suggestions) {
            lines.push(`| | \`${s.selector}\` | ${s.strategy} | ${(s.confidence * 100).toFixed(0)}% |`);
          }
        }
        lines.push('');
      }

      if (action.patchApplied) {
        lines.push('**Patch Applied:**');
        lines.push('');
        lines.push(`File: \`${action.patchApplied.file}\``);
        lines.push('```diff');
        lines.push(`- ${action.patchApplied.oldContent}`);
        lines.push(`+ ${action.patchApplied.newContent}`);
        lines.push('```');
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

    console.log(`[HealingReport] ✅ Report saved: ${filePath}`);
    return filePath;
  }
}
