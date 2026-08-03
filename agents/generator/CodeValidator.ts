/**
 * CodeValidator.ts — Post-Generation Code Validation
 *
 * Validates AI-generated TypeScript code before it is written to the filesystem.
 * Catches common issues: compilation errors, missing imports, invalid locator references.
 */
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class CodeValidator {
  private readonly projectRoot: string;

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || path.resolve(__dirname, '../..');
  }

  /**
   * Run all validation checks on the generated code.
   */
  async validate(code: string, targetPath: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Syntax & Import Validation
    this.validateImports(code, targetPath, errors, warnings);

    // 2. Framework Convention Checks
    this.validateConventions(code, targetPath, errors, warnings);

    // 3. Locator Reference Validation
    this.validateLocatorReferences(code, errors, warnings);

    // 4. Test Data Reference Validation
    this.validateTestDataReferences(code, errors, warnings);

    // 5. TypeScript Compilation Check (write temp file, run tsc --noEmit)
    await this.validateTypeScript(code, targetPath, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ─── Import Validation ───────────────────────────────────────────────────

  private validateImports(code: string, targetPath: string, errors: string[], warnings: string[]): void {
    const importLines = code.match(/^import\s+.*from\s+['"](.+)['"]/gm) || [];

    for (const importLine of importLines) {
      const match = importLine.match(/from\s+['"](.+)['"]/);
      if (!match) {
        continue;
      }

      const importPath = match[1];

      // Skip node_modules imports
      if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
        continue;
      }

      // Resolve relative to target file's directory
      const targetDir = path.dirname(path.resolve(this.projectRoot, targetPath));
      const resolvedPath = path.resolve(targetDir, importPath);

      // Check if the file exists (with .ts extension)
      const possiblePaths = [resolvedPath, `${resolvedPath}.ts`, `${resolvedPath}/index.ts`];
      const exists = possiblePaths.some((p) => fs.existsSync(p));

      if (!exists) {
        warnings.push(`Import "${importPath}" may not resolve — file not found at expected locations.`);
      }
    }
  }

  // ─── Framework Convention Checks ─────────────────────────────────────────

  private validateConventions(code: string, targetPath: string, errors: string[], warnings: string[]): void {
    const isTestFile = targetPath.includes('/tests/');
    const isPageObject = targetPath.includes('/pages/');
    const isScreenObject = targetPath.includes('/screens/');

    if (isTestFile) {
      // Check: No raw page.locator() in test files (should use Page Objects)
      const rawLocators = code.match(/page\.locator\(/g);
      if (rawLocators && rawLocators.length > 2) {
        warnings.push(
          `Found ${rawLocators.length} raw page.locator() calls in test file. ` +
            `Consider using Page Object methods instead.`,
        );
      }

      // Check: No hardcoded URLs in test files
      const hardcodedUrls = code.match(/['"]https?:\/\/[^'"]+['"]/g);
      if (hardcodedUrls) {
        warnings.push(
          `Found ${hardcodedUrls.length} hardcoded URL(s) in test file. ` +
            `URLs should come from config/envConfig.ts.`,
        );
      }

      // Check: No hardcoded passwords
      if (code.includes("'Password") || code.includes('"Password')) {
        errors.push('Hardcoded password detected. Use testConfig.password instead.');
      }
    }

    if (isPageObject) {
      // Check: Extends BasePage
      if (!code.includes('extends BasePage')) {
        errors.push('Page Object must extend BasePage.');
      }
    }

    if (isScreenObject) {
      // Check: Extends BaseScreen
      if (!code.includes('extends BaseScreen')) {
        errors.push('Screen Object must extend BaseScreen.');
      }
    }
  }

  // ─── Locator Reference Validation ────────────────────────────────────────

  private validateLocatorReferences(code: string, errors: string[], warnings: string[]): void {
    // Extract all LOCATORS.XXX.YYY references
    const locatorRefs = code.match(/LOCATORS\.\w+\.\w+/g) || [];

    if (locatorRefs.length > 0) {
      // Try to load the existing uiConstants to verify references
      const uiConstantsPath = path.join(this.projectRoot, 'config', 'uiConstants.ts');
      if (fs.existsSync(uiConstantsPath)) {
        const uiConstantsContent = fs.readFileSync(uiConstantsPath, 'utf-8');

        for (const ref of locatorRefs) {
          const parts = ref.split('.');
          const section = parts[1]; // e.g., 'HOME'
          const key = parts[2]; // e.g., 'SEARCH_INPUT'

          // Simple text-based check (not full AST parsing)
          if (!uiConstantsContent.includes(section) || !uiConstantsContent.includes(key)) {
            warnings.push(`Locator reference "${ref}" may not exist in uiConstants.ts.`);
          }
        }
      }
    }
  }

  // ─── Test Data Reference Validation ──────────────────────────────────────

  private validateTestDataReferences(code: string, errors: string[], warnings: string[]): void {
    const testConfigRefs = code.match(/testConfig\.\w+/g) || [];

    if (testConfigRefs.length > 0) {
      const testConfigPath = path.join(this.projectRoot, 'config', 'testConfig.ts');
      if (fs.existsSync(testConfigPath)) {
        const testConfigContent = fs.readFileSync(testConfigPath, 'utf-8');

        for (const ref of testConfigRefs) {
          const key = ref.split('.')[1];
          if (!testConfigContent.includes(key)) {
            warnings.push(`Test data reference "${ref}" may not exist in testConfig.ts.`);
          }
        }
      }
    }
  }

  // ─── TypeScript Compilation ──────────────────────────────────────────────

  private async validateTypeScript(
    code: string,
    targetPath: string,
    errors: string[],
    warnings: string[],
  ): Promise<void> {
    const tempDir = path.join(this.projectRoot, '.temp-validation');
    const tempFile = path.join(tempDir, 'validate.ts');

    try {
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      fs.writeFileSync(tempFile, code, 'utf-8');

      execSync(`npx tsc --noEmit --strict --skipLibCheck "${tempFile}" 2>&1`, {
        cwd: this.projectRoot,
        timeout: 15000,
      });
    } catch (error: unknown) {
      const tscError = error as { stdout?: Buffer; stderr?: Buffer };
      const output = tscError.stdout?.toString() || tscError.stderr?.toString() || '';
      const tscErrors = output
        .split('\n')
        .filter((line: string) => line.includes('error TS'))
        .slice(0, 5); // Limit to 5 errors

      if (tscErrors.length > 0) {
        warnings.push(`TypeScript compilation warnings:\n  ${tscErrors.join('\n  ')}`);
      }
    } finally {
      // Cleanup
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
      if (fs.existsSync(tempDir)) {
        fs.rmdirSync(tempDir);
      }
    }
  }
}
