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

    // 5. Security Guardrails — Secrets & Credential Leak Prevention
    this.validateSecurityGuardrails(code, targetPath, errors, warnings);

    // 6. Vulnerability Detection — OWASP-Aligned InfoSec Checks
    this.validateVulnerabilities(code, targetPath, errors, warnings);

    // 7. TypeScript Compilation Check (write temp file, run tsc --noEmit)
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

  // ─── Security Guardrails — Secrets & Credential Leak Prevention ──────────

  private validateSecurityGuardrails(
    code: string,
    targetPath: string,
    errors: string[],
    warnings: string[],
  ): void {
    // 5a. Hardcoded Secrets Detection (API keys, tokens, passwords, connection strings)
    const secretPatterns: Array<{ pattern: RegExp; label: string; severity: 'error' | 'warning' }> = [
      { pattern: /['"](?:sk|pk|rk)[-_](?:live|test|prod)[a-zA-Z0-9]{20,}['"]/g, label: 'API secret key', severity: 'error' },
      { pattern: /['"](?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{30,}['"]/g, label: 'GitHub token', severity: 'error' },
      { pattern: /['"]xox[bpors]-[a-zA-Z0-9-]{20,}['"]/g, label: 'Slack token', severity: 'error' },
      { pattern: /['"]AKIA[0-9A-Z]{16}['"]/g, label: 'AWS Access Key', severity: 'error' },
      { pattern: /['"]eyJ[a-zA-Z0-9_-]{50,}\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+['"]/g, label: 'JWT token', severity: 'error' },
      { pattern: /(?:password|passwd|pwd|secret)\s*[:=]\s*['"][^'"]{4,}['"]/gi, label: 'Hardcoded password/secret', severity: 'error' },
      { pattern: /(?:mongodb|postgres|mysql|redis):\/\/[^'")\s]{10,}/gi, label: 'Database connection string', severity: 'error' },
      { pattern: /['"][A-Za-z0-9+/]{40,}={0,2}['"]/g, label: 'Possible Base64-encoded secret', severity: 'warning' },
    ];

    for (const { pattern, label, severity } of secretPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        const msg = `SECURITY: ${label} detected in code (${matches.length} occurrence(s)). Use environment variables via process.env instead.`;
        severity === 'error' ? errors.push(msg) : warnings.push(msg);
      }
    }

    // 5b. Dangerous Function Usage
    if (/\beval\s*\(/.test(code)) {
      errors.push('SECURITY: eval() usage detected — high risk for code injection attacks. Remove immediately.');
    }
    if (/new\s+Function\s*\(/.test(code)) {
      errors.push('SECURITY: new Function() constructor detected — equivalent to eval(), code injection risk.');
    }
    if (/child_process.*exec\b/.test(code) && !targetPath.includes('CodeValidator')) {
      warnings.push('SECURITY: child_process exec usage detected — risk of command injection. Use execFile() with args array instead.');
    }

    // 5c. Insecure Protocol Usage
    const httpUrls = code.match(/['"]http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)[^'"]+['"]/g);
    if (httpUrls) {
      warnings.push(
        `SECURITY: ${httpUrls.length} insecure HTTP URL(s) detected. Use HTTPS for all non-local endpoints.`,
      );
    }

    // 5d. Disabled Security Controls
    if (/rejectUnauthorized\s*:\s*false/.test(code)) {
      errors.push('SECURITY: TLS certificate validation disabled (rejectUnauthorized: false). This enables MITM attacks.');
    }
    if (/NODE_TLS_REJECT_UNAUTHORIZED.*['"]0['"]/.test(code)) {
      errors.push('SECURITY: NODE_TLS_REJECT_UNAUTHORIZED=0 disables all TLS validation globally. Critical vulnerability.');
    }
  }

  // ─── Vulnerability Detection — OWASP-Aligned InfoSec Checks ─────────────

  private validateVulnerabilities(
    code: string,
    targetPath: string,
    errors: string[],
    warnings: string[],
  ): void {
    // 6a. XSS — Cross-Site Scripting Detection
    if (/\.innerHTML\s*=/.test(code)) {
      warnings.push('VULN [XSS]: innerHTML assignment detected — risk of cross-site scripting. Use textContent or sanitize input.');
    }
    if (/document\.write\s*\(/.test(code)) {
      errors.push('VULN [XSS]: document.write() detected — DOM-based XSS vector. Remove and use safe DOM APIs.');
    }
    const unsafeInterpolation = code.match(/\$\{.*(?:user|input|param|query|req\.|body).*\}/gi);
    if (unsafeInterpolation) {
      warnings.push('VULN [XSS]: Template literal with user-controlled data detected. Ensure proper sanitization/encoding.');
    }

    // 6b. SQL Injection Detection
    const sqlInjection = code.match(/(?:query|execute|raw)\s*\(\s*`[^`]*\$\{/g);
    if (sqlInjection) {
      errors.push('VULN [SQLi]: String interpolation in SQL query detected — use parameterized queries ($1, ?) to prevent SQL injection.');
    }

    // 6c. CSRF — Missing Token Validation
    if (/\.post\s*\(|\.put\s*\(|\.delete\s*\(/i.test(code) && targetPath.includes('/api/')) {
      if (!/csrf|xsrf|x-csrf-token|x-xsrf-token/i.test(code)) {
        warnings.push('VULN [CSRF]: State-changing API call without CSRF token header. InfoSec review recommended.');
      }
    }

    // 6d. PII Exposure in Logs
    const piiLogging = code.match(/(?:console\.log|logger\.\w+)\s*\([^)]*(?:ssn|social|creditCard|cardNumber|dateOfBirth|email|phone|password|token|bearer)[^)]*\)/gi);
    if (piiLogging) {
      errors.push('VULN [PII]: Personally Identifiable Information may be logged. Mask or redact sensitive fields before logging.');
    }

    // 6e. Insecure HTTP Headers
    if (/Access-Control-Allow-Origin.*['"]\*['"]/i.test(code)) {
      warnings.push('VULN [CORS]: Wildcard Access-Control-Allow-Origin (*) detected — allows any domain to access the resource.');
    }
    if (/Access-Control-Allow-Credentials.*true/i.test(code) && /Access-Control-Allow-Origin.*\*/i.test(code)) {
      errors.push('VULN [CORS]: Allow-Credentials with wildcard origin — critical misconfiguration that bypasses same-origin policy.');
    }

    // 6f. Open Redirect Detection
    const openRedirect = code.match(/(?:redirect|location\.href|window\.location)\s*=\s*(?:req\.|params\.|query\.)/gi);
    if (openRedirect) {
      errors.push('VULN [Open Redirect]: Redirect using user-controlled input detected — validate against an allowlist of trusted URLs.');
    }

    // 6g. Weak Cryptography
    if (/createHash\s*\(\s*['"](?:md5|sha1)['"]\s*\)/i.test(code)) {
      warnings.push('VULN [Crypto]: Weak hash algorithm (MD5/SHA1) detected. Use SHA-256+ for integrity, bcrypt/argon2 for passwords.');
    }
    if (/DES|RC4|Blowfish/i.test(code) && /createCipher/i.test(code)) {
      errors.push('VULN [Crypto]: Deprecated encryption algorithm detected (DES/RC4/Blowfish). Use AES-256-GCM.');
    }

    // 6h. Dependency & Config Security
    if (/require\s*\(\s*[^'"]/.test(code)) {
      warnings.push('VULN [Injection]: Dynamic require() detected — potential remote code execution if input is user-controlled.');
    }
    if (/\.env\b/.test(code) && /fs\.readFileSync/.test(code) && !/dotenv/i.test(code)) {
      warnings.push('VULN [Config]: Manual .env file reading detected — use dotenv library for safe environment variable loading.');
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
