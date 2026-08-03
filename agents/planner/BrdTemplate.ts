/**
 * BrdTemplate.ts — Business Requirements Document Template Engine
 *
 * Generates structured BRD markdown files from ParsedStory objects.
 * These BRD files become the input for the Generator Agent.
 *
 * The BRD contains all the information the Generator needs to produce
 * test scripts: acceptance criteria, test scenarios, page objects,
 * API endpoints, and test data requirements.
 */
import type { ParsedStory } from '../jira/StoryParser';

export interface TestScenario {
  id: string;
  type: 'Happy Path' | 'Negative' | 'Edge Case' | 'Data-Driven' | 'Security' | 'Performance';
  platform: 'web' | 'mobile' | 'api';
  summary: string;
  steps: string[];
  expectedResult: string;
  priority: string;
  pageObjects?: string[];
  screenObjects?: string[];
}

export interface BrdContent {
  story: ParsedStory;
  scenarios: TestScenario[];
  pageObjectsRequired: string[];
  screenObjectsRequired: string[];
  apiEndpointsInvolved: string[];
  testDataRequirements: string[];
  generatedAt: string;
}

export class BrdTemplate {
  /**
   * Generate a complete BRD markdown document from the analyzed content.
   */
  generate(content: BrdContent): string {
    const sections = [
      this.headerSection(content),
      this.storyOverviewSection(content.story),
      this.acceptanceCriteriaSection(content.story),
      this.testScenarioMatrixSection(content.scenarios),
      this.detailedScenariosSection(content.scenarios),
      this.pageObjectsSection(content.pageObjectsRequired, content.screenObjectsRequired),
      this.apiEndpointsSection(content.apiEndpointsInvolved),
      this.testDataSection(content.testDataRequirements),
      this.footerSection(content),
    ];

    return sections.join('\n\n---\n\n');
  }

  // ─── Sections ────────────────────────────────────────────────────────────

  private headerSection(content: BrdContent): string {
    return [
      `# BRD — ${content.story.key}: ${content.story.summary}`,
      '',
      `| Field | Value |`,
      `|-------|-------|`,
      `| Jira Key | ${content.story.key} |`,
      `| Priority | ${content.story.priority} |`,
      `| Type | ${content.story.type} |`,
      `| Platform | ${content.story.platform} |`,
      `| Status | ${content.story.status} |`,
      `| Generated At | ${content.generatedAt} |`,
      `| Total Scenarios | ${content.scenarios.length} |`,
    ].join('\n');
  }

  private storyOverviewSection(story: ParsedStory): string {
    return [
      `## Story Overview`,
      '',
      `**Summary:** ${story.summary}`,
      '',
      `**Description:**`,
      story.description || '_No description provided._',
      '',
      `**Labels:** ${story.labels.length > 0 ? story.labels.map((l) => `\`${l}\``).join(', ') : '_None_'}`,
      `**Components:** ${story.components.length > 0 ? story.components.map((c) => `\`${c}\``).join(', ') : '_None_'}`,
    ].join('\n');
  }

  private acceptanceCriteriaSection(story: ParsedStory): string {
    if (story.acceptanceCriteria.length === 0) {
      return [
        `## Acceptance Criteria`,
        '',
        '_No acceptance criteria could be extracted from the Jira story. The Planner Agent generated test scenarios based on the story summary and description._',
      ].join('\n');
    }

    const items = story.acceptanceCriteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n');
    return [`## Acceptance Criteria`, '', items].join('\n');
  }

  private testScenarioMatrixSection(scenarios: TestScenario[]): string {
    const header = [
      `## Test Scenario Matrix`,
      '',
      `| ID | Type | Platform | Summary | Priority |`,
      `|----|------|----------|---------|----------|`,
    ];

    const rows = scenarios.map((s) => `| ${s.id} | ${s.type} | ${s.platform} | ${s.summary} | ${s.priority} |`);

    return [...header, ...rows].join('\n');
  }

  private detailedScenariosSection(scenarios: TestScenario[]): string {
    const sections = scenarios.map((scenario) => {
      const steps = scenario.steps.map((step, i) => `| ${i + 1} | ${step} |`).join('\n');

      const objects =
        [
          ...(scenario.pageObjects || []).map((po) => `\`${po}\` (Web POM)`),
          ...(scenario.screenObjects || []).map((so) => `\`${so}\` (Mobile Screen)`),
        ].join(', ') || '_None specified_';

      return [
        `### ${scenario.id}: ${scenario.summary}`,
        '',
        `| Field | Value |`,
        `|-------|-------|`,
        `| Type | ${scenario.type} |`,
        `| Platform | ${scenario.platform} |`,
        `| Priority | ${scenario.priority} |`,
        `| Objects | ${objects} |`,
        '',
        `**Test Steps:**`,
        '',
        `| Step | Action |`,
        `|------|--------|`,
        steps,
        '',
        `**Expected Result:** ${scenario.expectedResult}`,
      ].join('\n');
    });

    return [`## Detailed Test Scenarios`, '', ...sections].join('\n\n');
  }

  private pageObjectsSection(pageObjects: string[], screenObjects: string[]): string {
    const webItems =
      pageObjects.length > 0 ? pageObjects.map((po) => `- \`${po}\``).join('\n') : '_No web page objects required._';

    const mobileItems =
      screenObjects.length > 0
        ? screenObjects.map((so) => `- \`${so}\``).join('\n')
        : '_No mobile screen objects required._';

    return [
      `## Required Objects`,
      '',
      `### Web Page Objects (POM)`,
      webItems,
      '',
      `### Mobile Screen Objects`,
      mobileItems,
    ].join('\n');
  }

  private apiEndpointsSection(endpoints: string[]): string {
    if (endpoints.length === 0) {
      return [`## API Endpoints`, '', '_No API endpoints involved._'].join('\n');
    }

    const items = endpoints.map((ep) => `- \`${ep}\``).join('\n');
    return [`## API Endpoints Involved`, '', items].join('\n');
  }

  private testDataSection(requirements: string[]): string {
    if (requirements.length === 0) {
      return [`## Test Data Requirements`, '', '_No special test data requirements._'].join('\n');
    }

    const items = requirements.map((req) => `- ${req}`).join('\n');
    return [`## Test Data Requirements`, '', items].join('\n');
  }

  private footerSection(content: BrdContent): string {
    return [
      `## Generator Instructions`,
      '',
      `> This BRD was auto-generated by the Planner Agent from Jira story ${content.story.key}.`,
      `> The Generator Agent should use this document to create test scripts following`,
      `> the framework conventions defined in \`agents/generator/PromptTemplates.ts\`.`,
      `>`,
      `> **Platform:** ${content.story.platform}`,
      `> - Web tests → \`tests/ui/\` using Page Objects from \`pages/\``,
      `> - Mobile web tests → \`tests/mobile-web/\` using Playwright mobile emulation`,
      `> - Native mobile tests → \`tests/mobile/\` using Screen Objects from \`screens/\``,
      `> - API tests → \`tests/api/\` using API clients from \`api/\``,
    ].join('\n');
  }
}
