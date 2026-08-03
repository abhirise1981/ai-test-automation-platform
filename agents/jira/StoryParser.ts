/**
 * StoryParser.ts — Jira Story → ParsedStory Transformer
 *
 * Takes the raw Jira API response and transforms it into a clean,
 * strongly-typed ParsedStory object that downstream agents consume.
 *
 * Key responsibilities:
 *  - Parse both ADF (Atlassian Document Format) and plain-text descriptions
 *  - Extract acceptance criteria from various formats (bullets, numbered, Given/When/Then)
 *  - Auto-detect platform (web / mobile / both) from labels and components
 */
import type { JiraIssueResponse } from './JiraClient';
import { jiraConfig } from './jira.config';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type IssueType = 'Story' | 'Bug' | 'Task' | 'Sub-task' | 'Epic';
export type Platform = 'web' | 'mobile' | 'both';

export interface ParsedStory {
  /** Jira issue key, e.g., "PROJ-123" */
  key: string;

  /** Story title / summary */
  summary: string;

  /** Full description text (cleaned from ADF) */
  description: string;

  /** Extracted acceptance criteria as individual items */
  acceptanceCriteria: string[];

  /** Normalized priority level */
  priority: PriorityLevel;

  /** Issue type */
  type: IssueType;

  /** Target platform — drives web vs mobile test generation */
  platform: Platform;

  /** Jira labels */
  labels: string[];

  /** Jira component names */
  components: string[];

  /** Current Jira status */
  status: string;

  /** Raw Jira JSON for reference */
  raw: JiraIssueResponse;
}

// ─────────────────────────────────────────────────────────────────────────────
// Parser
// ─────────────────────────────────────────────────────────────────────────────

export class StoryParser {
  /**
   * Parse a raw Jira issue response into a clean ParsedStory object.
   */
  parse(issue: JiraIssueResponse): ParsedStory {
    const fields = issue.fields;
    const descriptionText = this.extractDescription(fields.description);

    return {
      key: issue.key,
      summary: fields.summary,
      description: descriptionText,
      acceptanceCriteria: this.extractAcceptanceCriteria(descriptionText),
      priority: this.normalizePriority(fields.priority?.name),
      type: this.normalizeIssueType(fields.issuetype?.name),
      platform: this.detectPlatform(fields.labels, fields.components),
      labels: fields.labels || [],
      components: (fields.components || []).map((c) => c.name),
      status: fields.status?.name || 'Unknown',
      raw: issue,
    };
  }

  /**
   * Parse multiple Jira issues at once.
   */
  parseAll(issues: JiraIssueResponse[]): ParsedStory[] {
    return issues.map((issue) => this.parse(issue));
  }

  // ─── Description Extraction ──────────────────────────────────────────────

  /**
   * Extract plain text from Jira description field.
   * Handles both ADF (Atlassian Document Format) and plain strings.
   */
  private extractDescription(description: unknown): string {
    if (!description) {
      return '';
    }

    // Plain text string
    if (typeof description === 'string') {
      return description.trim();
    }

    // ADF (Atlassian Document Format) — recursive extraction
    if (typeof description === 'object' && description !== null) {
      return this.extractTextFromAdf(description as AdfNode).trim();
    }

    return '';
  }

