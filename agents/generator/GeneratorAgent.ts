/**
 * GeneratorAgent.ts — AI-Powered Test Script Generator
 *
 * Reads a BRD markdown file produced by the Planner Agent and generates
 * production-ready Playwright/Appium test scripts that match the exact
 * coding style of this framework.
 *
 * The Generator uses few-shot prompting with existing spec files as examples,
 * ensuring that AI-generated code is indistinguishable from hand-written code.
 */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import {
  API_TEST_SYSTEM_PROMPT,
  MOBILE_WEB_SYSTEM_PROMPT,
  NATIVE_MOBILE_SYSTEM_PROMPT,
  PAGE_OBJECT_SYSTEM_PROMPT,
  SCREEN_OBJECT_SYSTEM_PROMPT,
  WEB_UI_SYSTEM_PROMPT,
} from './PromptTemplates';
import { CodeValidator, type ValidationResult } from './CodeValidator';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'test' | 'pageObject' | 'screenObject' | 'config';
  validation: ValidationResult;
}

export interface GenerationResult {
  brdPath: string;
  generatedFiles: GeneratedFile[];
  summary: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generator Agent
// ─────────────────────────────────────────────────────────────────────────────

export class GeneratorAgent {
  private openaiClient: OpenAI | null = null;
  private readonly codeValidator: CodeValidator;
  private readonly projectRoot: string;

  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..');
    this.codeValidator = new CodeValidator(this.projectRoot);

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openaiClient = new OpenAI({ apiKey });
    }
  }

  /**
   * Generate test scripts from a BRD markdown file.
   * Returns paths to all generated files.
   */
  async generateFromBrd(brdPath: string): Promise<GenerationResult> {
    console.log(`[GeneratorAgent] 🔧 Reading BRD: ${brdPath}`);

    const brdContent = fs.readFileSync(brdPath, 'utf-8');
    const generatedFiles: GeneratedFile[] = [];

    // Parse the BRD to determine what platform(s) to generate for
    const platforms = this.detectPlatforms(brdContent);
    console.log(`[GeneratorAgent] Platforms detected: ${platforms.join(', ')}`);

    // Load existing code examples for few-shot prompting
    const examples = this.loadExistingExamples();

    // Generate tests for each platform
    for (const platform of platforms) {
      const files = await this.generateForPlatform(platform, brdContent, examples);
      generatedFiles.push(...files);
    }

    const result: GenerationResult = {
      brdPath,
      generatedFiles,
      summary: this.buildSummary(generatedFiles),
    };

    console.log(`[GeneratorAgent] ✅ Generation complete: ${generatedFiles.length} files`);
    return result;
  }

  // ─── Platform Detection ──────────────────────────────────────────────────

  private detectPlatforms(brdContent: string): string[] {
    const platforms: string[] = [];

    if (
      brdContent.includes('Platform | web') ||
      brdContent.includes('platform: web') ||
      brdContent.includes('| web |')
    ) {
      platforms.push('web');
    }
    if (
      brdContent.includes('Platform | mobile') ||
      brdContent.includes('platform: mobile') ||
      brdContent.includes('| mobile |')
    ) {
      platforms.push('mobile');
    }
    if (
      brdContent.includes('Platform | api') ||
      brdContent.includes('platform: api') ||
      brdContent.includes('| api |')
    ) {
      platforms.push('api');
    }
    if (brdContent.includes('Platform | both')) {
      platforms.push('web', 'mobile');
    }

    // Default to web if no platform detected
    if (platforms.length === 0) {
      platforms.push('web');
    }

    return [...new Set(platforms)];
  }

  // ─── Load Existing Examples ──────────────────────────────────────────────

  private loadExistingExamples(): Record<string, string> {
    const examples: Record<string, string> = {};
    const filesToLoad = {
      webTest: 'tests/ui/ecommerce.spec.ts',
      apiTest: 'tests/api/location.spec.ts',
      pageObject: 'pages/HomePage.ts',
      basePage: 'pages/BasePage.ts',
      uiConstants: 'config/uiConstants.ts',
      testConfig: 'config/testConfig.ts',
    };

    for (const [key, relativePath] of Object.entries(filesToLoad)) {
      const fullPath = path.join(this.projectRoot, relativePath);
      if (fs.existsSync(fullPath)) {
        // Limit to first 100 lines for context window efficiency
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n').slice(0, 100).join('\n');
        examples[key] = lines;
      }
    }

    return examples;
  }

  // ─── Generate for Platform ───────────────────────────────────────────────

  private async generateForPlatform(
    platform: string,
    brdContent: string,
    examples: Record<string, string>,
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    switch (platform) {
      case 'web': {
        const testCode = await this.generateCode(
          WEB_UI_SYSTEM_PROMPT,
          this.buildGenerationPrompt(brdContent, platform, examples),
        );
        const testPath = this.getNextTestPath('tests/ui', 'generated');
        const validation = await this.codeValidator.validate(testCode, testPath);
        files.push({ path: testPath, content: testCode, type: 'test', validation });
        break;
      }
      case 'api': {
        const testCode = await this.generateCode(
          API_TEST_SYSTEM_PROMPT,
          this.buildGenerationPrompt(brdContent, platform, examples),
        );
        const testPath = this.getNextTestPath('tests/api', 'generated');
        const validation = await this.codeValidator.validate(testCode, testPath);
        files.push({ path: testPath, content: testCode, type: 'test', validation });
        break;
      }
      case 'mobile': {
        // Mobile Web tests
        const mobileWebCode = await this.generateCode(
          MOBILE_WEB_SYSTEM_PROMPT,
          this.buildGenerationPrompt(brdContent, 'mobile-web', examples),
        );
        const mobileWebPath = this.getNextTestPath('tests/mobile-web', 'generated');
        const mwValidation = await this.codeValidator.validate(mobileWebCode, mobileWebPath);
        files.push({ path: mobileWebPath, content: mobileWebCode, type: 'test', validation: mwValidation });

        // Native Mobile tests
        const nativeCode = await this.generateCode(
          NATIVE_MOBILE_SYSTEM_PROMPT,
          this.buildGenerationPrompt(brdContent, 'native-mobile', examples),
        );
        const nativePath = this.getNextTestPath('tests/mobile', 'generated');
        const nativeValidation = await this.codeValidator.validate(nativeCode, nativePath);
        files.push({ path: nativePath, content: nativeCode, type: 'test', validation: nativeValidation });
        break;
      }
    }

    return files;
  }

  // ─── AI Code Generation ──────────────────────────────────────────────────

  private async generateCode(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.openaiClient) {
      console.log('[GeneratorAgent] ⚠️ No AI model configured. Generating scaffold code.');
      return this.generateScaffold(userPrompt);
    }

    const response = await this.openaiClient.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 8192,
    });

    let content = response.choices[0]?.message?.content || '';

    // Strip markdown code fences if present
    content = content.replace(/^```(?:typescript|ts)?\n/gm, '').replace(/```$/gm, '');

    return content.trim();
  }

  private buildGenerationPrompt(brdContent: string, platform: string, examples: Record<string, string>): string {
    const parts = [
      `Generate ${platform} test code based on this BRD:`,
      '',
      '--- BRD START ---',
      brdContent,
      '--- BRD END ---',
      '',
    ];

    // Add relevant examples for few-shot learning
    if (platform === 'web' && examples.webTest) {
      parts.push('--- EXAMPLE (existing web test — match this style EXACTLY) ---');
      parts.push(examples.webTest);
      parts.push('--- END EXAMPLE ---');
    }

    if (platform === 'api' && examples.apiTest) {
      parts.push('--- EXAMPLE (existing API test — match this style EXACTLY) ---');
      parts.push(examples.apiTest);
      parts.push('--- END EXAMPLE ---');
    }

    if (examples.uiConstants) {
      parts.push('--- EXISTING LOCATORS (uiConstants.ts) ---');
      parts.push(examples.uiConstants);
      parts.push('--- END LOCATORS ---');
    }

    return parts.join('\n');
  }

  // ─── Scaffold (Fallback) ─────────────────────────────────────────────────

  private generateScaffold(userPrompt: string): string {
    return [
      `import { test, expect } from '@playwright/test';`,
      ``,
      `/**`,
      ` * AI-Generated Test Scaffold`,
      ` * Generated by the Generator Agent (no AI model configured — scaffold only)`,
      ` *`,
      ` * TODO: Fill in test logic based on the BRD`,
      ` */`,
      `test.describe('Generated Test Suite', () => {`,
      `  test.beforeEach(async ({ page }) => {`,
      `    // TODO: Initialize Page Objects`,
      `  });`,
      ``,
      `  test('TODO: Implement test from BRD', async ({ page }) => {`,
      `    // TODO: Implement based on BRD scenarios`,
      `    expect(true).toBe(true);`,
      `  });`,
      `});`,
    ].join('\n');
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private getNextTestPath(dir: string, prefix: string): string {
    const fullDir = path.join(this.projectRoot, dir);
    if (!fs.existsSync(fullDir)) {
      fs.mkdirSync(fullDir, { recursive: true });
    }

    const timestamp = Date.now();
    return path.join(dir, `${prefix}-${timestamp}.spec.ts`);
  }

  /**
   * Write all generated files to disk.
   */
  async writeGeneratedFiles(result: GenerationResult): Promise<string[]> {
    const writtenPaths: string[] = [];

    for (const file of result.generatedFiles) {
      const fullPath = path.join(this.projectRoot, file.path);
      const dir = path.dirname(fullPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(fullPath, file.content, 'utf-8');
      writtenPaths.push(fullPath);

      const status = file.validation.isValid ? '✅' : '⚠️';
      console.log(`[GeneratorAgent] ${status} Written: ${file.path}`);

      if (file.validation.warnings.length > 0) {
        file.validation.warnings.forEach((w) => console.log(`  ⚠️ ${w}`));
      }
      if (file.validation.errors.length > 0) {
        file.validation.errors.forEach((e) => console.log(`  ❌ ${e}`));
      }
    }

    return writtenPaths;
  }

  private buildSummary(files: GeneratedFile[]): string {
    const valid = files.filter((f) => f.validation.isValid).length;
    const warnings = files.reduce((sum, f) => sum + f.validation.warnings.length, 0);
    return `Generated ${files.length} files (${valid} valid, ${warnings} warnings)`;
  }
}
