/**
 * PlannerAgent.ts — AI-Powered BRD Generator
 *
 * Takes a ParsedStory from the Jira Agent and uses an AI model
 * (OpenAI GPT-4o or Google Gemini) to:
 *   1. Analyze the acceptance criteria
 *   2. Identify test scenarios (happy path, negative, edge cases)
 *   3. Determine which Page Objects / Screen Objects are needed
 *   4. Generate a structured BRD markdown file
 *
 * The BRD is the contract between the Planner and the Generator Agent.
 */
import 'dotenv/config';
import OpenAI from 'openai';
import type { ParsedStory } from '../jira/StoryParser';
import { type BrdContent, BrdTemplate, type TestScenario } from './BrdTemplate';
import { LlmCache } from '../utils/LlmCache';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const AI_PROVIDER = process.env.AI_MODEL_PROVIDER || 'openai';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// ─────────────────────────────────────────────────────────────────────────────
// System Prompt for AI Analysis
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a Senior SDET (Software Development Engineer in Test) working on a Playwright + TypeScript test automation framework. Your job is to analyze Jira user stories and produce structured test scenarios.

The framework has these existing components:
- Web Page Objects: BasePage, HomePage, LoginPage, CartPage, CheckoutPage (in pages/)
- Mobile Screen Objects: BaseScreen, LoginScreen, HomeScreen, CartScreen, CheckoutScreen (in screens/)
- API Client: LocationApiClient (in api/)
- Config: envConfig.ts, testConfig.ts, uiConstants.ts, mobileSelectors.ts (in config/)

For each user story, you MUST produce:
1. Test scenarios covering: Happy Path, Negative, Edge Cases
2. For each scenario: ID, type, platform (web/mobile/api), steps, expected result
3. Which Page Objects or Screen Objects are needed
4. Which API endpoints are involved (if any)
5. What test data is required

CRITICAL RULES:
- Every acceptance criterion MUST have at least one test scenario
- Always include at least one negative test
- For "both" platform stories, generate separate web AND mobile scenarios
- Use the exact Page Object names from the framework (HomePage, LoginPage, etc.)
- Mark new Page Objects that don't exist yet with [NEW]

