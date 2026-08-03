/**
 * runTestsTool.ts — MCP Tool: Execute Playwright Tests
 */
import { execSync } from 'child_process';
import * as path from 'path';

export const runTestsToolDefinition = {
  name: 'run_tests',
  description:
    'Executes Playwright web tests with optional targeting for local, BrowserStack, or mobile-web emulation.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      specs: {
        type: 'array',
        items: { type: 'string' },
        description: 'Specific spec files to run (optional, runs all if empty)',
      },
      target: {
        type: 'string',
        enum: ['local', 'browserstack', 'mobile-web'],
        description: 'Execution target (default: local)',
      },
      headed: { type: 'boolean', description: 'Run in headed mode (default: false)' },
    },
  },
};

export async function executeRunTests(args: {
  specs?: string[];
  target?: string;
  headed?: boolean;
}): Promise<{ exitCode: number; output: string }> {
  const projectRoot = path.resolve(__dirname, '../..');
  const target = args.target || 'local';
  const envPrefix = target !== 'local' ? `EXECUTION_TARGET=${target} ` : '';
  const headedFlag = args.headed ? '--headed' : '';
  const specFiles = args.specs?.join(' ') || '';

  const command = `${envPrefix}npx playwright test ${specFiles} ${headedFlag}`.trim();

  try {
    const output = execSync(command, {
      cwd: projectRoot,
      encoding: 'utf-8',
      timeout: 300000,
      env: { ...process.env, EXECUTION_TARGET: target },
    });
    return { exitCode: 0, output };
  } catch (error: unknown) {
    const execError = error as { status?: number; stdout?: string; stderr?: string };
    return {
      exitCode: execError.status || 1,
      output: execError.stdout || execError.stderr || 'Unknown error',
    };
  }
}