  /**
   * Recursively extract text from an ADF node tree.
   */
  private extractTextFromAdf(node: AdfNode): string {
    let text = '';

    if (node.type === 'text' && node.text) {
      text += node.text;
    }

    if (node.type === 'hardBreak') {
      text += '\n';
    }

    if (node.type === 'listItem') {
      text += '• ';
    }

    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content) {
        text += this.extractTextFromAdf(child);
      }
    }

    // Add newline after block-level elements
    if (['paragraph', 'heading', 'bulletList', 'orderedList', 'listItem'].includes(node.type)) {
      text += '\n';
    }

    return text;
  }

  // ─── Acceptance Criteria Extraction ──────────────────────────────────────

  /**
   * Extract acceptance criteria from the description text.
   * Supports multiple formats:
   *  1. Bullet lists (• or - or *)
   *  2. Numbered lists (1. 2. 3.)
   *  3. Given/When/Then (Gherkin-style)
   *  4. "AC:" or "Acceptance Criteria:" header sections
   */
  private extractAcceptanceCriteria(description: string): string[] {
    if (!description) {
      return [];
    }

    const criteria: string[] = [];
    const lines = description
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    let inAcSection = false;

    for (const line of lines) {
      // Detect AC section headers
      if (/^(acceptance\s+criteria|ac\s*:|requirements\s*:)/i.test(line)) {
        inAcSection = true;
        continue;
      }

      // Detect end of AC section (next header)
      if (inAcSection && /^(description|notes|technical|implementation|details)\s*:/i.test(line)) {
        inAcSection = false;
        continue;
      }

      // Extract bullet items from AC section
      if (inAcSection) {
        const bulletMatch = line.match(/^[•\-*]\s*(.+)$/);
        const numberedMatch = line.match(/^\d+[.)]\s*(.+)$/);
        if (bulletMatch) {
          criteria.push(bulletMatch[1].trim());
        } else if (numberedMatch) {
          criteria.push(numberedMatch[1].trim());
        } else if (line.length > 10) {
          // Non-bullet text in AC section — include it
          criteria.push(line);
        }
      }

      // Extract Given/When/Then blocks regardless of section
      if (/^(given|when|then|and|but)\s+/i.test(line)) {
        criteria.push(line);
      }
    }

    // If no AC section was found, try to extract all bullet/numbered items
    if (criteria.length === 0) {
      for (const line of lines) {
        const bulletMatch = line.match(/^[•\-*]\s*(.+)$/);
        const numberedMatch = line.match(/^\d+[.)]\s*(.+)$/);
        if (bulletMatch) {
          criteria.push(bulletMatch[1].trim());
        } else if (numberedMatch) {
          criteria.push(numberedMatch[1].trim());
        }
      }
    }

    return criteria;
  }

  // ─── Platform Detection ──────────────────────────────────────────────────

  /**
   * Auto-detect the target platform from Jira labels and components.
   */
  private detectPlatform(labels: string[], components: Array<{ name: string }>): Platform {
    const allTags = [...labels.map((l) => l.toLowerCase()), ...components.map((c) => c.name.toLowerCase())];

    const hasMobile = allTags.some((tag) => jiraConfig.mobilePlatformLabels.some((mLabel) => tag.includes(mLabel)));

    const hasWeb = allTags.some((tag) => jiraConfig.webPlatformLabels.some((wLabel) => tag.includes(wLabel)));

    if (hasMobile && hasWeb) {
      return 'both';
    }
    if (hasMobile) {
      return 'mobile';
    }
    // Default to web if no platform indicator is found
    return 'web';
  }

  // ─── Normalizers ─────────────────────────────────────────────────────────

  private normalizePriority(priority: string | undefined): PriorityLevel {
    const map: Record<string, PriorityLevel> = {
      highest: 'Critical',
      critical: 'Critical',
      blocker: 'Critical',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      lowest: 'Low',
    };
    return map[(priority || '').toLowerCase()] || 'Medium';
  }

  private normalizeIssueType(type: string | undefined): IssueType {
    const map: Record<string, IssueType> = {
      story: 'Story',
      bug: 'Bug',
      task: 'Task',
      'sub-task': 'Sub-task',
      subtask: 'Sub-task',
      epic: 'Epic',
    };
    return map[(type || '').toLowerCase()] || 'Story';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal ADF type (minimal)
// ─────────────────────────────────────────────────────────────────────────────

interface AdfNode {
  type: string;
  text?: string;
  content?: AdfNode[];
  attrs?: Record<string, unknown>;
}