Respond ONLY with valid JSON matching this structure:
{
  "scenarios": [
    {
      "id": "TS-01",
      "type": "Happy Path",
      "platform": "web",
      "summary": "...",
      "steps": ["Step 1", "Step 2"],
      "expectedResult": "...",
      "priority": "Critical",
      "pageObjects": ["HomePage", "LoginPage"],
      "screenObjects": []
    }
  ],
  "pageObjectsRequired": ["HomePage", "LoginPage"],
  "screenObjectsRequired": [],
  "apiEndpointsInvolved": [],
  "testDataRequirements": ["Valid user credentials", "Product search term"]
}`;

// ─────────────────────────────────────────────────────────────────────────────
// Planner Agent
// ─────────────────────────────────────────────────────────────────────────────

export class PlannerAgent {
  private openaiClient: OpenAI | null = null;
  private readonly brdTemplate: BrdTemplate;
  private readonly llmCache: LlmCache;

  constructor() {
    this.brdTemplate = new BrdTemplate();
    this.llmCache = new LlmCache();

    if (AI_PROVIDER === 'openai' && OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({ apiKey: OPENAI_API_KEY });
    }
  }

  /**
   * Generate a BRD from a parsed Jira story.
   * Returns the generated markdown string and issue key.
   */
  async generateBrd(story: ParsedStory): Promise<{ markdown: string; issueKey: string }> {
    console.log(`[PlannerAgent] 📋 Analyzing story: ${story.key} — "${story.summary}"`);
    console.log(`[PlannerAgent] Platform: ${story.platform} | Priority: ${story.priority}`);
    console.log(`[PlannerAgent] Acceptance Criteria: ${story.acceptanceCriteria.length} items`);

    // Step 1: Use AI to analyze the story and generate test scenarios
    const analysis = await this.analyzeStoryWithAI(story);

    // Step 2: Build the BRD content
    const brdContent: BrdContent = {
      story,
      scenarios: analysis.scenarios,
      pageObjectsRequired: analysis.pageObjectsRequired,
      screenObjectsRequired: analysis.screenObjectsRequired,
      apiEndpointsInvolved: analysis.apiEndpointsInvolved,
      testDataRequirements: analysis.testDataRequirements,
      generatedAt: new Date().toISOString(),
    };

    // Step 3: Generate the markdown document
    const markdown = this.brdTemplate.generate(brdContent);

    console.log(`[PlannerAgent] ✅ BRD string generated in memory for: ${story.key}`);
    console.log(`[PlannerAgent] 📊 ${analysis.scenarios.length} test scenarios identified`);

    return { markdown, issueKey: story.key };
  }

  // ─── AI Analysis ─────────────────────────────────────────────────────────

  private async analyzeStoryWithAI(story: ParsedStory): Promise<{
    scenarios: TestScenario[];
    pageObjectsRequired: string[];
    screenObjectsRequired: string[];
    apiEndpointsInvolved: string[];
    testDataRequirements: string[];
  }> {
    const userPrompt = this.buildUserPrompt(story);

    // Check LLM Cache first (Instant 100% token savings!)
    const cachedResult = await this.llmCache.get<any>(userPrompt);
    if (cachedResult) {
      return cachedResult;
    }

    let result: any;
    if (this.openaiClient) {
      result = await this.analyzeWithOpenAI(userPrompt);
    } else {
      // Fallback: Generate basic scenarios from acceptance criteria
      console.log('[PlannerAgent] ⚠️ No AI model configured. Using rule-based scenario generation.');
      result = this.generateFallbackScenarios(story);
    }

    // Save to Cache for future runs
    await this.llmCache.set(userPrompt, result);
    return result;
  }

  private buildUserPrompt(story: ParsedStory): string {
    return [
      `Analyze this Jira story and generate test scenarios:`,
      ``,
      `**Story Key:** ${story.key}`,
      `**Summary:** ${story.summary}`,
      `**Priority:** ${story.priority}`,
      `**Type:** ${story.type}`,
      `**Platform:** ${story.platform}`,
      ``,
      `**Description:**`,
      story.description || '_No description_',
      ``,
      `**Acceptance Criteria:**`,
      story.acceptanceCriteria.length > 0
        ? story.acceptanceCriteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')
        : '_No acceptance criteria extracted_',
      ``,
      `**Labels:** ${story.labels.join(', ') || 'None'}`,
      `**Components:** ${story.components.join(', ') || 'None'}`,
    ].join('\n');
  }

  private async analyzeWithOpenAI(userPrompt: string): Promise<{
    scenarios: TestScenario[];
    pageObjectsRequired: string[];
    screenObjectsRequired: string[];
    apiEndpointsInvolved: string[];
    testDataRequirements: string[];
  }> {
    if (!this.openaiClient) {
      throw new Error('[PlannerAgent] OpenAI client not initialized');
    }

    const response = await this.openaiClient.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Low temperature for consistent, structured output
      max_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('[PlannerAgent] Empty response from OpenAI');
    }

    try {
      return JSON.parse(content);
    } catch {
      throw new Error(`[PlannerAgent] Failed to parse AI response as JSON: ${content.substring(0, 200)}`);
    }
  }

  // ─── Fallback (No AI) ───────────────────────────────────────────────────

  /**
   * Rule-based scenario generation when no AI model is configured.
   * Creates basic test scenarios from acceptance criteria.
   */
  private generateFallbackScenarios(story: ParsedStory): {
    scenarios: TestScenario[];
    pageObjectsRequired: string[];
    screenObjectsRequired: string[];
    apiEndpointsInvolved: string[];
    testDataRequirements: string[];
  } {
    const scenarios: TestScenario[] = [];
    let counter = 1;

    // Generate a happy path scenario for each acceptance criterion
    for (const ac of story.acceptanceCriteria) {
      scenarios.push({
        id: `TS-${String(counter).padStart(2, '0')}`,
        type: 'Happy Path',
        platform: story.platform === 'both' ? 'web' : story.platform,
        summary: `Verify: ${ac.substring(0, 80)}${ac.length > 80 ? '...' : ''}`,
        steps: [
          `Navigate to the relevant page`,
          `Perform the action described in the AC`,
          `Verify the expected outcome`,
        ],
        expectedResult: ac,
        priority: story.priority,
        pageObjects: story.platform !== 'mobile' ? ['HomePage'] : [],
        screenObjects: story.platform !== 'web' ? ['HomeScreen'] : [],
      });
      counter++;
    }

    // Always add a negative test
    scenarios.push({
      id: `TS-${String(counter).padStart(2, '0')}`,
      type: 'Negative',
      platform: story.platform === 'both' ? 'web' : story.platform,
      summary: `[Negative] Verify system handles invalid input gracefully`,
      steps: [
        `Navigate to the relevant page`,
        `Enter invalid or empty data`,
        `Submit the form/action`,
        `Verify error handling`,
      ],
      expectedResult: 'System displays appropriate error message and does not crash',
      priority: 'High',
      pageObjects: story.platform !== 'mobile' ? ['HomePage'] : [],
      screenObjects: story.platform !== 'web' ? ['HomeScreen'] : [],
    });

    return {
      scenarios,
      pageObjectsRequired: story.platform !== 'mobile' ? ['HomePage'] : [],
      screenObjectsRequired: story.platform !== 'web' ? ['HomeScreen'] : [],
      apiEndpointsInvolved: [],
      testDataRequirements: ['Valid test credentials', 'Test environment URL'],
    };
  }

  // ─── File Output ─────────────────────────────────────────────────────────

  // File system operations have been moved to the MCP Tool layer to enforce Separation of Concerns.
}
